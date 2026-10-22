"""Route Risk Assessment Router — Phase 2 Spec §3.7.

Evaluates user-submitted route alternatives against precomputed cell_scores.
Guarantees:
  - Never logs or stores input route coordinates (zero PII storage).
  - Wording is strictly "lower-reported-risk route" (never "safe route").
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from slowapi import Limiter
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.routers.reports import get_real_ip
from app.schemas import RouteRiskRequest, RouteRiskSummary
from app.services.routing import score_route_geometry

router = APIRouter(prefix="/routing", tags=["routing"])
limiter = Limiter(key_func=get_real_ip)


@router.post("/score-route", response_model=RouteRiskSummary)
@limiter.limit("60/minute")
async def evaluate_route_risk(
    body: RouteRiskRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Score a route geometry polyline against Chennai grid cell safety data.

    Returns lower-reported-risk assessment and plain-language notes.
    Coordinates are processed strictly in-memory and NEVER persisted to disk or DB.
    """
    if not body.coordinates or len(body.coordinates) < 2:
        raise HTTPException(
            status_code=400,
            detail="At least 2 coordinate points are required to evaluate a route corridor.",
        )

    if len(body.coordinates) > 1000:
        raise HTTPException(
            status_code=400,
            detail="Route polyline contains too many points (maximum 1000).",
        )

    summary = await score_route_geometry(db, body.coordinates)
    return summary
