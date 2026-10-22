"""Tests for Phase 2 Credibility, Time-Decay & Anti-Manipulation (§3.1, §3.2)."""

from datetime import datetime, timedelta, timezone
import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.models import ReportCategory, ReportStatus, TimeBucket
from app.services.scoring import (
    calculate_report_decay_weight,
    detect_and_flag_adjacent_clusters,
    get_ist_time_bucket,
)


def test_time_decay_ratio_one_year_vs_yesterday():
    """Spec §3.1 Acceptance criteria: A 12-month-old unconfirmed report weighs

    measurably less than a yesterday report (assert the ratio).
    """
    now = datetime(2026, 10, 22, 12, 0, 0, tzinfo=timezone.utc)
    yesterday = now - timedelta(days=1)
    one_year_ago = now - timedelta(days=365)

    weight_yesterday = calculate_report_decay_weight(
        created_at=yesterday,
        category=ReportCategory.poor_lighting,
        is_seed=False,
        now=now,
    )
    weight_one_year = calculate_report_decay_weight(
        created_at=one_year_ago,
        category=ReportCategory.poor_lighting,
        is_seed=False,
        now=now,
    )

    # 1-day old should be ~0.99
    assert weight_yesterday > 0.90
    # 1-year old with 90-day half-life: 2^(-365/90) ~= 2^(-4.05) ~= 0.06
    assert weight_one_year < 0.10
    # Ratio: yesterday should weigh at least 10x more than 1-year-old report
    assert (weight_yesterday / weight_one_year) >= 10.0


def test_category_decay_half_lives():
    """Verify infrastructure (90d) decays slower than incident (30d), and seed (180d) decays slowest."""
    now = datetime(2026, 10, 22, 12, 0, 0, tzinfo=timezone.utc)
    past_60_days = now - timedelta(days=60)

    # Incident (half-life 30d): 2^(-60/30) = 0.25
    weight_incident = calculate_report_decay_weight(
        created_at=past_60_days,
        category=ReportCategory.catcalling,
        is_seed=False,
        now=now,
    )

    # Infrastructure (half-life 90d): 2^(-60/90) = 2^(-0.667) ~= 0.63
    weight_infra = calculate_report_decay_weight(
        created_at=past_60_days,
        category=ReportCategory.poor_lighting,
        is_seed=False,
        now=now,
    )

    # Seed (half-life 180d): 2^(-60/180) = 2^(-0.333) ~= 0.79
    weight_seed = calculate_report_decay_weight(
        created_at=past_60_days,
        category=ReportCategory.poor_lighting,
        is_seed=True,
        now=now,
    )

    assert weight_seed > weight_infra > weight_incident
    assert abs(weight_incident - 0.25) < 0.05
    assert abs(weight_infra - 0.63) < 0.05


def test_ist_time_bucket_mapping():
    """Verify UTC hours properly convert to IST time buckets (UTC + 5:30).

    05:00 - 11:59 IST -> morning
    12:00 - 16:59 IST -> afternoon
    17:00 - 20:59 IST -> evening
    21:00 - 04:59 IST -> night
    """
    # 02:00 UTC = 07:30 IST -> morning
    dt_morning = datetime(2026, 10, 22, 2, 0, tzinfo=timezone.utc)
    assert get_ist_time_bucket(dt_morning) == TimeBucket.morning

    # 08:00 UTC = 13:30 IST -> afternoon
    dt_afternoon = datetime(2026, 10, 22, 8, 0, tzinfo=timezone.utc)
    assert get_ist_time_bucket(dt_afternoon) == TimeBucket.afternoon

    # 13:00 UTC = 18:30 IST -> evening
    dt_evening = datetime(2026, 10, 22, 13, 0, tzinfo=timezone.utc)
    assert get_ist_time_bucket(dt_evening) == TimeBucket.evening

    # 18:00 UTC = 23:30 IST -> night
    dt_night = datetime(2026, 10, 22, 18, 0, tzinfo=timezone.utc)
    assert get_ist_time_bucket(dt_night) == TimeBucket.night


@pytest.mark.asyncio
async def test_anti_manipulation_single_device_flood_flagged(db_session):
    """Spec §3.1: Flag clusters of reports from one device across adjacent grid cells."""
    device_id = "55555555-5555-4555-8555-555555555555"
    now = datetime.now(timezone.utc)

    # Insert 4 reports in adjacent grid cells from same device within 30 minutes
    from app.models import Report

    for i in range(4):
        rep = Report(
            grid_lat=13.0827 + (i * 0.001),
            grid_lng=80.2707 + (i * 0.001),
            status=ReportStatus.unsafe,
            category=ReportCategory.poor_lighting,
            device_id=device_id,
            created_at=now - timedelta(minutes=i * 5),
        )
        db_session.add(rep)
    await db_session.commit()

    flagged = await detect_and_flag_adjacent_clusters(
        db_session,
        device_id=device_id,
        window_hours=2,
        cluster_threshold=3,
    )
    assert flagged is True
