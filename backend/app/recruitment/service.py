from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.recruitment.models import Application, JobPosting, JobStatus
from app.recruitment.schemas import (
    ApplicationCreate,
    ApplicationResponse,
    ApplicationUpdate,
    JobPostingCreate,
    JobPostingResponse,
    JobPostingUpdate,
)


# ── Job Postings ──

def create_job_posting(db: Session, payload: JobPostingCreate, created_by: int) -> JobPosting:
    posting = JobPosting(
        title=payload.title,
        department=payload.department,
        description=payload.description,
        requirements=payload.requirements,
        created_by=created_by,
    )
    db.add(posting)
    db.commit()
    db.refresh(posting)
    return posting


def list_job_postings(
    db: Session,
    *,
    status_filter: JobStatus | None = None,
    skip: int = 0,
    limit: int = 50,
) -> tuple[list[JobPostingResponse], int]:
    query = db.query(JobPosting)
    if status_filter:
        query = query.filter(JobPosting.status == status_filter)

    total = query.count()
    postings = query.order_by(JobPosting.created_at.desc()).offset(skip).limit(limit).all()

    # Batch count applications per posting
    posting_ids = [p.id for p in postings]
    counts: dict[int, int] = {}
    if posting_ids:
        rows = (
            db.query(Application.job_posting_id, func.count(Application.id))
            .filter(Application.job_posting_id.in_(posting_ids))
            .group_by(Application.job_posting_id)
            .all()
        )
        counts = {row[0]: row[1] for row in rows}

    responses = [
        JobPostingResponse(
            id=p.id,
            title=p.title,
            department=p.department,
            description=p.description,
            requirements=p.requirements,
            status=p.status,
            created_by=p.created_by,
            application_count=counts.get(p.id, 0),
            created_at=p.created_at,
            updated_at=p.updated_at,
        )
        for p in postings
    ]
    return responses, total


def get_job_posting(db: Session, posting_id: int) -> JobPosting:
    posting = db.query(JobPosting).filter(JobPosting.id == posting_id).first()
    if not posting:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job posting not found")
    return posting


def update_job_posting(db: Session, posting_id: int, payload: JobPostingUpdate) -> JobPosting:
    posting = get_job_posting(db, posting_id)
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(posting, key, value)
    db.commit()
    db.refresh(posting)
    return posting


def delete_job_posting(db: Session, posting_id: int) -> None:
    posting = get_job_posting(db, posting_id)
    # Also remove related applications
    db.query(Application).filter(Application.job_posting_id == posting_id).delete()
    db.delete(posting)
    db.commit()


# ── Applications ──

def create_application(db: Session, payload: ApplicationCreate) -> Application:
    # Verify posting exists and is open
    posting = db.query(JobPosting).filter(JobPosting.id == payload.job_posting_id).first()
    if not posting:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job posting not found")
    if posting.status != JobStatus.open:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Job posting is not accepting applications")

    application = Application(
        job_posting_id=payload.job_posting_id,
        applicant_name=payload.applicant_name,
        applicant_email=payload.applicant_email,
        phone=payload.phone,
        resume_url=payload.resume_url,
        cover_letter=payload.cover_letter,
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    return application


def list_applications(
    db: Session,
    *,
    job_posting_id: int | None = None,
    skip: int = 0,
    limit: int = 50,
) -> tuple[list[ApplicationResponse], int]:
    query = db.query(Application)
    if job_posting_id is not None:
        query = query.filter(Application.job_posting_id == job_posting_id)

    total = query.count()
    apps = query.order_by(Application.created_at.desc()).offset(skip).limit(limit).all()

    # Batch-load job titles
    jp_ids = list({a.job_posting_id for a in apps})
    titles_by_id: dict[int, str] = {}
    if jp_ids:
        postings = db.query(JobPosting.id, JobPosting.title).filter(JobPosting.id.in_(jp_ids)).all()
        titles_by_id = {p.id: p.title for p in postings}

    responses = [
        ApplicationResponse(
            id=a.id,
            job_posting_id=a.job_posting_id,
            job_title=titles_by_id.get(a.job_posting_id),
            applicant_name=a.applicant_name,
            applicant_email=a.applicant_email,
            phone=a.phone,
            resume_url=a.resume_url,
            cover_letter=a.cover_letter,
            status=a.status,
            notes=a.notes,
            created_at=a.created_at,
            updated_at=a.updated_at,
        )
        for a in apps
    ]
    return responses, total


def get_application(db: Session, application_id: int) -> Application:
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    return app


def update_application(db: Session, application_id: int, payload: ApplicationUpdate) -> Application:
    app = get_application(db, application_id)
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(app, key, value)
    db.commit()
    db.refresh(app)
    return app
