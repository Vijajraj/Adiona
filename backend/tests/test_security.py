"""Phase A — Security tests for Chennai Safety Map.

A.1: Out-of-bounds coordinate rejection (all four edges + corners)
A.2: IP-based rate limit bypass via fresh device_ids
A.3: SQL injection payloads against note field and query params
A.4: Concurrent grid-cell cooldown race condition
A.5: GET /reports/heatmap rate limiting
"""

import asyncio
import uuid
from datetime import datetime, timezone

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine, AsyncSession

from app.models import Base
from app.services.geo_validator import (
    CHENNAI_MIN_LAT, CHENNAI_MAX_LAT,
    CHENNAI_MIN_LON, CHENNAI_MAX_LON,
)

from sqlalchemy.pool import StaticPool

TEST_DB_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DB_URL,
    echo=False,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
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


def _report_body(lat=13.0827, lng=80.2707, device_id=None, note=None,
                 status="unsafe", category="poor_lighting"):
    return {
        "lat": lat,
        "lng": lng,
        "status": status,
        "category": category,
        "device_id": device_id or _device_id(),
        "note": note,
    }


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------
@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def client():
    """Client with slowapi IP-rate limiter DISABLED for most tests."""
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


@pytest_asyncio.fixture
async def client_with_ip_limiter():
    """Client with slowapi IP-rate limiter ENABLED."""
    from app.main import app
    from app.db import get_db
    from app.routers.reports import limiter

    app.dependency_overrides[get_db] = _override_get_db
    limiter.enabled = True

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


# ==========================================================================
# A.1 — Out-of-bounds coordinate rejection (comprehensive)
# ==========================================================================

class TestA1_OutOfBoundsRejection:
    """Confirm POST /reports rejects coordinates outside the Chennai
    bounding box with HTTP 400, not silently accepted."""

    @pytest.mark.asyncio
    async def test_reject_south_of_bounds(self, client):
        """Lat just below CHENNAI_MIN_LAT should be rejected."""
        body = _report_body(lat=CHENNAI_MIN_LAT - 0.001, lng=80.27)
        resp = await client.post("/reports", json=body)
        assert resp.status_code == 400, f"Expected 400, got {resp.status_code}"
        assert "outside Chennai" in resp.json()["detail"]

    @pytest.mark.asyncio
    async def test_reject_north_of_bounds(self, client):
        """Lat just above CHENNAI_MAX_LAT should be rejected."""
        body = _report_body(lat=CHENNAI_MAX_LAT + 0.001, lng=80.27)
        resp = await client.post("/reports", json=body)
        assert resp.status_code == 400

    @pytest.mark.asyncio
    async def test_reject_west_of_bounds(self, client):
        """Lng just below CHENNAI_MIN_LON should be rejected."""
        body = _report_body(lat=13.08, lng=CHENNAI_MIN_LON - 0.001)
        resp = await client.post("/reports", json=body)
        assert resp.status_code == 400

    @pytest.mark.asyncio
    async def test_reject_east_of_bounds(self, client):
        """Lng just above CHENNAI_MAX_LON should be rejected."""
        body = _report_body(lat=13.08, lng=CHENNAI_MAX_LON + 0.001)
        resp = await client.post("/reports", json=body)
        assert resp.status_code == 400

    @pytest.mark.asyncio
    async def test_reject_far_away_mumbai(self, client):
        """Mumbai coordinates — completely outside Chennai."""
        body = _report_body(lat=19.076, lng=72.8777)
        resp = await client.post("/reports", json=body)
        assert resp.status_code == 400

    @pytest.mark.asyncio
    async def test_reject_far_away_delhi(self, client):
        """Delhi coordinates — completely outside Chennai."""
        body = _report_body(lat=28.6139, lng=77.2090)
        resp = await client.post("/reports", json=body)
        assert resp.status_code == 400

    @pytest.mark.asyncio
    async def test_reject_negative_coordinates(self, client):
        """Negative lat/lng (southern hemisphere) should be rejected."""
        body = _report_body(lat=-13.0827, lng=-80.2707)
        resp = await client.post("/reports", json=body)
        assert resp.status_code == 400

    @pytest.mark.asyncio
    async def test_reject_zero_coordinates(self, client):
        """(0, 0) — Null Island — should be rejected."""
        body = _report_body(lat=0.0, lng=0.0)
        resp = await client.post("/reports", json=body)
        assert resp.status_code == 400

    @pytest.mark.asyncio
    async def test_accept_exact_min_corner(self, client):
        """Exact SW corner of bounding box should be ACCEPTED (inclusive)."""
        body = _report_body(lat=CHENNAI_MIN_LAT, lng=CHENNAI_MIN_LON)
        resp = await client.post("/reports", json=body)
        assert resp.status_code == 201, f"SW corner rejected: {resp.json()}"

    @pytest.mark.asyncio
    async def test_accept_exact_max_corner(self, client):
        """Exact NE corner of bounding box should be ACCEPTED (inclusive)."""
        body = _report_body(lat=CHENNAI_MAX_LAT, lng=CHENNAI_MAX_LON)
        resp = await client.post("/reports", json=body)
        assert resp.status_code == 201, f"NE corner rejected: {resp.json()}"

    @pytest.mark.asyncio
    async def test_accept_city_centre(self, client):
        """Chennai city centre should always be accepted."""
        body = _report_body(lat=13.0827, lng=80.2707)
        resp = await client.post("/reports", json=body)
        assert resp.status_code == 201

    @pytest.mark.asyncio
    async def test_accept_just_inside_all_edges(self, client):
        """Points epsilon inside each edge should all be accepted."""
        coords = [
            (CHENNAI_MIN_LAT + 0.001, 80.27),   # just above south edge
            (CHENNAI_MAX_LAT - 0.001, 80.27),   # just below north edge
            (13.08, CHENNAI_MIN_LON + 0.001),   # just east of west edge
            (13.08, CHENNAI_MAX_LON - 0.001),   # just west of east edge
        ]
        for lat, lng in coords:
            body = _report_body(lat=lat, lng=lng, device_id=_device_id())
            resp = await client.post("/reports", json=body)
            assert resp.status_code == 201, (
                f"Point ({lat}, {lng}) inside bounds was rejected: {resp.json()}"
            )


