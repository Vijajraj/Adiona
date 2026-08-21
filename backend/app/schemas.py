"""Pydantic request / response models — spec §9."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

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
    device_id: str = Field(..., min_length=36, max_length=36)


class ConfirmRequest(BaseModel):
    device_id: str = Field(..., min_length=36, max_length=36)


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
