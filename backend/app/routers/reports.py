"""Report endpoints — spec §9.

POST /reports              → create a new safety report
POST /reports/{id}/confirm → confirm an existing report
GET  /reports/heatmap      → aggregated heatmap data
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db import get_db
from app.models import Confirmation, Report
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

# IP-level rate limiter — 7 requests/day on POST endpoints (spec §10)
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

    # 6. Insert
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
    await db.commit()
    await db.refresh(report)

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
    """
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

    # Increment counter
    report.confirmations += 1
    await db.commit()

    return ConfirmResponse(confirmations=report.confirmations)


# --------------------------------------------------------------------------
# GET /reports/heatmap
# --------------------------------------------------------------------------
@router.get("/heatmap", response_model=list[HeatmapPoint])
async def get_heatmap(
    category: Optional[str] = None,
    hours_back: Optional[int] = None,
    affected_group: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """Return aggregated heatmap data.

    Weight = count of reports in grid cell + sum of confirmations (spec §8).
    """
    from datetime import datetime, timedelta, timezone

    # Base query: group by grid cell, compute weight and cell metadata
    query = select(
        Report.grid_lat.label("lat"),
        Report.grid_lng.label("lng"),
        (func.count(Report.id) + func.coalesce(func.sum(Report.confirmations), 0)).label("weight"),
        func.max(Report.id).label("id"),
        func.max(Report.category).label("category"),
        func.max(Report.status).label("status"),
        func.coalesce(func.sum(Report.confirmations), 0).label("confirmations"),
    ).group_by(Report.grid_lat, Report.grid_lng)

    # Optional filters
    if category:
        query = query.where(Report.category == category)

    if affected_group:
        query = query.where(Report.affected_group == affected_group)

    if hours_back and hours_back > 0:
        cutoff = datetime.now(timezone.utc) - timedelta(hours=hours_back)
        query = query.where(Report.created_at >= cutoff)

    result = await db.execute(query)
    rows = result.all()

    return [
        HeatmapPoint(
            lat=row.lat,
            lng=row.lng,
            weight=float(row.weight),
            id=row.id,
            category=row.category,
            status=row.status,
            confirmations=row.confirmations,
        )
        for row in rows
    ]
