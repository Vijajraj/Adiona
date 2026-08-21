"""Snap exact coordinates to a ~100 m grid cell — spec §4.1, §11.

Grid-snapping serves two purposes:
  1. Privacy — exact click location is never stored.
  2. Anti-spam — enables per-device-per-cell cooldown checks.

At Chennai's latitude (~13° N):
  - 1° latitude  ≈ 111 320 m  →  100 m ≈ 0.000898°
  - 1° longitude ≈ 111 320 × cos(13°) ≈ 108 488 m  →  100 m ≈ 0.000922°
"""

import math

_LAT_STEP = 100.0 / 111_320.0  # ~0.000898
_LNG_STEP = 100.0 / (111_320.0 * math.cos(math.radians(13.0)))  # ~0.000922


def snap_to_grid(lat: float, lng: float) -> tuple[float, float]:
    """Return (grid_lat, grid_lng) snapped to the nearest ~100 m cell centre."""
    grid_lat = round(lat / _LAT_STEP) * _LAT_STEP
    grid_lng = round(lng / _LNG_STEP) * _LNG_STEP
    # Round to 7 decimal places to avoid floating-point artefacts
    return round(grid_lat, 7), round(grid_lng, 7)
