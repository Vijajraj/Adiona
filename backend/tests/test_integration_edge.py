"""Phase D — Functional & Integration testing + Edge cases."""

import uuid
from datetime import datetime, timedelta, timezone

import pytest
import pytest_asyncio
from fastapi import HTTPException
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine, AsyncSession

from app.models import Base, Report, ReportCategory, ReportStatus
from app.services.geo_validator import (
    CHENNAI_MAX_LAT,
    CHENNAI_MAX_LON,
    CHENNAI_MIN_LAT,
    CHENNAI_MIN_LON,
    validate_chennai_bounds,
)
from app.services.grid_snap import snap_to_grid
from app.services.rate_limiter import (
    check_device_daily_limit,
    check_grid_cell_cooldown,
)

TEST_DB_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(TEST_DB_URL, echo=False)
test_session = async_sessionmaker(
    test_engine, class_=AsyncSession, expire_on_commit=False
)


async def _override_get_db():
    async with test_session() as session:
        try:
            yield session
        finally:
            await session.close()


def _device_id() -> str:
    return str(uuid.uuid4())


@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def client():
    from app.main import app
    from app.db import get_db
    from app.routers.reports import limiter

    app.dependency_overrides[get_db] = _override_get_db
    limiter.enabled = False

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    limiter.enabled = True
    app.dependency_overrides.clear()


# ==========================================================================
# D.1 — Unit tests for rate_limiter.py
# ==========================================================================

class TestD1_RateLimiterUnit:
    """Direct unit tests for rate_limiter.py functions."""

    @pytest.mark.asyncio
    async def test_check_device_daily_limit_triggers_at_max(self):
        device = _device_id()
        async with test_session() as db:
            # Insert 5 reports for this device
            for i in range(5):
                rep = Report(
                    grid_lat=13.08 + (i * 0.01),
                    grid_lng=80.27 + (i * 0.01),
                    status=ReportStatus.unsafe,
                    category=ReportCategory.poor_lighting,
                    device_id=device,
                )
                db.add(rep)
            await db.commit()

            # 6th report should raise HTTP 429
            with pytest.raises(HTTPException) as exc:
                await check_device_daily_limit(db, device)
            assert exc.value.status_code == 429
            assert "Rate limit exceeded" in exc.value.detail

    @pytest.mark.asyncio
    async def test_check_grid_cell_cooldown_triggers_in_window(self):
        device = _device_id()
        lat, lng = snap_to_grid(13.0827, 80.2707)
        async with test_session() as db:
            rep = Report(
                grid_lat=lat,
                grid_lng=lng,
                status=ReportStatus.unsafe,
                category=ReportCategory.poor_lighting,
                device_id=device,
            )
            db.add(rep)
            await db.commit()

            # Second attempt at same grid cell should raise 429
            with pytest.raises(HTTPException) as exc:
                await check_grid_cell_cooldown(db, device, lat, lng)
            assert exc.value.status_code == 429
            assert "already reported this location" in exc.value.detail


# ==========================================================================
# D.2 — Integration Test: Full Flow (POST /reports -> GET /reports/heatmap)
# ==========================================================================

class TestD2_FullIntegrationFlow:
    """Full lifecycle integration test."""

    @pytest.mark.asyncio
    async def test_post_report_appears_in_heatmap(self, client):
        device = _device_id()
        raw_lat = 13.0827419
        raw_lng = 80.2707123
        expected_grid_lat, expected_grid_lng = snap_to_grid(raw_lat, raw_lng)

        post_body = {
            "lat": raw_lat,
            "lng": raw_lng,
            "status": "unsafe",
            "category": "catcalling",
            "device_id": device,
            "note": "Unsafe corridor",
        }

        # 1. POST /reports
        post_res = await client.post("/reports", json=post_body)
        assert post_res.status_code == 201
        created = post_res.json()
        assert created["grid_lat"] == expected_grid_lat
        assert created["grid_lng"] == expected_grid_lng

        # 2. GET /reports/heatmap
        heatmap_res = await client.get("/reports/heatmap")
        assert heatmap_res.status_code == 200
        heatmap_points = heatmap_res.json()

        # 3. Verify data in heatmap
        matching = [
            p for p in heatmap_points
            if p["lat"] == expected_grid_lat and p["lng"] == expected_grid_lng
        ]
        assert len(matching) == 1
        point = matching[0]
        assert point["category"] == "catcalling"
        assert point["status"] == "unsafe"
        assert point["weight"] >= 0.95


# ==========================================================================
# D.3 — Edge Cases
# ==========================================================================

class TestD3_EdgeCases:
    """Edge cases: exact bounds, midnight boundary filtering, empty heatmap response."""

    @pytest.mark.asyncio
    async def test_exact_bounding_box_edges(self, client):
        """Reports exactly on min/max lat/lng boundaries."""
        boundary_points = [
            (CHENNAI_MIN_LAT, CHENNAI_MIN_LON),
            (CHENNAI_MAX_LAT, CHENNAI_MAX_LON),
            (CHENNAI_MIN_LAT, CHENNAI_MAX_LON),
            (CHENNAI_MAX_LAT, CHENNAI_MIN_LON),
        ]

        for lat, lng in boundary_points:
            body = {
                "lat": lat,
                "lng": lng,
                "status": "unsafe",
                "category": "poor_lighting",
                "device_id": _device_id(),
            }
            res = await client.post("/reports", json=body)
            assert res.status_code == 201, f"Boundary point ({lat}, {lng}) rejected!"

    @pytest.mark.asyncio
    async def test_midnight_boundary_time_filtering(self, client):
        """Test time-of-day filtering across midnight boundary (e.g. created at 23:59 vs 00:01)."""
        async with test_session() as db:
            now = datetime.now(timezone.utc)
            # Exactly 2 hours ago
            r1 = Report(
                grid_lat=13.0800,
                grid_lng=80.2700,
                status=ReportStatus.unsafe,
                category=ReportCategory.poor_lighting,
                device_id=_device_id(),
                created_at=now - timedelta(hours=2),
            )
            # Exactly 26 hours ago
            r2 = Report(
                grid_lat=13.0900,
                grid_lng=80.2800,
                status=ReportStatus.unsafe,
                category=ReportCategory.poor_lighting,
                device_id=_device_id(),
                created_at=now - timedelta(hours=26),
            )
            db.add(r1)
            db.add(r2)
            await db.commit()

        # Query heatmap with hours_back=24
        res = await client.get("/reports/heatmap?hours_back=24")
        assert res.status_code == 200
        points = res.json()

        # r1 (2h ago) should be included, r2 (26h ago) should be excluded
        lats = [p["lat"] for p in points]
        assert 13.0800 in lats
        assert 13.0900 not in lats

    @pytest.mark.asyncio
    async def test_empty_heatmap_response_when_no_filter_match(self, client):
        """Filtering heatmap by a category that has 0 reports returns [] (200 OK)."""
        body = {
            "lat": 13.0827,
            "lng": 80.2707,
            "status": "unsafe",
            "category": "poor_lighting",
            "device_id": _device_id(),
        }
        await client.post("/reports", json=body)

        # Query for non-existent category (e.g., stalking)
        res = await client.get("/reports/heatmap?category=stalking")
        assert res.status_code == 200
        assert res.json() == [], "Expected empty list [] when filter matches zero reports"
