"""Institutional Dashboard Endpoints — Phase 2 Spec §3.5.

Aggregated, read-only analytics for civic bodies, colleges, and resident associations.
Enforces:
  1. X-Admin-Key protection (returns 403 Forbidden if invalid/missing).
  2. Strict small-number suppression (K >= 5 reports per cell/zone) to prevent identifying individuals.
  3. Zero PII leakage: no device_id, no exact pre-snap coordinates, no free-text notes.
"""

from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Security, status
from fastapi.security import APIKeyHeader
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db import get_db
from app.models import Report, ReportCategory, ReportStatus, TimeBucket
from app.schemas import DashboardSummaryResponse, DashboardTopZoneResponse

router = APIRouter(prefix="/admin/dashboard", tags=["institutional-dashboard"])

api_key_header = APIKeyHeader(name="X-Admin-Key", auto_error=False)

MIN_K_THRESHOLD = 5


async def verify_institutional_admin_key(
    header_key: Optional[str] = Security(api_key_header),
) -> str:
    """Verify admin key from X-Admin-Key header, returning 403 Forbidden if unauthorized (spec §3.5)."""
    if not header_key or header_key != settings.ADMIN_SECRET:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Invalid or missing institutional admin credentials.",
        )
    return header_key


@router.get("/summary", response_model=DashboardSummaryResponse)
async def get_dashboard_summary(
    days_back: int = Query(90, ge=1, le=730, description="Analysis window in days"),
    db: AsyncSession = Depends(get_db),
    admin_auth: str = Depends(verify_institutional_admin_key),
):
    """Aggregated safety summary across Chennai with small-number suppression metrics."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=days_back)

    # Fetch active reports within window
    result = await db.execute(
        select(
            Report.grid_lat,
            Report.grid_lng,
            Report.status,
            Report.category,
            Report.time_bucket,
            Report.device_id,
        ).where(Report.created_at >= cutoff)
    )
    reports = result.all()

    total_reports = len(reports)
    unique_devices = len({r.device_id for r in reports})
    safe_count = sum(1 for r in reports if r.status == ReportStatus.safe)
    unsafe_count = sum(1 for r in reports if r.status == ReportStatus.unsafe)

    # Category counts
    category_counter = Counter(r.category.value for r in reports if r.category)
    top_categories = dict(category_counter.most_common(10))

    # Time bucket counts
    time_counter = Counter(
        (r.time_bucket.value if r.time_bucket else "unknown") for r in reports
    )
    time_bucket_breakdown = dict(time_counter)

    # Cell-level suppression calculation
    cell_counts = Counter((r.grid_lat, r.grid_lng) for r in reports)
    active_cells = sum(1 for c, count in cell_counts.items() if count >= MIN_K_THRESHOLD)
    suppressed_cells = sum(1 for c, count in cell_counts.items() if count < MIN_K_THRESHOLD)

    return DashboardSummaryResponse(
        total_reports=total_reports,
        unique_devices=unique_devices,
        safe_reports_count=safe_count,
        unsafe_reports_count=unsafe_count,
        top_categories=top_categories,
        time_bucket_breakdown=time_bucket_breakdown,
        active_cells_count=active_cells,
        suppressed_cells_count=suppressed_cells,
        min_k_threshold=MIN_K_THRESHOLD,
    )


@router.get("/top-zones", response_model=list[DashboardTopZoneResponse])
async def get_dashboard_top_zones(
    category: Optional[ReportCategory] = Query(None, description="Filter by problem category"),
    limit: int = Query(10, ge=1, le=50, description="Max zones to return"),
    days_back: int = Query(90, ge=1, le=730, description="Analysis window in days"),
    db: AsyncSession = Depends(get_db),
    admin_auth: str = Depends(verify_institutional_admin_key),
):
    """Top flagged geographic zones with strict K >= 5 suppression to prevent identifying individuals."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=days_back)

    query = select(
        Report.grid_lat,
        Report.grid_lng,
        Report.category,
        Report.device_id,
        Report.status,
    ).where(Report.created_at >= cutoff)

    if category:
        query = query.where(Report.category == category)

    result = await db.execute(query)
    reports = result.all()

    # Group by grid cell
    cells: dict[tuple[float, float], list] = defaultdict(list)
    for r in reports:
        cells[(r.grid_lat, r.grid_lng)].append(r)

    # Filter by K >= 5 threshold (Small-number suppression, Spec §3.5)
    eligible_cells = [
        (cell, cell_reports)
        for cell, cell_reports in cells.items()
        if len(cell_reports) >= MIN_K_THRESHOLD
    ]

    # Rank by report count descending
    eligible_cells.sort(key=lambda item: len(item[1]), reverse=True)
    top_items = eligible_cells[:limit]

    output = []
    for (lat, lng), cell_reports in top_items:
        unique_devs = len({r.device_id for r in cell_reports})
        cat_counts = Counter(r.category.value for r in cell_reports if r.category)
        dominant_cat = cat_counts.most_common(1)[0][0] if cat_counts else "general"

        output.append(
            DashboardTopZoneResponse(
                grid_lat=lat,
                grid_lng=lng,
                report_count=len(cell_reports),
                unique_devices=unique_devs,
                score_unsafe=float(len([r for r in cell_reports if r.status == ReportStatus.unsafe])),
                dominant_category=dominant_cat,
                top_categories=dict(cat_counts.most_common(5)),
            )
        )

    return output
