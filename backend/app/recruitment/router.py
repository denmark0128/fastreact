from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.audit.service import create_audit_log
from app.auth.models import User, UserRole
from app.dependencies import get_current_user, get_db, require_roles
from app.recruitment.models import Application, JobStatus
from app.recruitment.schemas import (
    ApplicationCreate,
    ApplicationListResponse,
    ApplicationUpdate,
    JobPostingCreate,
    JobPostingListResponse,
    JobPostingResponse,
    JobPostingUpdate,
)
from app.recruitment.service import (
    create_application,
    create_job_posting,
    delete_job_posting,
    get_application,
    get_job_posting,
    list_applications,
    list_job_postings,
    update_application,
    update_job_posting,
)
from app.utils.responses import success_response

router = APIRouter()


@router.get("/health")
def recruitment_health():
    return success_response("Recruitment module ready")


# ── Job Postings ──

@router.post("/jobs", status_code=status.HTTP_201_CREATED)
def create_job_posting_endpoint(
    payload: JobPostingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin, UserRole.hr_manager)),
):
    posting = create_job_posting(db, payload, created_by=current_user.id)
    create_audit_log(
        db,
        action="create_job_posting",
        entity_type="job_posting",
        entity_id=posting.id,
        actor=current_user,
        details={"title": posting.title},
    )
    # Build response with application count = 0 (new posting)
    resp = JobPostingResponse(
        id=posting.id,
        title=posting.title,
        department=posting.department,
        description=posting.description,
        requirements=posting.requirements,
        status=posting.status,
        created_by=posting.created_by,
        application_count=0,
        created_at=posting.created_at,
        updated_at=posting.updated_at,
    )
    return success_response("Job posting created", resp.model_dump())


@router.get("/jobs")
def list_job_postings_endpoint(
    status_filter: JobStatus | None = None,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    items, total = list_job_postings(db, status_filter=status_filter, skip=skip, limit=limit)
    response = JobPostingListResponse(items=items, total=total)
    return success_response("Job postings fetched", response.model_dump())


@router.get("/jobs/{posting_id}")
def get_job_posting_endpoint(
    posting_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    posting = get_job_posting(db, posting_id)
    app_count = db.query(func.count(Application.id)).filter(Application.job_posting_id == posting_id).scalar() or 0
    resp = JobPostingResponse(
        id=posting.id,
        title=posting.title,
        department=posting.department,
        description=posting.description,
        requirements=posting.requirements,
        status=posting.status,
        created_by=posting.created_by,
        application_count=app_count,
        created_at=posting.created_at,
        updated_at=posting.updated_at,
    )
    return success_response("Job posting fetched", resp.model_dump())


@router.put("/jobs/{posting_id}")
def update_job_posting_endpoint(
    posting_id: int,
    payload: JobPostingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin, UserRole.hr_manager)),
):
    posting = update_job_posting(db, posting_id, payload)
    create_audit_log(
        db,
        action="update_job_posting",
        entity_type="job_posting",
        entity_id=posting.id,
        actor=current_user,
    )
    return success_response("Job posting updated")


@router.delete("/jobs/{posting_id}")
def delete_job_posting_endpoint(
    posting_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin, UserRole.hr_manager)),
):
    delete_job_posting(db, posting_id)
    create_audit_log(
        db,
        action="delete_job_posting",
        entity_type="job_posting",
        entity_id=posting_id,
        actor=current_user,
    )
    return success_response("Job posting deleted")


# ── Applications ──

@router.post("/applications", status_code=status.HTTP_201_CREATED)
def create_application_endpoint(
    payload: ApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    application = create_application(db, payload)
    create_audit_log(
        db,
        action="create_application",
        entity_type="application",
        entity_id=application.id,
        actor=current_user,
        details={"applicant_name": application.applicant_name, "job_posting_id": application.job_posting_id},
    )
    return success_response("Application submitted")


@router.get("/applications")
def list_applications_endpoint(
    job_posting_id: int | None = None,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.admin, UserRole.hr_manager)),
):
    items, total = list_applications(db, job_posting_id=job_posting_id, skip=skip, limit=limit)
    response = ApplicationListResponse(items=items, total=total)
    return success_response("Applications fetched", response.model_dump())


@router.put("/applications/{application_id}")
def update_application_endpoint(
    application_id: int,
    payload: ApplicationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin, UserRole.hr_manager)),
):
    application = update_application(db, application_id, payload)
    create_audit_log(
        db,
        action="update_application",
        entity_type="application",
        entity_id=application.id,
        actor=current_user,
        details={"new_status": application.status.value if application.status else None},
    )
    return success_response("Application updated")
