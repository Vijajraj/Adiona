"""Scoring Engine with Time Decay, Anti-Manipulation & Device Weighting — Phase 2 Spec §3.1.

Implements:
  1. Exponential time decay with half-life by category:
     - 180 days for seed/historical data (slower decay).
     - 90 days for infrastructure categories (lighting, road, CCTV, isolation).
     - 30 days for incident categories (harassment, stalking, catcalling, theft).
  2. Weighting by unique confirming devices, discounting spam from single devices.
  3. Rapid adjacent cluster detection & down-weighting.
  4. IST time-bucket classification (morning, afternoon, evening, night).
  5. Precomputed cell_scores table calculation and refresh.
"""

from datetime import datetime, timedelta, timezone
import math
from typing import Optional

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import (
    INCIDENT_CATEGORIES,
    INFRASTRUCTURE_CATEGORIES,
    CellScore,
    Confirmation,
    Report,
    ReportCategory,
    ReportFlag,
    ReportStatus,
    TimeBucket,
)

# Half-life constants in days
HALF_LIFE_SEED_DAYS = 180.0
HALF_LIFE_INFRASTRUCTURE_DAYS = 90.0
HALF_LIFE_INCIDENT_DAYS = 30.0
HALF_LIFE_DEFAULT_DAYS = 30.0

MIN_WEIGHT_FLOOR = 0.05
IST_OFFSET = timedelta(hours=5, minutes=30)


def get_ist_time_bucket(dt: Optional[datetime] = None) -> TimeBucket:
    """Return the TimeBucket for a given datetime in Indian Standard Time (IST)."""
    if dt is None:
        dt = datetime.now(timezone.utc)
    elif dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)

    ist_time = dt + IST_OFFSET
    hour = ist_time.hour

    if 5 <= hour < 12:
        return TimeBucket.morning
    elif 12 <= hour < 17:
        return TimeBucket.afternoon
    elif 17 <= hour < 21:
        return TimeBucket.evening
    else:
        return TimeBucket.night


def calculate_report_decay_weight(
    created_at: datetime,
    category: ReportCategory,
    is_seed: bool = False,
    now: Optional[datetime] = None,
) -> float:
    """Calculate exponential time-decay weight for a report.

    Formula: 2^(-delta_t / half_life)
    Floored at MIN_WEIGHT_FLOOR (0.05).
    """
    if now is None:
        now = datetime.now(timezone.utc)
    elif now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)

    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)

    delta_days = max(0.0, (now - created_at).total_seconds() / 86400.0)

    if is_seed:
        half_life = HALF_LIFE_SEED_DAYS
    elif category in INFRASTRUCTURE_CATEGORIES:
        half_life = HALF_LIFE_INFRASTRUCTURE_DAYS
    elif category in INCIDENT_CATEGORIES:
        half_life = HALF_LIFE_INCIDENT_DAYS
    else:
        half_life = HALF_LIFE_DEFAULT_DAYS

    decay_factor = 2.0 ** (-delta_days / half_life)
    return max(MIN_WEIGHT_FLOOR, decay_factor)


async def detect_and_flag_adjacent_clusters(
    db: AsyncSession,
    device_id: str,
    window_hours: int = 2,
    cluster_threshold: int = 3,
) -> bool:
    """Detect if a single device reported multiple distinct grid cells within a short window.

    If threshold is reached, flags unreviewed reports from this device in report_flags
    and returns True (anti-manipulation check, spec §3.1).
    """
    cutoff = datetime.now(timezone.utc) - timedelta(hours=window_hours)
    res = await db.execute(
        select(Report)
        .where(
            Report.device_id == device_id,
            Report.created_at >= cutoff,
        )
    )
    reports = res.scalars().all()
    distinct_cells = {(r.grid_lat, r.grid_lng) for r in reports}

    if len(distinct_cells) >= cluster_threshold:
        for r in reports:
            # Check if already flagged
            existing_flag = await db.execute(
                select(ReportFlag).where(
                    ReportFlag.report_id == r.id,
                    ReportFlag.reason == "rapid_adjacent_cluster",
                )
            )
            if not existing_flag.scalar_one_or_none():
                flag = ReportFlag(
                    report_id=r.id,
                    reason="rapid_adjacent_cluster",
                    reviewed=False,
                )
                db.add(flag)
        await db.commit()
        return True
    return False


async def recompute_cell_scores(db: AsyncSession) -> int:
    """Precompute cell_scores table for all grid cells (spec §3.1).

    Aggregates reports, unique devices, confirmations, and applies time-decay
    weights. Saves results to cell_scores table.
    """
    now = datetime.now(timezone.utc)

    # 1. Fetch all flagged report IDs with rapid_adjacent_cluster to down-weight them
    flags_res = await db.execute(
        select(ReportFlag.report_id).where(ReportFlag.reviewed.is_(False))
    )
    flagged_report_ids = set(flags_res.scalars().all())

    # 2. Fetch all reports
    reports_res = await db.execute(
        select(Report).order_by(Report.created_at.asc())
    )
    reports = reports_res.scalars().all()

    # Group by cell: (grid_lat, grid_lng) -> dict
    cells_data: dict[tuple[float, float], dict] = {}

    for r in reports:
        key = (r.grid_lat, r.grid_lng)

        created_at = r.created_at
        if created_at is not None and created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)

        if key not in cells_data:
            cells_data[key] = {
                "unsafe_score": 0.0,
                "safe_score": 0.0,
                "devices": set(),
                "last_report_at": created_at,
            }

        data = cells_data[key]
        data["devices"].add(r.device_id)

        if created_at and (data["last_report_at"] is None or created_at > data["last_report_at"]):
            data["last_report_at"] = created_at

        # Calculate decay weight
        weight = calculate_report_decay_weight(
            created_at=created_at,
            category=r.category,
            is_seed=r.is_seed,
            now=now,
        )

        # Confirmations add weight
        weight += 0.5 * float(r.confirmations or 0)

        # Down-weight if flagged for rapid adjacent spam
        if r.id in flagged_report_ids or r.is_flagged:
            weight *= 0.35

        if r.status == ReportStatus.safe:
            data["safe_score"] += weight
        else:
            data["unsafe_score"] += weight

    # Delete old cell_scores and bulk reinsert
    await db.execute(delete(CellScore))

    new_cell_scores = [
        CellScore(
            grid_lat=lat,
            grid_lng=lng,
            score_unsafe=round(val["unsafe_score"], 4),
            score_safe=round(val["safe_score"], 4),
            unique_devices=len(val["devices"]),
            last_report_at=val["last_report_at"],
            updated_at=now,
        )
        for (lat, lng), val in cells_data.items()
    ]

    db.add_all(new_cell_scores)
    await db.commit()
    return len(new_cell_scores)
