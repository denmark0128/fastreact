from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.performance.models import ReviewCycle, ReviewStatus


class PerformanceReviewCreate(BaseModel):
    employee_id: int
    review_period: str
    cycle: ReviewCycle = ReviewCycle.quarterly
    rating: int = Field(default=3, ge=1, le=5)
    strengths: str | None = None
    improvements: str | None = None
    goals: str | None = None
    comments: str | None = None


class PerformanceReviewUpdate(BaseModel):
    rating: int | None = Field(default=None, ge=1, le=5)
    strengths: str | None = None
    improvements: str | None = None
    goals: str | None = None
    comments: str | None = None
    status: ReviewStatus | None = None


class PerformanceReviewResponse(BaseModel):
    id: int
    employee_id: int
    employee_name: str | None = None
    reviewer_id: int
    reviewer_name: str | None = None
    review_period: str
    cycle: ReviewCycle
    status: ReviewStatus
    rating: int
    strengths: str | None = None
    improvements: str | None = None
    goals: str | None = None
    comments: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PerformanceReviewListResponse(BaseModel):
    items: list[PerformanceReviewResponse]
    total: int
