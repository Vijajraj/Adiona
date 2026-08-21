"""Tests for the /reports endpoints.

Covers:
  1. Valid report inside Chennai bounds
  2. Rejected report outside bounds
  3. Device rate-limit trigger (6th report in 24 h)
  4. Grid-cell cooldown trigger (same cell within 24 h)
  5. Profanity flag trigger (flagged, not rejected)
  6. Heatmap returns aggregated data
  7. Confirm flow (success + double-confirm rejection)
"""

import uuid
from unittest.mock import patch

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine, AsyncSession

from app.models import Base

# ---------------------------------------------------------------------------
# Test database setup — in-memory SQLite
# ---------------------------------------------------------------------------
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


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------
@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    """Create tables before each test, drop after."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def client():
    """AsyncClient wired to the test database."""
    from app.main import app
    from app.db import get_db
    from app.routers.reports import limiter

    app.dependency_overrides[get_db] = _override_get_db

    # Disable slowapi's IP-based rate limiter in tests — all requests
    # come from 127.0.0.1 and would exhaust the 7/day limit across tests.
    # Device-level rate limiting (custom DB logic) is still tested.
    limiter.enabled = False

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    limiter.enabled = True
    app.dependency_overrides.clear()


def _device_id() -> str:
    return str(uuid.uuid4())


# Chennai city centre (inside bounds)
VALID_LAT = 13.0827
VALID_LNG = 80.2707

# Outside Chennai
OUT_LAT = 11.0
OUT_LNG = 77.0


def _report_body(
    lat=VALID_LAT,
    lng=VALID_LNG,
    status="unsafe",
    category="poor_lighting",
    device_id=None,
    note=None,
):
    return {
        "lat": lat,
        "lng": lng,
        "status": status,
        "category": category,
        "device_id": device_id or _device_id(),
        "note": note,
    }


# --------------------------------------------------------------------------
# 1. Valid report inside bounds
# --------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_create_report_valid(client):
    body = _report_body()
    resp = await client.post("/reports", json=body)
    assert resp.status_code == 201
    data = resp.json()
    assert "id" in data
    assert "grid_lat" in data
    assert "grid_lng" in data
    assert "created_at" in data


# --------------------------------------------------------------------------
# 2. Rejected report outside Chennai bounds
# --------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_create_report_outside_bounds(client):
    body = _report_body(lat=OUT_LAT, lng=OUT_LNG)
    resp = await client.post("/reports", json=body)
    assert resp.status_code == 400
    assert "outside Chennai" in resp.json()["detail"]


# --------------------------------------------------------------------------
# 3. Device rate-limit (5/day)
# --------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_device_daily_rate_limit(client):
    device_id = _device_id()
    # Use different grid cells to avoid grid-cell cooldown
    offsets = [0.001 * i for i in range(6)]

    for i in range(5):
        body = _report_body(
            lat=VALID_LAT + offsets[i],
            lng=VALID_LNG + offsets[i],
            device_id=device_id,
        )
        resp = await client.post("/reports", json=body)
        assert resp.status_code == 201, f"Report {i+1} failed: {resp.json()}"

    # 6th should be rejected
    body = _report_body(
        lat=VALID_LAT + offsets[5],
        lng=VALID_LNG + offsets[5],
        device_id=device_id,
    )
    resp = await client.post("/reports", json=body)
    assert resp.status_code == 429
    assert "Rate limit exceeded" in resp.json()["detail"]


# --------------------------------------------------------------------------
# 4. Grid-cell cooldown (same cell within 24 h)
# --------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_grid_cell_cooldown(client):
    device_id = _device_id()
    body = _report_body(device_id=device_id)

    # First report — success
    resp = await client.post("/reports", json=body)
    assert resp.status_code == 201

    # Second report at same location — rejected
    resp = await client.post("/reports", json=body)
    assert resp.status_code == 429
    assert "already reported this location" in resp.json()["detail"]


# --------------------------------------------------------------------------
# 5. Profanity flag (flagged, NOT rejected)
# --------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_profanity_flag_not_reject(client):
    """Report with profanity in note should be accepted but flagged."""
    with patch("app.routers.reports.check_profanity", return_value=True):
        body = _report_body(note="some offensive text here")
        resp = await client.post("/reports", json=body)
        assert resp.status_code == 201  # NOT rejected


# --------------------------------------------------------------------------
# 6. Heatmap returns data
# --------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_heatmap_returns_data(client):
    # Seed a report
    body = _report_body()
    resp = await client.post("/reports", json=body)
    assert resp.status_code == 201

    # Fetch heatmap
    resp = await client.get("/reports/heatmap")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) >= 1
    point = data[0]
    assert "lat" in point
    assert "lng" in point
    assert "weight" in point
    assert point["weight"] >= 1


# --------------------------------------------------------------------------
# 7. Confirm flow
# --------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_confirm_report_success(client):
    # Create a report
    creator_id = _device_id()
    body = _report_body(device_id=creator_id)
    resp = await client.post("/reports", json=body)
    assert resp.status_code == 201
    report_id = resp.json()["id"]

    # Confirm with different device
    confirmer_id = _device_id()
    resp = await client.post(
        f"/reports/{report_id}/confirm", json={"device_id": confirmer_id}
    )
    assert resp.status_code == 200
    assert resp.json()["confirmations"] == 1


@pytest.mark.asyncio
async def test_confirm_own_report_rejected(client):
    creator_id = _device_id()
    body = _report_body(device_id=creator_id)
    resp = await client.post("/reports", json=body)
    report_id = resp.json()["id"]

    # Self-confirm should fail
    resp = await client.post(
        f"/reports/{report_id}/confirm", json={"device_id": creator_id}
    )
    assert resp.status_code == 400
    assert "cannot confirm your own" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_double_confirm_rejected(client):
    creator_id = _device_id()
    body = _report_body(device_id=creator_id)
    resp = await client.post("/reports", json=body)
    report_id = resp.json()["id"]

    confirmer_id = _device_id()
    # First confirm — success
    resp = await client.post(
        f"/reports/{report_id}/confirm", json={"device_id": confirmer_id}
    )
    assert resp.status_code == 200

    # Second confirm — rejected
    resp = await client.post(
        f"/reports/{report_id}/confirm", json={"device_id": confirmer_id}
    )
    assert resp.status_code == 409
    assert "already confirmed" in resp.json()["detail"]
