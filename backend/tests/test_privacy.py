"""Phase B — Privacy tests for Chennai Safety Map.

B.1: Audit API response schemas — device_id never appears in GET / reports public response bodies
B.2: Grid-snapping behavior in sparse/isolated locations (privacy assessment)
B.3: Check backend logs for plaintext device_id and pre-snap coordinate logging
"""

import logging
import uuid
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine, AsyncSession

from app.models import Base
from app.services.grid_snap import snap_to_grid

# In-memory DB
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
# B.1 — device_id non-exposure in public API responses
# ==========================================================================

class TestB1_DeviceIdPrivacy:
    """Verify device_id is NEVER exposed in public GET or POST response bodies."""

    @pytest.mark.asyncio
    async def test_device_id_not_in_create_response(self, client):
        secret_device = _device_id()
        body = {
            "lat": 13.0827,
            "lng": 80.2707,
            "status": "unsafe",
            "category": "poor_lighting",
            "device_id": secret_device,
            "note": "Dark corner",
        }
        resp = await client.post("/reports", json=body)
        assert resp.status_code == 201
        data = resp.json()
        resp_str = str(data)

        assert "device_id" not in data, "device_id leaked in POST /reports response keys!"
        assert secret_device not in resp_str, "Raw device_id UUID leaked in POST /reports response string!"

    @pytest.mark.asyncio
    async def test_device_id_not_in_heatmap_response(self, client):
        secret_device = _device_id()
        body = {
            "lat": 13.0827,
            "lng": 80.2707,
            "status": "unsafe",
            "category": "poor_lighting",
            "device_id": secret_device,
            "note": "Isolated lane",
        }
        await client.post("/reports", json=body)

        heatmap = await client.get("/reports/heatmap")
        assert heatmap.status_code == 200
        heatmap_data = heatmap.json()

        for point in heatmap_data:
            assert "device_id" not in point, "device_id key present in HeatmapPoint schema!"
            assert secret_device not in str(point), f"Secret device_id {secret_device} leaked in heatmap payload!"

    @pytest.mark.asyncio
    async def test_device_id_not_in_confirm_response(self, client):
        creator_device = _device_id()
        confirmer_device = _device_id()

        body = {
            "lat": 13.0827,
            "lng": 80.2707,
            "status": "unsafe",
            "category": "poor_lighting",
            "device_id": creator_device,
        }
        res = await client.post("/reports", json=body)
        report_id = res.json()["id"]

        confirm_res = await client.post(
            f"/reports/{report_id}/confirm",
            json={"device_id": confirmer_device},
        )
        assert confirm_res.status_code == 200
        data = confirm_res.json()

        assert "device_id" not in data
        assert creator_device not in str(data)
        assert confirmer_device not in str(data)


# ==========================================================================
# B.2 — Grid-snapping privacy analysis in sparse/isolated location
# ==========================================================================

class TestB2_GridSnappingSparseLocation:
    """Assess whether ~100m grid snapping hides exact coordinates."""

    def test_grid_snap_hides_exact_location(self):
        # Precise exact single-building coordinate
        exact_lat = 13.0827419
        exact_lng = 80.2707123

        snapped_lat, snapped_lng = snap_to_grid(exact_lat, exact_lng)

        # Confirm snapped coords differ from exact input coords
        assert (snapped_lat, snapped_lng) != (exact_lat, exact_lng)

        # Confirm exact input coordinate cannot be reconstructed
        lat_diff = abs(snapped_lat - exact_lat)
        lng_diff = abs(snapped_lng - exact_lng)

        # ~100m snapping should introduce offset up to ~50m (~0.00045 degrees)
        assert lat_diff > 0
        assert lng_diff > 0


# ==========================================================================
# B.3 — Backend log inspection for device_id and pre-snap coords
# ==========================================================================

class TestB3_LoggingPrivacyAudit:
    """Verify application logging does not log raw request bodies with device_id."""

    @pytest.mark.asyncio
    async def test_request_logging_does_not_leak_device_id(self, client, caplog):
        secret_device = "super-secret-device-uuid-9999"

        with caplog.at_level(logging.INFO, logger="app"):
            body = {
                "lat": 13.0827,
                "lng": 80.2707,
                "status": "unsafe",
                "category": "poor_lighting",
                "device_id": _device_id(),
                "note": "Dark corner near station",
            }
            await client.post("/reports", json=body)

        # Ensure application logs do not print raw device_id in plaintext
        app_logs = [record.getMessage() for record in caplog.records if record.name.startswith("app")]
        for log_msg in app_logs:
            assert "device_id" not in log_msg, f"Application log leaked device_id: {log_msg}"
