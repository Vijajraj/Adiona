"""Universal entrypoint for Render and local development.

Guarantees binding to 0.0.0.0 and dynamically reads $PORT provided by Render
(defaults to 10000 on Render, 8000 locally). Works whether executed from repo
root or backend directory.
"""
import os
import sys

# Ensure both root and backend directories are on sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(BASE_DIR, "backend")
if os.path.isdir(backend_dir) and backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

import uvicorn

if __name__ == "__main__":
    # Render sets the PORT environment variable (typically 10000)
    port = int(os.environ.get("PORT", 10000))
    host = "0.0.0.0"
    print(f"--> Starting Adiona Backend on {host}:{port} (PORT={port})...")

    # Determine import string based on current path
    app_import = "app.main:app"
    try:
        __import__("app.main")
    except ImportError:
        app_import = "backend.app.main:app"

    uvicorn.run(app_import, host=host, port=port, log_level="info")
