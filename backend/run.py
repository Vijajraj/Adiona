"""Universal entrypoint for Render and local development inside backend directory."""
import os
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

import uvicorn

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    host = "0.0.0.0"
    print(f"--> Starting Adiona Backend on {host}:{port} (PORT={port})...")
    uvicorn.run("app.main:app", host=host, port=port, log_level="info")
