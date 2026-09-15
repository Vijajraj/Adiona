import csv
import uuid
import asyncio
import asyncpg
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
    "poor_lighting": ("poor_lighting", "general"),
    "robbery_theft_prone": ("robbery_theft", "general"),
    "unsafe_transport_stop": ("unsafe_transport", "woman"),
    "stalking": ("stalking", "woman"),
    "catcalling_harassment": ("catcalling", "woman"),
    "physical_harassment": ("physical_harassment", "woman"),
    "stray_animal_risk": ("stray_animal", "general"),
    "no_cctv": ("no_cctv", "general"),
    "isolated_area": ("isolated_area", "general"),
}

def process_csv():
    raw_path = Path(__file__).parent / "seed_raw.csv"
    out_path = Path(__file__).parent / "seed_data.csv"
    
    reports = []
    with open(raw_path, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader):
            lat = float(row["approx_lat"])
            lng = float(row["approx_lng"])
            grid_lat, grid_lng = snap_to_grid(lat, lng)
            
            raw_cat = row["category"].strip()
            cat, affected = CATEGORY_MAP.get(raw_cat, ("other_general", "general"))
            
            note = f"{row['location_name']}: {row['notes']}"[:240]
            dev_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"seed_v2_{i}_{grid_lat}_{grid_lng}"))
            
            reports.append({
                "id": str(uuid.uuid4()),
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
            
    print(f"Processed {len(reports)} incident records from seed_raw.csv")
    
    # Save canonical seed_data.csv
    with open(out_path, mode="w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["id", "grid_lat", "grid_lng", "status", "category", "affected_group", "note", "device_id", "confirmations", "is_flagged"])
        writer.writeheader()
        writer.writerows(reports)
        
    return reports

async def seed_neon(reports):
    neon_url = "postgresql://neondb_owner:npg_YpLFqA8fXCt5@ep-sparkling-boat-b304gj5m-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
    print("Connecting to Neon Database...")
    conn = await asyncpg.connect(neon_url)
    
    print("Clearing old test reports in Neon DB...")
    await conn.execute("TRUNCATE reports CASCADE;")
    
    inserted = 0
    for r in reports:
        try:
            await conn.execute(
                """
                INSERT INTO reports (id, grid_lat, grid_lng, status, category, affected_group, note, device_id, confirmations, is_flagged, is_seed, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE, NOW())
                """,
                r["id"], r["grid_lat"], r["grid_lng"], r["status"], r["category"], r["affected_group"], r["note"], r["device_id"], r["confirmations"], r["is_flagged"]
            )
            inserted += 1
        except Exception as e:
            print(f"Skipping duplicate/invalid row: {e}")
            
    print(f"Successfully inserted {inserted} verified records into Neon DB!")
    await conn.close()

if __name__ == "__main__":
    recs = process_csv()
    asyncio.run(seed_neon(recs))
