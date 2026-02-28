from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.audit.service import create_audit_log
from app.auth.models import User, UserRole
from app.dependencies import get_current_user, get_db, require_roles
from app.employees.models import Employee
from app.performance.schemas import PerformanceReviewCreate, PerformanceReviewListResponse, PerformanceReviewUpdate
from app.performance.service import (
    _batch_enrich_reviews,
    _enrich_review,
    create_review,
    delete_review,
    get_review,
    list_reviews,
    update_review,
)
from app.utils.responses import success_response

router = APIRouter()


@router.get("/health")
def performance_health():
    return success_response("Performance module ready")


@router.post("/reviews", status_code=status.HTTP_201_CREATED)
def create_review_endpoint(
    payload: PerformanceReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin, UserRole.hr_manager)),
):
    review = create_review(db, payload, reviewer_id=current_user.id)
    create_audit_log(
        db,
        action="create_performance_review",
        entity_type="performance_review",
        entity_id=review.id,
        actor=current_user,
        details={"employee_id": review.employee_id, "period": review.review_period},
    )
    return success_response("Performance review created", _enrich_review(db, review).model_dump())


@router.get("/reviews")
def list_reviews_endpoint(
    employee_id: int | None = None,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resolved_employee_id = employee_id

    # If regular employee, restrict to own reviews
    if current_user.role == UserRole.employee:
        emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
        resolved_employee_id = emp.id if emp else -1

    items, total = list_reviews(db, employee_id=resolved_employee_id, skip=skip, limit=limit)
    enriched = _batch_enrich_reviews(db, items)
    response = PerformanceReviewListResponse(items=enriched, total=total)
    return success_response("Performance reviews fetched", response.model_dump())


@router.get("/reviews/{review_id}")
def get_review_endpoint(
    review_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    review = get_review(db, review_id)
    return success_response("Performance review fetched", _enrich_review(db, review).model_dump())


@router.put("/reviews/{review_id}")
def update_review_endpoint(
    review_id: int,
    payload: PerformanceReviewUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin, UserRole.hr_manager)),
):
    review = update_review(db, review_id, payload)
    create_audit_log(
        db,
        action="update_performance_review",
        entity_type="performance_review",
        entity_id=review.id,
        actor=current_user,
    )
    return success_response("Performance review updated", _enrich_review(db, review).model_dump())


@router.delete("/reviews/{review_id}")
def delete_review_endpoint(
    review_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin, UserRole.hr_manager)),
):
    delete_review(db, review_id)
    create_audit_log(
        db,
        action="delete_performance_review",
        entity_type="performance_review",
        entity_id=review_id,
        actor=current_user,
    )
    return success_response("Performance review deleted")
