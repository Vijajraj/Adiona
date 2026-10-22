"""Open Data Aggregated Export — Phase 2 Spec §3.6.

Provides a public CC BY 4.0 licensed aggregated dataset per ~100m grid cell.
Privacy & Integrity Guarantees:
  1. Small-number suppression (K >= 5): cells with fewer than 5 reports are omitted.
  2. No device_id, no free-text notes, no fine timestamps (only date YYYY-MM-DD).
  3. CC BY 4.0 license stated in response headers and JSON payload.
  4. Rate-limited to prevent abuse.
"""

from collections import Counter, defaultdict
from datetime import datetime, timezone
import io
import csv

from fastapi import APIRouter, Depends, Query, Request, Response
from slowapi import Limiter
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models import CellScore, Report, ReportStatus
from app.routers.reports import get_real_ip
from app.schemas import OpenDataExportItem

router = APIRouter(prefix="/export", tags=["open-data"])
limiter = Limiter(key_func=get_real_ip)

MIN_K_THRESHOLD = 5
CC_BY_LICENSE = "Creative Commons Attribution 4.0 International (CC BY 4.0)"


@router.get("/cells", response_model=list[OpenDataExportItem])
@limiter.limit("30/hour")
async def export_aggregated_cells(
    request: Request,
    response: Response,
    format: str = Query("json", pattern="^(json|csv)$", description="Export format (json or csv)"),
    db: AsyncSession = Depends(get_db),
):
    """Export public aggregated safety scores per grid cell under CC BY 4.0 license."""
    response.headers["X-Data-License"] = "CC BY 4.0"
    response.headers["X-Data-Attribution"] = "Adiona Chennai Safety Map Contributors"

    # Fetch all reports
    reports_res = await db.execute(
        select(
            Report.grid_lat,
            Report.grid_lng,
            Report.status,
            Report.category,
            Report.device_id,
            Report.created_at,
        )
    )
    reports = reports_res.all()

    # Group by cell
    cells: dict[tuple[float, float], list] = defaultdict(list)
    for r in reports:
        cells[(r.grid_lat, r.grid_lng)].append(r)

    # Filter with small-number suppression K >= 5 (Spec §3.6)
    qualified_cells = [
        (cell, cell_reports)
        for cell, cell_reports in cells.items()
        if len(cell_reports) >= MIN_K_THRESHOLD
    ]

    items: list[OpenDataExportItem] = []
    for (lat, lng), cell_reports in qualified_cells:
        devs = len({r.device_id for r in cell_reports})
        cat_counts = Counter(r.category.value for r in cell_reports if r.category)
        unsafe_score = float(sum(1 for r in cell_reports if r.status == ReportStatus.unsafe))
        safe_score = float(sum(1 for r in cell_reports if r.status == ReportStatus.safe))

        latest_dt = max(
            (r.created_at for r in cell_reports if r.created_at),
            default=datetime.now(timezone.utc),
        )
        date_str = latest_dt.strftime("%Y-%m-%d")

        items.append(
            OpenDataExportItem(
                grid_lat=lat,
                grid_lng=lng,
                report_count=len(cell_reports),
                score_unsafe=unsafe_score,
                score_safe=safe_score,
                unique_devices=devs,
                category_breakdown=dict(cat_counts),
                last_updated_date=date_str,
                license="CC BY 4.0",
            )
        )

    if format == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "grid_lat",
            "grid_lng",
            "report_count",
            "score_unsafe",
            "score_safe",
            "unique_devices",
            "dominant_category",
            "last_updated_date",
            "license",
        ])
        for it in items:
            dom = max(it.category_breakdown, key=it.category_breakdown.get) if it.category_breakdown else "none"
            writer.writerow([
                it.grid_lat,
                it.grid_lng,
                it.report_count,
                it.score_unsafe,
                it.score_safe,
                it.unique_devices,
                dom,
                it.last_updated_date,
                it.license,
            ])
        return Response(
            content=output.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": 'attachment; filename="chennai_safety_cells_cc_by_4_0.csv"'},
        )

    return items
