"""Lower-Risk Routing Spike Service — Phase 2 Spec §3.7.

Scores polylines / route geometries against precomputed cell_scores and report flags.
Generates plain-language risk summaries ("passes X cells flagged for poor lighting after dark").
Strictly adheres to phrasing requirement: always label as "lower-reported-risk route", NEVER "safe route".
"""

from datetime import datetime, timezone
from typing import List, Tuple

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import CellScore, Report, ReportCategory, TimeBucket
from app.schemas import RouteRiskSummary
from app.services.grid_snap import snap_to_grid


async def score_route_geometry(
    db: AsyncSession,
    coordinates: List[List[float]],  # array of [lng, lat] (standard GeoJSON) or [lat, lng]
) -> RouteRiskSummary:
    """Evaluate a route geometry against cell_scores and historical risk data."""
    if not coordinates:
        return RouteRiskSummary(
            total_points=0,
            cells_traversed=0,
            unsafe_cells_count=0,
            max_cell_risk=0.0,
            aggregate_risk_score=0.0,
            lighting_flags_after_dark=0,
            high_risk_categories=[],
            plain_language_summary="Empty route geometry provided.",
        )

    # Determine coordinate order: GeoJSON is [lng, lat], but handle [lat, lng] defensively
    # Chennai bounds: lat ~ 12.9 to 13.3, lng ~ 80.1 to 80.5
    normalized_coords: List[Tuple[float, float]] = []
    for pt in coordinates:
        if len(pt) < 2:
            continue
        c1, c2 = float(pt[0]), float(pt[1])
        if 80.0 <= c1 <= 80.6 and 12.8 <= c2 <= 13.4:  # [lng, lat]
            lat, lng = c2, c1
        else:  # [lat, lng]
            lat, lng = c1, c2
        normalized_coords.append((lat, lng))

    # Collect unique grid cells traversed
    unique_cells = set()
    for lat, lng in normalized_coords:
        grid_lat, grid_lng = snap_to_grid(lat, lng)
        unique_cells.add((grid_lat, grid_lng))

    total_cells = len(unique_cells)
    if total_cells == 0:
        return RouteRiskSummary(
            total_points=len(coordinates),
            cells_traversed=0,
            unsafe_cells_count=0,
            max_cell_risk=0.0,
            aggregate_risk_score=0.0,
            lighting_flags_after_dark=0,
            high_risk_categories=[],
            plain_language_summary="Route does not traverse valid Chennai grid cells.",
        )

    # Query cell scores for traversed cells
    lats = [c[0] for c in unique_cells]
    lngs = [c[1] for c in unique_cells]

    res = await db.execute(
        select(CellScore).where(
            CellScore.grid_lat.in_(lats),
            CellScore.grid_lng.in_(lngs),
        )
    )
    cell_scores = res.scalars().all()
    score_map = {(cs.grid_lat, cs.grid_lng): cs for cs in cell_scores}

    # Query specific problem categories along the route
    reports_res = await db.execute(
        select(Report.category, Report.time_bucket, Report.grid_lat, Report.grid_lng).where(
            Report.grid_lat.in_(lats),
            Report.grid_lng.in_(lngs),
        )
    )
    traversed_reports = reports_res.all()

    unsafe_cells_count = 0
    max_risk = 0.0
    total_risk = 0.0
    lighting_flags_after_dark = 0
    flagged_categories = set()

    for cell in unique_cells:
        cs = score_map.get(cell)
        if cs and cs.score_unsafe > 0:
            unsafe_cells_count += 1
            total_risk += cs.score_unsafe
            if cs.score_unsafe > max_risk:
                max_risk = cs.score_unsafe

    for rep in traversed_reports:
        cat, bucket = rep.category, rep.time_bucket
        if cat:
            flagged_categories.add(cat.value)
        if cat in (ReportCategory.poor_lighting, ReportCategory.isolated_area):
            if bucket in (TimeBucket.night, TimeBucket.evening, None):
                lighting_flags_after_dark += 1

    # Formulate plain-language risk summary (Spec §3.7)
    notes = []
    if lighting_flags_after_dark > 0:
        notes.append(f"passes {lighting_flags_after_dark} cell{'s' if lighting_flags_after_dark > 1 else ''} flagged for poor lighting after dark")
    if unsafe_cells_count > 0:
        notes.append(f"traverses {unsafe_cells_count} area{'s' if unsafe_cells_count > 1 else ''} with past community safety reports")
    else:
        notes.append("no past safety reports recorded along this corridor")

    plain_summary = "Route " + "; ".join(notes) + ". Evaluated as lower-reported-risk corridor."

    return RouteRiskSummary(
        total_points=len(coordinates),
        cells_traversed=total_cells,
        unsafe_cells_count=unsafe_cells_count,
        max_cell_risk=round(max_risk, 2),
        aggregate_risk_score=round(total_risk, 2),
        lighting_flags_after_dark=lighting_flags_after_dark,
        high_risk_categories=list(flagged_categories)[:5],
        plain_language_summary=plain_summary,
    )