# ==========================================================================
# A.2 — IP-based rate limit bypass via fresh device_ids
# ==========================================================================

class TestA2_IPRateLimitBypass:
    """Simulate localStorage-cleared device_id abuse: 10 fresh UUIDs from
    the same IP within minutes. The IP-based secondary limit (7/day via
    slowapi) should catch this even though each device_id is unique."""

    @pytest.mark.asyncio
    async def test_ip_limit_blocks_fresh_device_ids(self, client_with_ip_limiter):
        """Send 10 reports with 10 different device_ids. Reports 1-7 should
        succeed (7/IP/day), report 8+ should get 429 from slowapi."""
        results = []
        for i in range(10):
            fresh_device = _device_id()
            body = _report_body(
                # Use slightly different coordinates to avoid grid-cell cooldown
                lat=13.0827 + (i * 0.002),
                lng=80.2707 + (i * 0.002),
                device_id=fresh_device,
            )
            resp = await client_with_ip_limiter.post("/reports", json=body)
            results.append((i + 1, resp.status_code))

        # Reports 1-7 should succeed
        for idx, status in results[:7]:
            assert status == 201, f"Report {idx} should succeed, got {status}"

        # Reports 8-10 should be rate-limited by IP
        for idx, status in results[7:]:
            assert status == 429, (
                f"Report {idx} (fresh device_id) should be IP-rate-limited "
                f"with 429, got {status}. IP limit is NOT catching device_id rotation."
            )


# ==========================================================================
# A.3 — SQL injection testing (manual payloads, no sqlmap needed)
# ==========================================================================

