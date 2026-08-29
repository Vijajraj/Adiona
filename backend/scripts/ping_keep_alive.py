#!/usr/bin/env python3
"""Standalone Keep-Alive Pinger Script.

Can be run via cron, scheduled task, or background daemon:
python backend/scripts/ping_keep_alive.py https://your-backend.onrender.com
"""

import sys
import time
import urllib.request
import urllib.error


def ping_health(target_base_url: str) -> bool:
    target_url = target_base_url.rstrip('/') + '/health'
    print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Pinging: {target_url}...")

    req = urllib.request.Request(
        target_url,
        headers={"User-Agent": "Adiona-KeepAlive-Pinger/1.0"}
    )

    try:
        with urllib.request.urlopen(req, timeout=25) as response:
            status = response.getcode()
            body = response.read().decode('utf-8')
            print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Status: {status} | Body: {body}")
            return status == 200
    except urllib.error.HTTPError as e:
        print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] HTTP Error: {e.code} - {e.reason}")
        return False
    except Exception as e:
        print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Connection Error: {e}")
        return False


if __name__ == "__main__":
    url = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8000"
    success = ping_health(url)
    sys.exit(0 if success else 1)
