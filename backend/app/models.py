"""SQLAlchemy models — spec §8."""

import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    Integer,
    String,
    UniqueConstraint,
    ForeignKey,
    Enum,
)
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class ReportStatus(str, enum.Enum):
    safe = "safe"
    unsafe = "unsafe"


class ReportCategory(str, enum.Enum):
    """Two separate lists per spec §4.1 — stored in one DB enum but
    kept semantically distinct.  'other' is distinguished per list."""

    # ---- General safety ----
    poor_lighting = "poor_lighting"
    isolated_area = "isolated_area"
    no_cctv = "no_cctv"
    stray_animal = "stray_animal"
    robbery_theft = "robbery_theft"
    unsafe_road = "unsafe_road"
    other_general = "other_general"

    # ---- Women safety ----
    catcalling = "catcalling"
    stalking = "stalking"
    physical_harassment = "physical_harassment"
    unsafe_transport = "unsafe_transport"
    other_women = "other_women"


# Convenience sets for validation / filtering
GENERAL_SAFETY_CATEGORIES = frozenset({
    ReportCategory.poor_lighting,
    ReportCategory.isolated_area,
    ReportCategory.no_cctv,
    ReportCategory.stray_animal,
    ReportCategory.robbery_theft,
    ReportCategory.unsafe_road,
    ReportCategory.other_general,
})

WOMEN_SAFETY_CATEGORIES = frozenset({
    ReportCategory.catcalling,
    ReportCategory.stalking,
    ReportCategory.physical_harassment,
    ReportCategory.unsafe_transport,
    ReportCategory.other_women,
})


class AffectedGroup(str, enum.Enum):
    woman = "woman"
    man = "man"
    elderly = "elderly"
    child = "child"
    general = "general"


# ---------------------------------------------------------------------------
# Tables
# ---------------------------------------------------------------------------

def _uuid() -> str:
    return str(uuid.uuid4())


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Report(Base):
    __tablename__ = "reports"

    id = Column(String(36), primary_key=True, default=_uuid)
    grid_lat = Column(Float, nullable=False, index=True)
    grid_lng = Column(Float, nullable=False, index=True)
    status = Column(Enum(ReportStatus, native_enum=False), nullable=False)
    category = Column(Enum(ReportCategory, native_enum=False), nullable=False)
    affected_group = Column(Enum(AffectedGroup, native_enum=False), nullable=True)
    note = Column(String(240), nullable=True)
    device_id = Column(String(36), nullable=False, index=True)
    confirmations = Column(Integer, default=0, nullable=False)
    is_flagged = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)


class Confirmation(Base):
    """Tracks which device confirmed which report (prevents double-confirm)."""
    __tablename__ = "confirmations"

    id = Column(String(36), primary_key=True, default=_uuid)
    report_id = Column(
        String(36), ForeignKey("reports.id", ondelete="CASCADE"), nullable=False
    )
    device_id = Column(String(36), nullable=False)
    created_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint(
            "report_id", "device_id", name="uq_confirmation_device_report"
        ),
    )
