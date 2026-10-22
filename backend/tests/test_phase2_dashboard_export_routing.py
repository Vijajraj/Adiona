"""Tests for Phase 2 Institutional Dashboard, Open Data Export, and Safe-Routing (§3.5, §3.6, §3.7)."""

import pytest

from app.config import settings
from app.models import Report, ReportCategory, ReportStatus, TimeBucket


@pytest.mark.asyncio
async def test_dashboard_unauthorized_returns_403(client):
    """Spec §3.5: Unauthorized request returns 403 with no data leakage."""
    # No header
    resp1 = await client.get("/admin/dashboard/summary")
    assert resp1.status_code == 403

    # Invalid key
    resp2 = await client.get(
        "/admin/dashboard/summary",
        headers={"X-Admin-Key": "wrong-secret-key"},
    )
    assert resp2.status_code == 403
    assert "Forbidden" in resp2.json()["detail"]


@pytest.mark.asyncio
async def test_dashboard_authorized_with_k_suppression(client, db_session):
    """Spec §3.5: Never show a cell/zone with fewer than K reports (K=5)."""
    # Seed 1 high-density cell with 6 reports (>= 5)
    for i in range(6):
        rep = Report(
            grid_lat=13.0800,
            grid_lng=80.2700,
            status=ReportStatus.unsafe,
            category=ReportCategory.poor_lighting,
            device_id=f"11111111-1111-4111-8111-11111111111{i}",
            time_bucket=TimeBucket.night,
        )
        db_session.add(rep)

    # Seed 1 low-density cell with 2 reports (< 5) — MUST BE SUPPRESSED
    for i in range(2):
        rep = Report(
            grid_lat=13.0900,
            grid_lng=80.2800,
            status=ReportStatus.unsafe,
            category=ReportCategory.catcalling,
            device_id=f"22222222-2222-4222-8222-22222222222{i}",
            time_bucket=TimeBucket.evening,
        )
        db_session.add(rep)
    await db_session.commit()

    # Check summary
    resp_sum = await client.get(
        "/admin/dashboard/summary",
        headers={"X-Admin-Key": settings.ADMIN_SECRET},
    )
    assert resp_sum.status_code == 200
    data_sum = resp_sum.json()
    assert data_sum["active_cells_count"] >= 1
    assert data_sum["suppressed_cells_count"] >= 1
    assert data_sum["min_k_threshold"] == 5

    # Check top-zones
    resp_zones = await client.get(
        "/admin/dashboard/top-zones",
        headers={"X-Admin-Key": settings.ADMIN_SECRET},
    )
    assert resp_zones.status_code == 200
    zones = resp_zones.json()

    # All returned zones must have report_count >= 5
    assert len(zones) >= 1
    for z in zones:
        assert z["report_count"] >= 5
        # Ensure suppressed cell (13.0900, 80.2800) is NOT present
        assert not (abs(z["grid_lat"] - 13.0900) < 0.0001 and abs(z["grid_lng"] - 80.2800) < 0.0001)


@pytest.mark.asyncio
async def test_open_data_export_licensing_and_suppression(client, db_session):
    """Spec §3.6: Public export under CC BY 4.0 with K >= 5 suppression."""
    # Ensure at least one qualified cell (K >= 5)
    for i in range(5):
        rep = Report(
            grid_lat=13.0850,
            grid_lng=80.2750,
            status=ReportStatus.unsafe,
            category=ReportCategory.poor_lighting,
            device_id=f"33333333-3333-4333-8333-33333333333{i}",
            time_bucket=TimeBucket.night,
        )
        db_session.add(rep)
    await db_session.commit()

    # JSON export
    resp = await client.get("/export/cells?format=json")
    assert resp.status_code == 200
    assert resp.headers.get("X-Data-License") == "CC BY 4.0"

    data = resp.json()
    assert isinstance(data, list)
    for item in data:
        assert item["report_count"] >= 5
        assert item["license"] == "CC BY 4.0"
        assert "device_id" not in item
        assert "note" not in item

    # CSV export
    resp_csv = await client.get("/export/cells?format=csv")
    assert resp_csv.status_code == 200
    assert "text/csv" in resp_csv.headers["content-type"]
    assert "CC BY 4.0" in resp_csv.text


@pytest.mark.asyncio
async def test_routing_spike_scores_corridor(client):
    """Spec §3.7: Score route against cell risk with lower-reported-risk phrasing."""
    coords = [
        [80.2700, 13.0800],
        [80.2720, 13.0820],
        [80.2740, 13.0840],
    ]
    resp = await client.post(
        "/routing/score-route",
        json={"coordinates": coords},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["cells_traversed"] > 0
    assert "lower-reported-risk" in data["plain_language_summary"]
    assert "safe route" not in data["plain_language_summary"].lower()
