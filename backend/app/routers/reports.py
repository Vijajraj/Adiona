"""Report endpoints — spec §9.

POST /reports              → create a new safety report
POST /reports/{id}/confirm → confirm an existing report
GET  /reports/heatmap      → aggregated heatmap data
"""

import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy import func, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db import get_db
from app.models import AffectedGroup, Confirmation, Report, ReportCategory
from app.schemas import (
    ConfirmRequest,
    ConfirmResponse,
    HeatmapPoint,
    ReportCreate,
    ReportResponse,
)
from app.services.geo_validator import validate_chennai_bounds
from app.services.grid_snap import snap_to_grid
from app.services.profanity import check_profanity
from app.services.rate_limiter import (
    check_device_daily_limit,
    check_grid_cell_cooldown,
)

router = APIRouter(prefix="/reports", tags=["reports"])

# IP-level rate limiter
limiter = Limiter(key_func=get_remote_address)


# --------------------------------------------------------------------------
# POST /reports
# --------------------------------------------------------------------------
@router.post("", response_model=ReportResponse, status_code=201)
@limiter.limit(f"{settings.MAX_REPORTS_PER_IP_PER_DAY}/day")
async def create_report(
    body: ReportCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Create a new safety report.

    Pipeline (spec §9):
      validate Chennai bounds → device rate-limit → grid-snap
      → grid-cell cooldown → profanity check → insert.
    """
    # 1. Geo-validation (server-side, authoritative — spec §10)
    validate_chennai_bounds(body.lat, body.lng)

    # 2. Device daily rate limit
    await check_device_daily_limit(db, body.device_id)

    # 3. Grid-snap coordinates
    grid_lat, grid_lng = snap_to_grid(body.lat, body.lng)

    # 4. Per-cell cooldown
    await check_grid_cell_cooldown(db, body.device_id, grid_lat, grid_lng)

    # 5. Profanity check — flag, don't reject (spec §10)
    is_flagged = check_profanity(body.note)

    # 6. Insert with DB constraint protection against race conditions
    report = Report(
        grid_lat=grid_lat,
        grid_lng=grid_lng,
        status=body.status,
        category=body.category,
        affected_group=body.affected_group,
        note=body.note,
        device_id=body.device_id,
        is_flagged=is_flagged,
    )
    db.add(report)
    try:
        await db.commit()
    except Exception as exc:
        await db.rollback()
        if isinstance(exc, IntegrityError) or "UNIQUE" in str(exc).upper() or "uq_reports" in str(exc):
            raise HTTPException(
                status_code=429,
                detail="You have already reported this location within the last 24 hours.",
            )
        raise exc

    return report


# --------------------------------------------------------------------------
# POST /reports/{id}/confirm
# --------------------------------------------------------------------------
@router.post("/{report_id}/confirm", response_model=ConfirmResponse)
@limiter.limit(f"{settings.MAX_REPORTS_PER_IP_PER_DAY}/day")
async def confirm_report(
    report_id: str,
    body: ConfirmRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Confirm an existing report — increments its weight on the heatmap.

    One confirm per device per report (spec §9).
    Uses atomic SQL increment to prevent race conditions.
    """
    # Validate report_id UUID format
    try:
        uuid.UUID(report_id)
    except (ValueError, AttributeError, TypeError):
        raise HTTPException(status_code=400, detail="Invalid report_id format.")

    # Check report exists
    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found.")

    # Prevent self-confirmation
    if report.device_id == body.device_id:
        raise HTTPException(
            status_code=400, detail="You cannot confirm your own report."
        )

    # Insert confirmation (unique constraint prevents double-confirm)
    confirmation = Confirmation(
        report_id=report_id,
        device_id=body.device_id,
    )
    db.add(confirmation)
    try:
        await db.flush()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=409, detail="You have already confirmed this report."
        )

    # Atomic SQL increment to avoid read-modify-write race condition
    await db.execute(
        update(Report)
        .where(Report.id == report_id)
        .values(confirmations=Report.confirmations + 1)
    )
    await db.commit()

    # Fetch updated confirmation count
    updated_result = await db.execute(
        select(Report.confirmations).where(Report.id == report_id)
    )
    new_count = updated_result.scalar_one()

    return ConfirmResponse(confirmations=new_count)


# --------------------------------------------------------------------------
# GET /reports/heatmap — with Spec §4.2 Time-Decay Heatmap Weighting
# --------------------------------------------------------------------------
@router.get("/heatmap", response_model=list[HeatmapPoint])
@limiter.limit("120/minute")
async def get_heatmap(
    request: Request,
    category: Optional[ReportCategory] = None,
    hours_back: Optional[int] = Query(None, ge=1, le=8760, description="Time window in hours"),
    affected_group: Optional[AffectedGroup] = None,
    db: AsyncSession = Depends(get_db),
):
    """Return aggregated heatmap data with Spec §4.2 Time-Decay Weighting.

    Older reports without recent confirmations gradually decay in weight (half-life ~30 days,
    floored at 0.1), while confirmed spots retain high intensity.
    """
    import math

    # Query all matching reports to calculate precise time-decay weights per cell
    query = select(
        Report.grid_lat,
        Report.grid_lng,
        Report.id,
        Report.category,
        Report.status,
        Report.confirmations,
        Report.created_at,
    )

    # Strongly-typed filters
    if category:
        query = query.where(Report.category == category)

    if affected_group:
        query = query.where(Report.affected_group == affected_group)

    if hours_back and hours_back > 0:
        cutoff = datetime.now(timezone.utc) - timedelta(hours=hours_back)
        query = query.where(Report.created_at >= cutoff)

    result = await db.execute(query)
    reports = result.all()

    now = datetime.now(timezone.utc)

    # Group by grid cell and compute time-decayed weight
    cells: dict[tuple[float, float], dict] = {}

    for r in reports:
        key = (r.grid_lat, r.grid_lng)

        # Ensure created_at is timezone-aware
        created_at = r.created_at
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)

        age_days = (now - created_at).total_seconds() / 86400.0
        # Time decay exponential formula: e^(-0.023 * age_days) -> ~30 day half-life, min floor 0.10
        base_decayed_weight = max(0.10, math.exp(-0.023 * max(0.0, age_days)))
        report_weight = base_decayed_weight + float(r.confirmations or 0)

        if key not in cells:
            cells[key] = {
                "lat": r.grid_lat,
                "lng": r.grid_lng,
                "weight": 0.0,
                "id": r.id,
                "category": r.category,
                "status": r.status,
                "confirmations": 0,
            }

        cells[key]["weight"] += report_weight
        cells[key]["confirmations"] += int(r.confirmations or 0)
        # Keep latest report id/category for primary metadata
        cells[key]["id"] = r.id
        cells[key]["category"] = r.category
        cells[key]["status"] = r.status

    return [
        HeatmapPoint(
            lat=c["lat"],
            lng=c["lng"],
            weight=round(c["weight"], 3),
            id=c["id"],
            category=c["category"],
            status=c["status"],
            confirmations=c["confirmations"],
        )
        for c in cells.values()
    ]
