import logging
from typing import Optional
import httpx

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db import get_db
from app.models import Feedback
from app.routers.reports import limiter
from app.schemas import FeedbackCreate, FeedbackResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/feedback", tags=["feedback"])


async def _forward_feedback_email(feedback_data: dict) -> None:
    """Forward feedback submission directly to vraj122006@gmail.com via FormSubmit."""
    recipient = settings.FEEDBACK_RECIPIENT_EMAIL or "vraj122006@gmail.com"
    endpoint = f"https://formsubmit.co/ajax/{recipient}"

    payload = {
        "_subject": f"[Adiona Feedback] {feedback_data.get('category', 'Feedback').title()} ({feedback_data.get('rating') or 'No'} Stars)",
        "Topic / Category": feedback_data.get("category"),
        "Rating": f"{feedback_data.get('rating') or 'N/A'} / 5",
        "Feedback Message": feedback_data.get("message"),
        "Device ID": feedback_data.get("device_id"),
        "Timestamp (UTC)": str(feedback_data.get("created_at")),
        "_template": "table",
    }

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.post(endpoint, json=payload)
            if resp.is_success:
                logger.info("Feedback email forwarded to %s", recipient)
            else:
                logger.warning("Feedback email forward status %s: %s", resp.status_code, resp.text)
    except Exception as err:
        logger.warning("Feedback email forwarding exception: %s", err)


@router.post("", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/hour")
async def submit_feedback(
    body: FeedbackCreate,
    request: Request,
    background_tasks: BackgroundTasks,
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

    # Queue background task to forward email directly to vraj122006@gmail.com
    background_tasks.add_task(
        _forward_feedback_email,
        {
            "category": feedback_entry.category,
            "rating": feedback_entry.rating,
            "message": feedback_entry.message,
            "device_id": feedback_entry.device_id,
            "created_at": feedback_entry.created_at,
        },
    )

    return FeedbackResponse(
        id=feedback_entry.id,
        message="Thank you! Your feedback has been received and forwarded to the team.",
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