class TestA3_SQLInjection:
    """Run common SQL injection payloads against the note field (free text)
    and query parameters (category, hours_back). SQLAlchemy ORM uses
    parameterized queries, so these should all be safely handled — but we
    verify explicitly rather than trusting the framework."""

    # --- note field injection payloads ---

    SQL_PAYLOADS = [
        "'; DROP TABLE reports; --",
        "' OR '1'='1",
        "' UNION SELECT id, device_id, note, 1, 1, 1, 1, 1 FROM reports --",
        "1; SELECT * FROM reports WHERE ''='",
        "' OR 1=1 --",
        "'; WAITFOR DELAY '0:0:5' --",          # MSSQL-style blind
        "' AND (SELECT COUNT(*) FROM reports) > 0 --",
        "test' OR 'x'='x",
        "Robert'); DROP TABLE reports;--",       # Classic Bobby Tables
        "' UNION ALL SELECT NULL,NULL,NULL--",
    ]

    @pytest.mark.asyncio
    @pytest.mark.parametrize("payload", SQL_PAYLOADS)
    async def test_note_field_injection(self, client, payload):
        """Inject SQL payloads into the note field. The report should either
        be created normally (treating the payload as literal text) or fail
        on profanity check — but never cause a DB error or data leak."""
        body = _report_body(note=payload)
        resp = await client.post("/reports", json=body)
        # Should be 201 (payload stored as literal) or 422 (validation),
        # never 500 (unhandled SQL error)
        assert resp.status_code in (201, 422), (
            f"SQL injection payload caused unexpected status {resp.status_code}: "
            f"{resp.json()}"
        )

    @pytest.mark.asyncio
    async def test_note_stored_literally_not_executed(self, client):
        """Verify that a SQL payload in note is stored as literal text,
        not interpreted as SQL."""
        payload = "'; DROP TABLE reports; --"
        body = _report_body(note=payload)
        resp = await client.post("/reports", json=body)
        assert resp.status_code == 201

        # The reports table should still exist and the heatmap should work
        heatmap = await client.get("/reports/heatmap")
        assert heatmap.status_code == 200
        assert len(heatmap.json()) >= 1, "Table was dropped by injection!"

    # --- category query param injection ---

    @pytest.mark.asyncio
    async def test_category_param_injection(self, client):
        """Inject SQL into the category filter parameter."""
        payloads = [
            "poor_lighting' OR '1'='1",
            "' UNION SELECT 1,2,3,4,5,6,7--",
            "poor_lighting; DROP TABLE reports;--",
        ]
        for payload in payloads:
            resp = await client.get(f"/reports/heatmap?category={payload}")
            # Should get 422 (invalid enum) or 200 (empty), never 500
            assert resp.status_code in (200, 422), (
                f"Category injection caused {resp.status_code}: {resp.json()}"
            )

    # --- hours_back query param injection ---

    @pytest.mark.asyncio
    async def test_hours_back_param_injection(self, client):
        """Inject SQL into the hours_back integer parameter."""
        payloads = [
            "1 OR 1=1",
            "1; DROP TABLE reports",
            "1 UNION SELECT 1",
            "-1",
            "99999999999",
            "abc",
        ]
        for payload in payloads:
            resp = await client.get(f"/reports/heatmap?hours_back={payload}")
            # Should get 422 (not a valid int) or 200 (valid int), never 500
            assert resp.status_code in (200, 422), (
                f"hours_back injection '{payload}' caused {resp.status_code}: {resp.text}"
            )


# ==========================================================================
# A.4 — Concurrent grid-cell cooldown race condition
# ==========================================================================

class TestA4_ConcurrentCooldownRace:
    """Fire two simultaneous POST /reports requests at the same grid cell
    from the same device_id. Both hit the app-level SELECT COUNT check
    concurrently. Confirm that at most one succeeds."""

    @pytest.mark.asyncio
    async def test_concurrent_same_cell_same_device(self, client):
        dev = _device_id()
        body1 = _report_body(device_id=dev)
        body2 = _report_body(device_id=dev)

        res1, res2 = await asyncio.gather(
            client.post("/reports", json=body1),
            client.post("/reports", json=body2),
        )

        codes = sorted([res1.status_code, res2.status_code])
        assert codes == [201, 429], (
            f"Expected [201, 429] but got {codes}. Res1: {res1.json()}, Res2: {res2.json()}"
        )


# ==========================================================================
# A.5 — GET /reports/heatmap rate limiting
# ==========================================================================

class TestA5_GetHeatmapRateLimiting:
    """Confirm rate limiting applies to GET endpoints too, not just POST."""

    @pytest.mark.asyncio
    async def test_heatmap_get_rate_limited(self, client_with_ip_limiter):
        """Fire 125 rapid GET /reports/heatmap requests. The endpoint is
        limited to 120/minute. Requests beyond that should get 429."""
        results = []
        for i in range(125):
            resp = await client_with_ip_limiter.get("/reports/heatmap")
            results.append(resp.status_code)

        count_200 = results.count(200)
        count_429 = results.count(429)

        # At least some should be rate-limited after 120
        assert count_429 > 0, (
            f"No rate limiting detected on GET /heatmap. "
            f"All {count_200} requests returned 200. "
            f"Expected 429 after ~120 requests."
        )
        # The first 120 should mostly succeed
        assert count_200 >= 115, (
            f"Too many early requests failed: {count_200} of 120 expected successes"
        )
