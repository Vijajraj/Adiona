"""Chennai Safety Map — FastAPI application entry point."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.db import engine
from app.models import Base
from app.routers.reports import limiter, router as reports_router


# --------------------------------------------------------------------------
# Lifespan: create tables on startup
# --------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create database tables on startup (idempotent)."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


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

# CORS — allow the frontend origin (spec §7)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:5173",  # Vite dev server
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(reports_router)


# --------------------------------------------------------------------------
# Health check
# --------------------------------------------------------------------------
@app.get("/health", tags=["meta"])
async def health():
    return {"status": "ok"}
