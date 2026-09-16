"""Developer testing script — resets rate limits for a specified device_id.

Usage:
  python reset_rate_limit.py <device_id>
"""

import sys
import asyncio
from sqlalchemy import delete
from app.db import async_session
from app.models import Report, Confirmation


async def reset_rate_limit_for_device(device_id: str):
    async with async_session() as session:
        stmt_reports = delete(Report).where(Report.device_id == device_id, Report.is_seed == False)
        stmt_confirms = delete(Confirmation).where(Confirmation.device_id == device_id)
        res_r = await session.execute(stmt_reports)
        res_c = await session.execute(stmt_confirms)
        await session.commit()
        print(f"Successfully cleared {res_r.rowcount} non-seed reports and {res_c.rowcount} confirmations for device: {device_id}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python reset_rate_limit.py <device_id>")
        sys.exit(1)
    asyncio.run(reset_rate_limit_for_device(sys.argv[1]))
