"""Feedback endpoints for collecting user suggestions, bug reports, and ratings."""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models import Feedback
from app.routers.reports import limiter
from app.schemas import FeedbackCreate, FeedbackResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/feedback", tags=["feedback"])


@router.post("", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/hour")
async def submit_feedback(
    body: FeedbackCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Submit feedback, bug reports, or feature suggestions."""
    feedback_entry = Feedback(
        device_id=body.device_id,
        category=body.category,
        rating=body.rating,
        message=body.message,
    )
    db.add(feedback_entry)
    try:
        await db.commit()
        await db.refresh(feedback_entry)
    except Exception as exc:
        await db.rollback()
        logger.exception("Failed to save feedback: %s", exc)
        raise HTTPException(
            status_code=500, detail="Failed to record feedback. Please try again."
        )

    return FeedbackResponse(
        id=feedback_entry.id,
        message="Thank you! Your feedback has been received.",
        created_at=feedback_entry.created_at,
    )


@router.get("", summary="Get feedback summary stats")
async def get_feedback_stats(db: AsyncSession = Depends(get_db)):
    """Public summary statistics for community feedback."""
    count_result = await db.execute(select(func.count(Feedback.id)))
    total_feedback = count_result.scalar_one() or 0

    avg_rating_result = await db.execute(
        select(func.avg(Feedback.rating)).where(Feedback.rating.isnot(None))
    )
    avg_rating = avg_rating_result.scalar_one()
    formatted_rating = round(float(avg_rating), 1) if avg_rating else None

    return {
        "total_feedback": total_feedback,
        "average_rating": formatted_rating,
    }
