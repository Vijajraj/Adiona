from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine, AsyncSession
from app.config import settings
from app.models import Base

db_url = settings.DATABASE_URL
connect_args = {}
engine_kwargs = {
    "echo": False,
    "pool_pre_ping": True,
}

if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
else:
    # Handle PostgreSQL / Neon asyncpg SSL parameters cleanly
    if "sslmode=" in db_url or "channel_binding=" in db_url:
        import re
        db_url = re.sub(r"[\?&](sslmode|channel_binding)=[^&]*", "", db_url)
        if "?" not in db_url and "&" in db_url:
            db_url = db_url.replace("&", "?", 1)
        connect_args["ssl"] = "require"

    engine_kwargs.update({
        "pool_size": 10,
        "max_overflow": 20,
        "pool_recycle": 300,
    })

engine = create_async_engine(
    db_url,
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
