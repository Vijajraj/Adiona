"""Pydantic request / response models — spec §9."""

import html
import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator

from app.config import settings
from app.models import AffectedGroup, ReportCategory, ReportStatus, TimeBucket


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
    time_bucket: Optional[TimeBucket] = None
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
    time_bucket: Optional[TimeBucket] = None
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
    affected_group: Optional[AffectedGroup] = None
    status: Optional[ReportStatus] = None
    confirmations: Optional[int] = None
    note: Optional[str] = None
    time_bucket: Optional[TimeBucket] = None
    created_at: Optional[datetime] = None


class FeedbackCreate(BaseModel):
    device_id: str
    category: str = Field("suggestion", max_length=50)
    rating: Optional[int] = Field(None, ge=1, le=5)
    message: Optional[str] = Field(None, max_length=1000)

    @field_validator("device_id")
    @classmethod
    def validate_device_id(cls, v: str) -> str:
        return _parse_uuid(v)

    @field_validator("message")
    @classmethod
    def sanitize_message(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        cleaned = v.strip()
        if not cleaned:
            return None
        if len(cleaned) < 2:
            raise ValueError("Message must be at least 2 characters.")
        return html.escape(cleaned[:1000])


class FeedbackResponse(BaseModel):
    id: str
    message: str
    created_at: datetime

    model_config = {"from_attributes": True}



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


# ---------------------------------------------------------------------------
# Phase 2: Credibility, Dashboard, Open Data, & Routing Schemas
# ---------------------------------------------------------------------------

class CellScoreResponse(BaseModel):
    grid_lat: float
    grid_lng: float
    score_unsafe: float
    score_safe: float
    unique_devices: int
    last_report_at: Optional[datetime] = None
    updated_at: datetime

    model_config = {"from_attributes": True}


class DashboardSummaryResponse(BaseModel):
    total_reports: int
    unique_devices: int
    safe_reports_count: int
    unsafe_reports_count: int
    top_categories: dict[str, int]
    time_bucket_breakdown: dict[str, int]
    active_cells_count: int
    suppressed_cells_count: int
    min_k_threshold: int = 5


class DashboardTopZoneResponse(BaseModel):
    grid_lat: float
    grid_lng: float
    report_count: int
    unique_devices: int
    score_unsafe: float
    dominant_category: str
    top_categories: dict[str, int]


class OpenDataExportItem(BaseModel):
    grid_lat: float
    grid_lng: float
    report_count: int
    score_unsafe: float
    score_safe: float
    unique_devices: int
    category_breakdown: dict[str, int]
    last_updated_date: str
    license: str = "CC BY 4.0"


class RoutePoint(BaseModel):
    lat: float
    lng: float


class RouteRiskRequest(BaseModel):
    coordinates: list[list[float]]  # list of [lng, lat] or [lat, lng]
    detour_factor: Optional[float] = 1.0


class RouteRiskSummary(BaseModel):
    total_points: int
    cells_traversed: int
    unsafe_cells_count: int
    max_cell_risk: float
    aggregate_risk_score: float
    lighting_flags_after_dark: int
    high_risk_categories: list[str]
    plain_language_summary: str


class RouteOptionResponse(BaseModel):
    route_id: str
    is_lower_reported_risk: bool
    risk_summary: RouteRiskSummary
    geometry: list[list[float]]
    distance_meters: float
    duration_seconds: float

