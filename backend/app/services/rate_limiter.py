"""Rate-limiting helpers — spec §10, §11.

Two layers:
  - IP-level:  slowapi decorator on the route (7 / day) — configured in the router.
  - Device-level & grid-cell cooldown:  async DB queries below.
"""

from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models import Report


async def check_device_daily_limit(db: AsyncSession, device_id: str) -> None:
    """Reject if the device already submitted ≥ MAX_REPORTS_PER_DEVICE_PER_DAY
    reports in the last 24 hours."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=1)
    result = await db.execute(
        select(func.count(Report.id)).where(
            Report.device_id == device_id,
            Report.is_seed == False,  # Exclude seed records
            Report.created_at >= cutoff,
        )
    )
    count = result.scalar_one()
    if count >= settings.MAX_REPORTS_PER_DEVICE_PER_DAY:
        raise HTTPException(
            status_code=429,
            detail=(
                f"Rate limit exceeded: maximum "
                f"{settings.MAX_REPORTS_PER_DEVICE_PER_DAY} reports per "
                f"device per day."
            ),
        )


async def check_grid_cell_cooldown(
    db: AsyncSession, device_id: str, grid_lat: float, grid_lng: float
) -> None:
    """Reject if the device already reported this exact grid cell within the
    cooldown window (24 h by default)."""
    cutoff = datetime.now(timezone.utc) - timedelta(
        hours=settings.GRID_CELL_COOLDOWN_HOURS
    )
    result = await db.execute(
        select(func.count(Report.id)).where(
            Report.device_id == device_id,
            Report.is_seed == False,  # Exclude seed records
            Report.grid_lat == grid_lat,
            Report.grid_lng == grid_lng,
            Report.created_at >= cutoff,
        )
    )
    count = result.scalar_one()
    if count > 0:
        raise HTTPException(
            status_code=429,
            detail=(
                "You have already reported this location within the last "
                f"{settings.GRID_CELL_COOLDOWN_HOURS} hours."
            ),
        )
