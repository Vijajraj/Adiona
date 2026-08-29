"""Chennai Safety Map — FastAPI application entry point."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from sqlalchemy import text

from app.config import settings
from app.db import engine, init_db
from app.routers.moderation import router as moderation_router
from app.routers.reports import limiter, router as reports_router

logger = logging.getLogger(__name__)


# --------------------------------------------------------------------------
# Lifespan: create tables & start background tasks on startup
# --------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create database tables & handle background tasks on startup/shutdown."""
    import asyncio
    await init_db()

    keep_alive_task = None
    if settings.ENABLE_KEEP_ALIVE:
        from app.services.keep_alive import start_keep_alive_loop
        keep_alive_task = asyncio.create_task(start_keep_alive_loop())
        logger.info("Keep-Alive background pinger task started.")

    yield

    if keep_alive_task and not keep_alive_task.done():
        keep_alive_task.cancel()
        try:
            await keep_alive_task
        except asyncio.CancelledError:
            pass
        logger.info("Keep-Alive background task stopped.")


# --------------------------------------------------------------------------
# App factory
# --------------------------------------------------------------------------
app = FastAPI(
    title="Chennai Safety Map API",
    description=(
        "No-login, crowdsourced safety reporting API for Chennai. "
        "Reports are anonymous, grid-snapped, and rate-limited."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# slowapi state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# Global unhandled exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled error processing request {request.url.path}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Please try again later."},
    )


# CORS — allow frontend origins (spec §7)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(reports_router)
app.include_router(moderation_router)


# --------------------------------------------------------------------------
# Health check with DB connection ping
# --------------------------------------------------------------------------
@app.get("/health", tags=["meta"])
async def health():
    db_status = "ok"
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
    except Exception as e:
        logger.error(f"Health DB ping failed: {e}")
        db_status = "unreachable"

    return {
        "status": "ok" if db_status == "ok" else "degraded",
        "database": db_status,
    }
