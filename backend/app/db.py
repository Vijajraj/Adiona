from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine, AsyncSession
from app.config import settings
from app.models import Base

connect_args = {}
engine_kwargs = {
    "echo": False,
    "pool_pre_ping": True,
}

if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
else:
    # PostgreSQL / Neon production pool settings
    engine_kwargs.update({
        "pool_size": 10,
        "max_overflow": 20,
        "pool_recycle": 300,
    })

engine = create_async_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    **engine_kwargs,
)

async_session = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)


async def init_db():
    """Create all database tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_db():
    """FastAPI dependency — yields an async DB session."""
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()
