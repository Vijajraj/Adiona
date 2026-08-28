"""Moderation Queue Endpoints — Spec §10.

Provides internal endpoints to inspect, approve (unflag), and delete reports
flagged by the profanity classifier or marked for moderation.
"""

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Security, status
from fastapi.security import APIKeyHeader, APIKeyQuery
from sqlalchemy import delete, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db import get_db
from app.models import Confirmation, Report
from app.schemas import FlaggedReportResponse, ModerationActionResponse

router = APIRouter(prefix="/moderation", tags=["moderation"])

api_key_header = APIKeyHeader(name="X-Admin-Key", auto_error=False)
api_key_query = APIKeyQuery(name="admin_key", auto_error=False)


async def verify_admin_key(
    header_key: Optional[str] = Security(api_key_header),
    query_key: Optional[str] = Security(api_key_query),
) -> str:
    """Verify admin secret key from X-Admin-Key header or admin_key query param."""
    provided_key = header_key or query_key
    if not provided_key or provided_key != settings.ADMIN_SECRET:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing admin authentication key.",
        )
    return provided_key


# --------------------------------------------------------------------------
# GET /moderation/reports — List all flagged reports
# --------------------------------------------------------------------------
@router.get(
    "/reports",
    response_model=list[FlaggedReportResponse],
    summary="List flagged reports for moderation",
)
async def get_flagged_reports(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    _admin: str = Depends(verify_admin_key),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve all reports flagged for moderation review (is_flagged = True)."""
    query = (
        select(Report)
        .where(Report.is_flagged == True)
        .order_by(Report.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    result = await db.execute(query)
    reports = result.scalars().all()
    return reports


# --------------------------------------------------------------------------
# GET /moderation/stats — Queue & database stats
# --------------------------------------------------------------------------
@router.get(
    "/stats",
    summary="Get moderation queue and system statistics",
)
async def get_moderation_stats(
    _admin: str = Depends(verify_admin_key),
    db: AsyncSession = Depends(get_db),
):
    """Return counts of total, flagged, seed, and user reports."""
    total_q = await db.execute(select(func.count(Report.id)))
    total_count = total_q.scalar_one()

    flagged_q = await db.execute(
        select(func.count(Report.id)).where(Report.is_flagged == True)
    )
    flagged_count = flagged_q.scalar_one()

    seed_q = await db.execute(
        select(func.count(Report.id)).where(Report.is_seed == True)
    )
    seed_count = seed_q.scalar_one()

    user_count = total_count - seed_count

    return {
        "total_reports": total_count,
        "flagged_reports": flagged_count,
        "seed_reports": seed_count,
        "user_reports": user_count,
    }


# --------------------------------------------------------------------------
# POST /moderation/reports/{id}/approve — Clear flagged status
# --------------------------------------------------------------------------
@router.post(
    "/reports/{report_id}/approve",
    response_model=ModerationActionResponse,
    summary="Approve a flagged report (clears flag)",
)
async def approve_report(
    report_id: str,
    _admin: str = Depends(verify_admin_key),
    db: AsyncSession = Depends(get_db),
):
    """Approve a flagged report, setting is_flagged = False so it remains verified."""
    try:
        uuid.UUID(report_id)
    except (ValueError, AttributeError, TypeError):
        raise HTTPException(status_code=400, detail="Invalid report_id format.")

    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found.")

    report.is_flagged = False
    await db.commit()

    return ModerationActionResponse(
        success=True,
        message="Report approved and flag cleared successfully.",
        report_id=report_id,
    )


# --------------------------------------------------------------------------
# DELETE /moderation/reports/{id} — Delete offensive/spam report
# --------------------------------------------------------------------------
@router.delete(
    "/reports/{report_id}",
    response_model=ModerationActionResponse,
    summary="Permanently delete a flagged report",
)
async def delete_report(
    report_id: str,
    _admin: str = Depends(verify_admin_key),
    db: AsyncSession = Depends(get_db),
):
    """Permanently delete a reported item from the database."""
    try:
        uuid.UUID(report_id)
    except (ValueError, AttributeError, TypeError):
        raise HTTPException(status_code=400, detail="Invalid report_id format.")

    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found.")

    # Delete confirmations cascade or explicitly
    await db.execute(
        delete(Confirmation).where(Confirmation.report_id == report_id)
    )
    await db.execute(delete(Report).where(Report.id == report_id))
    await db.commit()

    return ModerationActionResponse(
        success=True,
        message="Report permanently deleted from safety map.",
        report_id=report_id,
    )
