"""Phase E — Performance testing and database scaling projections.

E.1: Render Cold-Start Latency assessment & Frontend loading state audit
E.2: Load test GET /reports/heatmap with 50, 200, 500 concurrent requests
E.3: Database growth simulation (10k, 50k, 100k reports), query time benchmarks,
     and Neon 0.5 GB free-tier storage capacity projection.
"""

import asyncio
import time
import uuid
from datetime import datetime, timedelta, timezone

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine, AsyncSession

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
# E.2 — Load Testing GET /reports/heatmap under concurrent loads
# ==========================================================================

class TestE2_ConcurrentLoadBenchmark:
    """Benchmark GET /reports/heatmap response time under high concurrency."""

    @pytest.mark.asyncio
    async def test_concurrent_load_50_200_500(self, client):
        # Seed 100 initial reports
        async with test_session() as db:
            reports = [
                Report(
                    grid_lat=13.08 + (i * 0.001),
                    grid_lng=80.27 + (i * 0.001),
                    status=ReportStatus.unsafe,
                    category=ReportCategory.poor_lighting,
                    device_id=_device_id(),
                    confirmations=i % 3,
                )
                for i in range(100)
            ]
            db.add_all(reports)
            await db.commit()

        concurrency_levels = [50, 200, 500]
        summary_results = {}

        for concurrency in concurrency_levels:
            start_time = time.perf_counter()

            async def fetch_one():
                res = await client.get("/reports/heatmap")
                return res.status_code

            tasks = [fetch_one() for _ in range(concurrency)]
            statuses = await asyncio.gather(*tasks)

            duration = time.perf_counter() - start_time
            successes = statuses.count(200)
            failures = len(statuses) - successes
            avg_latency_ms = (duration / concurrency) * 1000.0

            summary_results[concurrency] = {
                "duration_sec": round(duration, 3),
                "avg_latency_ms": round(avg_latency_ms, 2),
                "successes": successes,
                "failures": failures,
            }

            print(
                f"\n[Load Test {concurrency} Requests] Duration: {duration:.3f}s | "
                f"Avg Latency: {avg_latency_ms:.2f}ms | Successes: {successes} | Failures: {failures}"
            )

            assert failures == 0, f"Load test at {concurrency} concurrency had failures!"


# ==========================================================================
# E.3 — Database Scaling Simulation (10k, 50k, 100k reports) & Storage Projections
# ==========================================================================

class TestE3_DatabaseScalingSimulation:
    """Simulate query execution latency and storage projections at scale."""

    @pytest.mark.asyncio
    async def test_scaling_query_performance(self, client):
        sizes = [10000, 50000, 100000]
        results = {}

        for size in sizes:
            # Generate synthetic data directly in DB in bulk batches
            async with test_session() as db:
                batch_size = 5000
                now = datetime.now(timezone.utc)
                for batch in range(0, size, batch_size):
                    reports = [
                        Report(
                            grid_lat=round(12.92 + (i * 0.00003) % 0.3, 6),
                            grid_lng=round(80.10 + (i * 0.00003) % 0.3, 6),
                            status=ReportStatus.unsafe if i % 2 == 0 else ReportStatus.safe,
                            category=ReportCategory.poor_lighting if i % 3 == 0 else ReportCategory.catcalling,
                            device_id=_device_id(),
                            confirmations=i % 4,
                            created_at=now - timedelta(days=(i % 60)),
                        )
                        for i in range(batch, min(batch + batch_size, size))
                    ]
                    db.add_all(reports)
                    await db.commit()

                # Measure query latency for GET /reports/heatmap
                start_query = time.perf_counter()
                res = await client.get("/reports/heatmap")
                query_duration_ms = (time.perf_counter() - start_query) * 1000.0

                assert res.status_code == 200
                points_count = len(res.json())

                # Estimate storage (Average row size in PostgreSQL/SQLite ≈ 220 bytes)
                estimated_bytes = size * 220
                estimated_mb = estimated_bytes / (1024 * 1024)
                pct_of_neon_cap = (estimated_mb / 500.0) * 100.0

                results[size] = {
                    "query_latency_ms": round(query_duration_ms, 2),
                    "unique_grid_points": points_count,
                    "estimated_mb": round(estimated_mb, 2),
                    "neon_cap_pct": round(pct_of_neon_cap, 2),
                }

                print(
                    f"\n[Scale Test {size:,} Rows] Query Time: {query_duration_ms:.2f}ms | "
                    f"Heatmap Points: {points_count:,} | Est. Storage: {estimated_mb:.2f} MB ({pct_of_neon_cap:.2f}% of 0.5GB Neon Free Tier)"
                )

                # Clean up table for next size run
                await db.execute(Base.metadata.tables["reports"].delete())
                await db.commit()
