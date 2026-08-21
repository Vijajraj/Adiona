"""Seed data loader script for Chennai Safety Map — Phase 3.

Reads seed_data.csv, validates each record against Chennai bounding box,
snaps coordinates to the ~100m grid, and inserts records into the database
with is_seed=True.
"""

import asyncio
import csv
import logging
import os
import sys

from sqlalchemy.ext.asyncio import AsyncSession

from app.db import async_session, init_db
from app.models import Report, ReportCategory, ReportStatus
from app.services.geo_validator import validate_chennai_bounds
from app.services.grid_snap import snap_to_grid

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

# Category mapping from raw CSV strings to ReportCategory enum values
CATEGORY_MAP = {
    "unsafe_road_no_footpath": ReportCategory.unsafe_road,
    "unsafe_road": ReportCategory.unsafe_road,
    "poor_lighting": ReportCategory.poor_lighting,
    "robbery_theft_prone": ReportCategory.robbery_theft,
    "robbery_theft": ReportCategory.robbery_theft,
    "physical_harassment": ReportCategory.physical_harassment,
    "stray_animal_risk": ReportCategory.stray_animal,
    "stray_animal": ReportCategory.stray_animal,
    "unsafe_transport_stop": ReportCategory.unsafe_transport,
    "unsafe_transport": ReportCategory.unsafe_transport,
    "catcalling_harassment": ReportCategory.catcalling,
    "catcalling": ReportCategory.catcalling,
    "stalking": ReportCategory.stalking,
    "isolated_area": ReportCategory.isolated_area,
    "no_cctv": ReportCategory.no_cctv,
    "other_general": ReportCategory.other_general,
    "other_women": ReportCategory.other_women,
}

SEED_DEVICE_ID = "00000000-0000-0000-0000-000000000001"


async def load_seed_data(csv_path: str = "seed_data.csv") -> tuple[int, int]:
    """Parse and insert seed records into the database."""
    if not os.path.exists(csv_path):
        logger.error(f"Seed file '{csv_path}' not found.")
        return 0, 0

    await init_db()

    inserted_count = 0
    skipped_count = 0
    out_of_bounds_count = 0

    records_to_insert = []

    with open(csv_path, mode="r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row_idx, row in enumerate(reader, start=1):
            try:
                raw_lat = float(row.get("approx_lat") or row.get("lat"))
                raw_lng = float(row.get("approx_lng") or row.get("lng"))
                raw_category = (row.get("category") or "").strip().lower()
                location_name = (row.get("location_name") or row.get("notes") or "").strip()

                # Map category
                category = CATEGORY_MAP.get(raw_category)
                if not category:
                    logger.warning(f"Row {row_idx}: Unknown category '{raw_category}', skipping.")
                    skipped_count += 1
                    continue

                # Validate Chennai bounding box
                try:
                    validate_chennai_bounds(raw_lat, raw_lng)
                except Exception as e:
                    logger.warning(
                        f"Row {row_idx}: Location ({raw_lat}, {raw_lng}) '{location_name}' out of bounds. Skipping."
                    )
                    out_of_bounds_count += 1
                    skipped_count += 1
                    continue

                # Snap to grid
                grid_lat, grid_lng = snap_to_grid(raw_lat, raw_lng)

                # Prepare report object
                report = Report(
                    grid_lat=grid_lat,
                    grid_lng=grid_lng,
                    status=ReportStatus.unsafe,
                    category=category,
                    affected_group=None,
                    note=location_name[:240] if location_name else None,
                    device_id=SEED_DEVICE_ID,
                    confirmations=0,
                    is_flagged=False,
                    is_seed=True,
                )
                records_to_insert.append(report)

            except (ValueError, TypeError, KeyError) as err:
                logger.warning(f"Row {row_idx}: Failed to parse row ({err}). Skipping.")
                skipped_count += 1

    async with async_session() as session:
        for r in records_to_insert:
            session.add(r)
        await session.commit()
        inserted_count = len(records_to_insert)

    logger.info("=" * 60)
    logger.info(f"SEED DATA LOAD COMPLETE:")
    logger.info(f"  Successfully Inserted: {inserted_count}")
    logger.info(f"  Skipped Total:         {skipped_count}")
    logger.info(f"    (Out of Bounds:      {out_of_bounds_count})")
    logger.info("=" * 60)

    return inserted_count, skipped_count


if __name__ == "__main__":
    csv_file = sys.argv[1] if len(sys.argv) > 1 else "seed_data.csv"
    asyncio.run(load_seed_data(csv_file))
