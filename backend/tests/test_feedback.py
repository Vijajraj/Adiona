"""Unit tests for Community Feedback endpoints."""

import uuid
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine, AsyncSession

from app.models import Base

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

    app.dependency_overrides.clear()
    limiter.enabled = True


@pytest.mark.asyncio
async def test_submit_feedback_success(client: AsyncClient):
    payload = {
        "device_id": str(uuid.uuid4()),
        "category": "suggestion",
        "rating": 5,
        "message": "Great map app! Really helps navigating safe streets at night.",
    }
    response = await client.post("/feedback", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert "Thank you" in data["message"]


@pytest.mark.asyncio
async def test_submit_feedback_without_message(client: AsyncClient):
    payload = {
        "device_id": str(uuid.uuid4()),
        "category": "suggestion",
        "rating": 5,
        "message": None,
    }
    response = await client.post("/feedback", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert "Thank you" in data["message"]


@pytest.mark.asyncio
async def test_submit_feedback_validation_error(client: AsyncClient):
    payload = {
        "device_id": str(uuid.uuid4()),
        "category": "bug",
        "rating": 1,
        "message": "a",  # too short (< 2 chars)
    }
    response = await client.post("/feedback", json=payload)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_get_feedback_stats(client: AsyncClient):
    # Post one feedback
    payload = {
        "device_id": str(uuid.uuid4()),
        "category": "safety",
        "rating": 4,
        "message": "Add more lighting data near central station.",
    }
    await client.post("/feedback", json=payload)

    response = await client.get("/feedback")
    assert response.status_code == 200
    stats = response.json()
    assert stats["total_feedback"] >= 1
    assert stats["average_rating"] == 4.0
