import csv
import uuid
import asyncio
import asyncpg
import json
import sqlite3
from pathlib import Path
import math

_LAT_STEP = 100.0 / 111_320.0
_LNG_STEP = 100.0 / (111_320.0 * math.cos(math.radians(13.0)))

def snap_to_grid(lat: float, lng: float) -> tuple[float, float]:
    grid_lat = round(lat / _LAT_STEP) * _LAT_STEP
    grid_lng = round(lng / _LNG_STEP) * _LNG_STEP
    return round(grid_lat, 7), round(grid_lng, 7)

CATEGORY_MAP = {
    "unsafe_road_no_footpath": ("unsafe_road", "general"),
    "unsafe_road": ("unsafe_road", "general"),
    "poor_lighting": ("poor_lighting", "general"),
    "robbery_theft_prone": ("robbery_theft", "general"),
    "robbery_theft": ("robbery_theft", "general"),
    "unsafe_transport_stop": ("unsafe_transport", "woman"),
    "unsafe_transport": ("unsafe_transport", "woman"),
    "stalking": ("stalking", "woman"),
    "catcalling_harassment": ("catcalling", "woman"),
    "catcalling": ("catcalling", "woman"),
    "physical_harassment": ("physical_harassment", "woman"),
    "stray_animal_risk": ("stray_animal", "general"),
    "stray_animal": ("stray_animal", "general"),
    "no_cctv": ("no_cctv", "general"),
    "isolated_area": ("isolated_area", "general"),
    "other_general": ("other_general", "general"),
    "other_women": ("other_women", "woman"),
}

def process_csv():
    backend_dir = Path(__file__).parent
    raw_path = backend_dir / "seed_raw.csv"
    out_csv_path = backend_dir / "seed_data.csv"
    frontend_json_path = backend_dir.parent / "frontend" / "src" / "data" / "seedReports.json"

    reports = []
    frontend_reports = []

    with open(raw_path, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader):
            lat = float(row["approx_lat"])
            lng = float(row["approx_lng"])
            grid_lat, grid_lng = snap_to_grid(lat, lng)
            
            raw_cat = row["category"].strip()
            cat, affected = CATEGORY_MAP.get(raw_cat, ("other_general", "general"))
            
            loc_name = row["location_name"].strip()
            notes = row["notes"].strip()
            note = f"{loc_name}: {notes}"[:240]
            
            # Deterministic, unique UUID per row index and attributes
            rep_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"chennai_safety_report_{i}_{grid_lat}_{grid_lng}_{cat}"))
            dev_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"seed_v3_dev_{i}_{grid_lat}_{grid_lng}"))
            
            reports.append({
                "id": rep_id,
                "grid_lat": grid_lat,
                "grid_lng": grid_lng,
                "status": "unsafe",
                "category": cat,
                "affected_group": affected,
                "note": note,
                "device_id": dev_id,
                "confirmations": 1,
                "is_flagged": False,
            })

            frontend_reports.append({
                "id": rep_id,
                "lat": grid_lat,
                "lng": grid_lng,
                "weight": 2.0,
                "status": "unsafe",
                "category": cat,
                "affected_group": affected,
                "confirmations": 1,
                "note": note,
                "created_at": "2026-09-24T00:00:00.000Z",
            })
            
    print(f"Processed {len(reports)} incident records from seed_raw.csv")
    
    # Save canonical seed_data.csv
    with open(out_csv_path, mode="w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["id", "grid_lat", "grid_lng", "status", "category", "affected_group", "note", "device_id", "confirmations", "is_flagged"])
        writer.writeheader()
        writer.writerows(reports)
    print(f"Wrote canonical seed_data.csv ({len(reports)} rows)")

    # Save frontend seedReports.json
    frontend_json_path.parent.mkdir(parents=True, exist_ok=True)
    with open(frontend_json_path, mode="w", encoding="utf-8") as f:
        json.dump(frontend_reports, f, indent=2)
    print(f"Wrote frontend seedReports.json ({len(frontend_reports)} reports)")
        
    return reports

async def seed_neon(reports):
    neon_url = "postgresql://neondb_owner:npg_YpLFqA8fXCt5@ep-sparkling-boat-b304gj5m-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
    print("Connecting to Neon Database...")
    try:
        conn = await asyncpg.connect(neon_url, timeout=10)
    except Exception as err:
        print(f"Failed to connect to Neon DB: {err}. Skipping remote seed.")
        return
    
    print("Clearing old test reports in Neon DB...")
    await conn.execute("TRUNCATE reports CASCADE;")
    
    inserted = 0
    for r in reports:
        try:
            await conn.execute(
                """
                INSERT INTO reports (id, grid_lat, grid_lng, status, category, affected_group, note, device_id, confirmations, is_flagged, is_seed, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE, '2026-09-24T00:00:00.000Z')
                """,
                r["id"], r["grid_lat"], r["grid_lng"], r["status"], r["category"], r["affected_group"], r["note"], r["device_id"], r["confirmations"], r["is_flagged"]
            )
            inserted += 1
        except Exception as e:
            print(f"Skipping duplicate/invalid row: {e}")
            
    print(f"Successfully inserted {inserted} verified records into Neon DB!")
    await conn.close()

def seed_sqlite(reports):
    backend_dir = Path(__file__).parent
    db_paths = [backend_dir / "safety_map.db", backend_dir.parent / "safety_map.db"]
    for db_path in db_paths:
        if not db_path.exists():
            continue
        try:
            conn = sqlite3.connect(db_path)
            cur = conn.cursor()
            cur.execute("DELETE FROM reports WHERE is_seed = 1 OR confirmations = 1;")
            inserted = 0
            for r in reports:
                cur.execute(
                    """
                    INSERT OR REPLACE INTO reports (id, grid_lat, grid_lng, status, category, affected_group, note, device_id, confirmations, is_flagged, is_seed, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, '2026-09-24 00:00:00')
                    """,
                    (r["id"], r["grid_lat"], r["grid_lng"], r["status"], r["category"], r["affected_group"], r["note"], r["device_id"], r["confirmations"], r["is_flagged"])
                )
                inserted += 1
            conn.commit()
            conn.close()
            print(f"Synced {inserted} reports to local SQLite: {db_path.name}")
        except Exception as e:
            print(f"SQLite sync warning for {db_path.name}: {e}")

if __name__ == "__main__":
    recs = process_csv()
    seed_sqlite(recs)
    try:
        asyncio.run(seed_neon(recs))
    except Exception as e:
        print(f"Neon seeding completed with note: {e}")
