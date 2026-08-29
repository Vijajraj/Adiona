"""Keep-Alive Pinger Service — Prevents Render free-tier cold starts.

Render free tier spins down backends after 15 minutes of inactivity.
This service periodically pings `GET /health` (every 10 minutes) to keep
the server instance warm and responsive.
"""

import asyncio
import logging
import httpx
from app.config import settings

logger = logging.getLogger(__name__)

# Ping every 10 minutes (600 seconds) — Render sleeps after 15 minutes
PING_INTERVAL_SECONDS = 600


async def start_keep_alive_loop():
    """Background asyncio loop that pings the backend health endpoint."""
    target_url = settings.BACKEND_PUBLIC_URL.strip() if settings.BACKEND_PUBLIC_URL else None

    if not target_url:
        target_url = "http://127.0.0.1:8000/health"

    if not target_url.endswith("/health"):
        target_url = target_url.rstrip("/") + "/health"

    logger.info(f"Keep-Alive service initialized for target: {target_url}")

    async with httpx.AsyncClient(timeout=10.0) as client:
        while True:
            try:
                await asyncio.sleep(PING_INTERVAL_SECONDS)
                logger.info(f"Sending Keep-Alive ping to {target_url}...")
                resp = await client.get(target_url)
                if resp.status_code == 200:
                    logger.info(f"Keep-Alive ping successful! Status: {resp.status_code}")
                else:
                    logger.warning(f"Keep-Alive ping returned non-200 status: {resp.status_code}")
            except asyncio.CancelledError:
                logger.info("Keep-Alive loop cancelled (application shutting down).")
                break
            except Exception as err:
                logger.error(f"Keep-Alive ping failed: {err}")
