from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.recruitment.models import ApplicationStatus, JobStatus


# ── Job Postings ──

class JobPostingCreate(BaseModel):
    title: str
    department: str
    description: str | None = None
    requirements: str | None = None


class JobPostingUpdate(BaseModel):
    title: str | None = None
    department: str | None = None
    description: str | None = None
    requirements: str | None = None
    status: JobStatus | None = None


class JobPostingResponse(BaseModel):
    id: int
    title: str
    department: str
    description: str | None = None
    requirements: str | None = None
    status: JobStatus
    created_by: int
    application_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class JobPostingListResponse(BaseModel):
    items: list[JobPostingResponse]
    total: int


# ── Applications ──

class ApplicationCreate(BaseModel):
    job_posting_id: int
    applicant_name: str
    applicant_email: EmailStr
    phone: str | None = None
    resume_url: str | None = None
    cover_letter: str | None = None


class ApplicationUpdate(BaseModel):
    status: ApplicationStatus | None = None
    notes: str | None = None


class ApplicationResponse(BaseModel):
    id: int
    job_posting_id: int
    job_title: str | None = None
    applicant_name: str
    applicant_email: str
    phone: str | None = None
    resume_url: str | None = None
    cover_letter: str | None = None
    status: ApplicationStatus
    notes: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ApplicationListResponse(BaseModel):
    items: list[ApplicationResponse]
    total: int
