import pytest
from pydantic import ValidationError
from app.schemas import ReportCreate, ConfirmRequest
from app.models import ReportStatus, ReportCategory, AffectedGroup

def test_report_create_valid():
    valid_uuid = "12345678-1234-4234-8234-123456789abc"
    data = {
        "lat": 13.0827,
        "lng": 80.2707,
        "status": "unsafe",
        "category": "poor_lighting",
        "affected_group": "woman",
        "note": "  Walkway streetlight damaged  ",
        "device_id": valid_uuid,
    }
    report = ReportCreate(**data)
    assert report.status == ReportStatus.unsafe
    assert report.category == ReportCategory.poor_lighting
    assert report.affected_group == AffectedGroup.woman
    assert report.note == "Walkway streetlight damaged"  # trimmed
    assert report.device_id == valid_uuid

def test_report_create_invalid_uuid():
    with pytest.raises(ValidationError) as exc:
        ReportCreate(
            lat=13.0827,
            lng=80.2707,
            status="unsafe",
            category="poor_lighting",
            device_id="not-a-valid-uuid",
        )
    assert "valid UUID" in str(exc.value)

def test_report_create_invalid_category():
    with pytest.raises(ValidationError):
        ReportCreate(
            lat=13.0827,
            lng=80.2707,
            status="unsafe",
            category="invalid_cat",
            device_id="12345678-1234-4234-8234-123456789abc",
        )

def test_report_create_note_max_length():
    with pytest.raises(ValidationError):
        ReportCreate(
            lat=13.0827,
            lng=80.2707,
            status="unsafe",
            category="poor_lighting",
            note="A" * 241,  # exceeds 240 limit
            device_id="12345678-1234-4234-8234-123456789abc",
        )

def test_confirm_request_validation():
    valid = ConfirmRequest(device_id="12345678-1234-4234-8234-123456789abc")
    assert valid.device_id == "12345678-1234-4234-8234-123456789abc"

    with pytest.raises(ValidationError):
        ConfirmRequest(device_id="invalid")
