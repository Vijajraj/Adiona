"""Chennai bounding-box validation — spec §11a."""

from fastapi import HTTPException

# Exact coordinates from OSM Nominatim (spec §11a)
CHENNAI_MIN_LAT = 12.9205289
CHENNAI_MAX_LAT = 13.2405289
CHENNAI_MIN_LON = 80.1070369
CHENNAI_MAX_LON = 80.4270369


def validate_chennai_bounds(lat: float, lng: float) -> None:
    """Raise HTTP 400 if (lat, lng) falls outside the Chennai bounding box.

    This is the authoritative server-side check — the frontend maxBounds
    is UX-only, not a security boundary (spec §10).
    """
    if not (
        CHENNAI_MIN_LAT <= lat <= CHENNAI_MAX_LAT
        and CHENNAI_MIN_LON <= lng <= CHENNAI_MAX_LON
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                f"Location ({lat:.6f}, {lng:.6f}) is outside Chennai city bounds. "
                f"Valid range: lat [{CHENNAI_MIN_LAT}, {CHENNAI_MAX_LAT}], "
                f"lng [{CHENNAI_MIN_LON}, {CHENNAI_MAX_LON}]."
            ),
        )
