import enum
from datetime import UTC, datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


def _utcnow() -> datetime:
    return datetime.now(UTC)


class ReviewCycle(str, enum.Enum):
    quarterly = "quarterly"
    semi_annual = "semi_annual"
    annual = "annual"


class ReviewStatus(str, enum.Enum):
    draft = "draft"
    submitted = "submitted"
    acknowledged = "acknowledged"


class PerformanceReview(Base):
    __tablename__ = "performance_reviews"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id"), nullable=False, index=True)
    reviewer_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    review_period: Mapped[str] = mapped_column(String(50), nullable=False)
    cycle: Mapped[ReviewCycle] = mapped_column(Enum(ReviewCycle), nullable=False, default=ReviewCycle.quarterly)
    status: Mapped[ReviewStatus] = mapped_column(Enum(ReviewStatus), nullable=False, default=ReviewStatus.draft)

    rating: Mapped[int] = mapped_column(Integer, nullable=False, default=3)  # 1-5 scale
    strengths: Mapped[str | None] = mapped_column(Text, nullable=True)
    improvements: Mapped[str | None] = mapped_column(Text, nullable=True)
    goals: Mapped[str | None] = mapped_column(Text, nullable=True)
    comments: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=_utcnow, onupdate=_utcnow)
