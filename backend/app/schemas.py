"""Pydantic request / response models — spec §9."""

import html
import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator

from app.config import settings
from app.models import AffectedGroup, ReportCategory, ReportStatus


def _parse_uuid(v: str) -> str:
    """Helper to validate and normalize UUID strings."""
    try:
        val = uuid.UUID(v)
        return str(val)
    except (ValueError, AttributeError, TypeError):
        raise ValueError("device_id must be a valid UUID string (e.g. 12345678-1234-4234-8234-123456789abc)")


# ---------------------------------------------------------------------------
# Requests
# ---------------------------------------------------------------------------

class ReportCreate(BaseModel):
    lat: float
    lng: float
    status: ReportStatus
    category: ReportCategory
    affected_group: Optional[AffectedGroup] = None
    note: Optional[str] = Field(None, max_length=settings.NOTE_MAX_LENGTH)
    device_id: str

    @field_validator("device_id")
    @classmethod
    def validate_device_id(cls, v: str) -> str:
        return _parse_uuid(v)

    @field_validator("note")
    @classmethod
    def sanitize_note(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        cleaned = v.strip()
        if not cleaned:
            return None
        # Sanitize HTML tags to prevent XSS attacks if rendered
        return html.escape(cleaned[:settings.NOTE_MAX_LENGTH])


class ConfirmRequest(BaseModel):
    device_id: str

    @field_validator("device_id")
    @classmethod
    def validate_device_id(cls, v: str) -> str:
        return _parse_uuid(v)


# ---------------------------------------------------------------------------
# Responses
# ---------------------------------------------------------------------------

class ReportResponse(BaseModel):
    id: str
    grid_lat: float
    grid_lng: float
    created_at: datetime

    model_config = {"from_attributes": True}


class ConfirmResponse(BaseModel):
    confirmations: int


class HeatmapPoint(BaseModel):
    lat: float
    lng: float
    weight: float
    id: Optional[str] = None
    category: Optional[ReportCategory] = None
    status: Optional[ReportStatus] = None
    confirmations: Optional[int] = None


class FlaggedReportResponse(BaseModel):
    id: str
    grid_lat: float
    grid_lng: float
    status: ReportStatus
    category: ReportCategory
    affected_group: Optional[AffectedGroup] = None
    note: Optional[str] = None
    device_id: str
    confirmations: int
    is_flagged: bool
    is_seed: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class ModerationActionResponse(BaseModel):
    success: bool
    message: str
    report_id: str

