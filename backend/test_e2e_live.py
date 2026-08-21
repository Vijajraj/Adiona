"""Live E2E Verification Script for Chennai Safety Map Backend."""

import asyncio
import uuid
from httpx import ASGITransport, AsyncClient
from app.main import app
from app.db import init_db
from app.routers.reports import limiter

async def run_live_checks():
    print("=" * 60)
    print("STARTING LIVE BACKEND INTEGRATION CHECKS")
    print("=" * 60)

    # Initialize tables
    await init_db()

    # Disable IP-level rate limiter for test run so 127.0.0.1 isn't blocked on bulk calls
    limiter.enabled = False

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Health check
        print("\n1. Checking GET /health ...")
        resp = await client.get("/health")
        print(f"   Status: {resp.status_code}, Body: {resp.json()}")
        assert resp.status_code == 200

        # 2. Valid report in Chennai (Marina Beach)
        print("\n2. Submitting valid report at Marina Beach (lat: 13.0475, lng: 80.2824)...")
        device_a = str(uuid.uuid4())
        payload_a = {
            "lat": 13.0475,
            "lng": 80.2824,
            "status": "unsafe",
            "category": "poor_lighting",
            "affected_group": "woman",
            "note": "Pitch dark walkway near service lane",
            "device_id": device_a,
        }
        resp = await client.post("/reports", json=payload_a)
        print(f"   Status: {resp.status_code}")
        report_data = resp.json()
        print(f"   Created Report: {report_data}")
        assert resp.status_code == 201
        report_id = report_data["id"]

        # 3. Out-of-bounds report rejection
        print("\n3. Testing out-of-bounds rejection (lat: 12.9716, lng: 77.5946 - Bangalore)...")
        resp = await client.post(
            "/reports",
            json={
                "lat": 12.9716,
                "lng": 77.5946,
                "status": "unsafe",
                "category": "stray_animal",
                "device_id": str(uuid.uuid4()),
            },
        )
        print(f"   Status: {resp.status_code}, Detail: {resp.json().get('detail')}")
        assert resp.status_code == 400

        # 4. Same cell cooldown check
        print("\n4. Testing 24h per-cell cooldown with Device A at same location...")
        resp = await client.post("/reports", json=payload_a)
        print(f"   Status: {resp.status_code}, Detail: {resp.json().get('detail')}")
        assert resp.status_code == 429

        # 5. Confirm existing report with Device B
        print("\n5. Confirming existing report with Device B...")
        device_b = str(uuid.uuid4())
        resp = await client.post(
            f"/reports/{report_id}/confirm",
            json={"device_id": device_b},
        )
        print(f"   Status: {resp.status_code}, Body: {resp.json()}")
        assert resp.status_code == 200
        assert resp.json()["confirmations"] == 1

        # 6. Double confirm rejection
        print("\n6. Testing double confirm rejection with Device B...")
        resp = await client.post(
            f"/reports/{report_id}/confirm",
            json={"device_id": device_b},
        )
        print(f"   Status: {resp.status_code}, Detail: {resp.json().get('detail')}")
        assert resp.status_code == 409

        # 7. Self confirm rejection
        print("\n7. Testing self-confirm rejection with creator (Device A)...")
        resp = await client.post(
            f"/reports/{report_id}/confirm",
            json={"device_id": device_a},
        )
        print(f"   Status: {resp.status_code}, Detail: {resp.json().get('detail')}")
        assert resp.status_code == 400

        # 8. GET Heatmap
        print("\n8. Fetching aggregated heatmap data from GET /reports/heatmap...")
        resp = await client.get("/reports/heatmap")
        print(f"   Status: {resp.status_code}")
        heatmap = resp.json()
        print(f"   Heatmap points returned: {len(heatmap)}")
        for pt in heatmap[:3]:
            print(f"   -> Point: {pt}")
        assert resp.status_code == 200
        assert len(heatmap) >= 1
        assert heatmap[0]["weight"] >= 2  # 1 report + 1 confirmation = weight 2

        # 9. Filtered Heatmap
        print("\n9. Testing category filter (category=poor_lighting vs category=stalking)...")
        resp_match = await client.get("/reports/heatmap?category=poor_lighting")
        resp_empty = await client.get("/reports/heatmap?category=stalking")
        print(f"   poor_lighting points: {len(resp_match.json())}")
        print(f"   stalking points: {len(resp_empty.json())}")
        assert len(resp_match.json()) >= 1
        assert len(resp_empty.json()) == 0

        # 10. Device Daily Limit (5 reports max)
        print("\n10. Testing device 5 reports/day daily limit...")
        device_c = str(uuid.uuid4())
        for i in range(5):
            r = await client.post(
                "/reports",
                json={
                    "lat": 13.0800 + (i * 0.005),
                    "lng": 80.2000 + (i * 0.005),
                    "status": "unsafe",
                    "category": "poor_lighting",
                    "device_id": device_c,
                },
            )
            assert r.status_code == 201

        # 6th report by device C
        r6 = await client.post(
            "/reports",
            json={
                "lat": 13.1100,
                "lng": 80.2300,
                "status": "unsafe",
                "category": "poor_lighting",
                "device_id": device_c,
            },
        )
        print(f"   6th report status: {r6.status_code}, Detail: {r6.json().get('detail')}")
        assert r6.status_code == 429

    print("\n" + "=" * 60)
    print("ALL 10 LIVE BACKEND INTEGRATION CHECKS PASSED PERFECTLY!")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(run_live_checks())
