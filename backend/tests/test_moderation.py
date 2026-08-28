"""Unit tests for Moderation Queue endpoints (Spec §10)."""

import uuid
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine, AsyncSession

from app.config import settings
from app.models import Base, Report, ReportCategory, ReportStatus

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


@pytest.mark.asyncio
async def test_moderation_unauthorized_without_key(client: AsyncClient):
    """Accessing moderation queue without X-Admin-Key should return 401."""
    resp = await client.get("/moderation/reports")
    assert resp.status_code == 401

    resp_wrong = await client.get(
        "/moderation/reports", headers={"X-Admin-Key": "wrong-secret"}
    )
    assert resp_wrong.status_code == 401


@pytest.mark.asyncio
async def test_moderation_get_flagged_reports(client: AsyncClient):
    """Retrieve only reports where is_flagged == True."""
    headers = {"X-Admin-Key": settings.ADMIN_SECRET}

    # Insert 1 normal report and 1 flagged report
    device_id = str(uuid.uuid4())
    async with test_session() as session:
        r_normal = Report(
            grid_lat=13.0827,
            grid_lng=80.2707,
            status=ReportStatus.unsafe,
            category=ReportCategory.poor_lighting,
            device_id=device_id,
            is_flagged=False,
        )
        r_flagged = Report(
            grid_lat=13.0850,
            grid_lng=80.2750,
            status=ReportStatus.unsafe,
            category=ReportCategory.catcalling,
            note="Potentially offensive text flagged by filter",
            device_id=device_id,
            is_flagged=True,
        )
        session.add_all([r_normal, r_flagged])
        await session.commit()
        flagged_id = r_flagged.id

    resp = await client.get("/moderation/reports", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["id"] == flagged_id
    assert data[0]["is_flagged"] is True


@pytest.mark.asyncio
async def test_moderation_approve_report(client: AsyncClient):
    """Approve report clears the is_flagged flag."""
    headers = {"X-Admin-Key": settings.ADMIN_SECRET}
    device_id = str(uuid.uuid4())

    async with test_session() as session:
        r_flagged = Report(
            grid_lat=13.0850,
            grid_lng=80.2750,
            status=ReportStatus.unsafe,
            category=ReportCategory.isolated_area,
            device_id=device_id,
            is_flagged=True,
        )
        session.add(r_flagged)
        await session.commit()
        report_id = r_flagged.id

    # Approve report
    resp = await client.post(f"/moderation/reports/{report_id}/approve", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["success"] is True

    # Check queue is now empty
    q_resp = await client.get("/moderation/reports", headers=headers)
    assert len(q_resp.json()) == 0


@pytest.mark.asyncio
async def test_moderation_delete_report(client: AsyncClient):
    """Delete permanently removes the offensive report."""
    headers = {"X-Admin-Key": settings.ADMIN_SECRET}
    device_id = str(uuid.uuid4())

    async with test_session() as session:
        r_flagged = Report(
            grid_lat=13.0850,
            grid_lng=80.2750,
            status=ReportStatus.unsafe,
            category=ReportCategory.robbery_theft,
            device_id=device_id,
            is_flagged=True,
        )
        session.add(r_flagged)
        await session.commit()
        report_id = r_flagged.id

    # Delete report
    resp = await client.delete(f"/moderation/reports/{report_id}", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["success"] is True

    # Verify report is completely gone
    resp_heat = await client.get("/reports/heatmap")
    assert len(resp_heat.json()) == 0


@pytest.mark.asyncio
async def test_moderation_stats(client: AsyncClient):
    """Get queue and report counts."""
    headers = {"X-Admin-Key": settings.ADMIN_SECRET}
    device_id = str(uuid.uuid4())

    async with test_session() as session:
        r1 = Report(
            grid_lat=13.0800, grid_lng=80.2700,
            status=ReportStatus.unsafe, category=ReportCategory.poor_lighting,
            device_id=device_id, is_flagged=False, is_seed=True,
        )
        r2 = Report(
            grid_lat=13.0810, grid_lng=80.2710,
            status=ReportStatus.unsafe, category=ReportCategory.no_cctv,
            device_id=device_id, is_flagged=True, is_seed=False,
        )
        session.add_all([r1, r2])
        await session.commit()

    resp = await client.get("/moderation/stats", headers=headers)
    assert resp.status_code == 200
    stats = resp.json()
    assert stats["total_reports"] == 2
    assert stats["flagged_reports"] == 1
    assert stats["seed_reports"] == 1
    assert stats["user_reports"] == 1
