import pytest
from fastapi import HTTPException
from app.services.geo_validator import (
    validate_chennai_bounds,
    CHENNAI_MIN_LAT,
    CHENNAI_MAX_LAT,
    CHENNAI_MIN_LON,
    CHENNAI_MAX_LON,
)

def test_valid_coordinates_inside_chennai():
    # Center of Chennai
    validate_chennai_bounds(13.0827, 80.2707)

    # All 4 boundary corners
    validate_chennai_bounds(CHENNAI_MIN_LAT, CHENNAI_MIN_LON)
    validate_chennai_bounds(CHENNAI_MAX_LAT, CHENNAI_MAX_LON)
    validate_chennai_bounds(CHENNAI_MIN_LAT, CHENNAI_MAX_LON)
    validate_chennai_bounds(CHENNAI_MAX_LAT, CHENNAI_MIN_LON)

def test_reject_south_of_chennai():
    with pytest.raises(HTTPException) as exc_info:
        validate_chennai_bounds(CHENNAI_MIN_LAT - 0.01, 80.2707)
    assert exc_info.value.status_code == 400
    assert "outside Chennai" in exc_info.value.detail

def test_reject_north_of_chennai():
    with pytest.raises(HTTPException) as exc_info:
        validate_chennai_bounds(CHENNAI_MAX_LAT + 0.01, 80.2707)
    assert exc_info.value.status_code == 400
    assert "outside Chennai" in exc_info.value.detail

def test_reject_west_of_chennai():
    with pytest.raises(HTTPException) as exc_info:
        validate_chennai_bounds(13.0827, CHENNAI_MIN_LON - 0.01)
    assert exc_info.value.status_code == 400
    assert "outside Chennai" in exc_info.value.detail

def test_reject_east_of_chennai():
    with pytest.raises(HTTPException) as exc_info:
        validate_chennai_bounds(13.0827, CHENNAI_MAX_LON + 0.01)
    assert exc_info.value.status_code == 400
    assert "outside Chennai" in exc_info.value.detail
