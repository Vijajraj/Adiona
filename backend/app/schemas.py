"""Pydantic request / response models — spec §9."""

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator

from app.models import AffectedGroup, ReportCategory, ReportStatus


# ---------------------------------------------------------------------------
# Requests
# ---------------------------------------------------------------------------

class ReportCreate(BaseModel):
    lat: float
    lng: float
    status: ReportStatus
    category: ReportCategory
    affected_group: Optional[AffectedGroup] = None
    note: Optional[str] = Field(None, max_length=240)
    device_id: str

    @field_validator("device_id")
    @classmethod
    def validate_device_id(cls, v: str) -> str:
        try:
            val = uuid.UUID(v)
            return str(val)
        except (ValueError, AttributeError, TypeError):
            raise ValueError("device_id must be a valid UUID string (e.g. 12345678-1234-4234-8234-123456789abc)")

    @field_validator("note")
    @classmethod
    def sanitize_note(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        cleaned = v.strip()
        return cleaned if cleaned else None


class ConfirmRequest(BaseModel):
    device_id: str

    @field_validator("device_id")
    @classmethod
    def validate_device_id(cls, v: str) -> str:
        try:
            val = uuid.UUID(v)
            return str(val)
        except (ValueError, AttributeError, TypeError):
            raise ValueError("device_id must be a valid UUID string")


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
