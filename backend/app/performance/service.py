from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.auth.models import User
from app.employees.models import Employee
from app.performance.models import PerformanceReview, ReviewStatus
from app.performance.schemas import PerformanceReviewCreate, PerformanceReviewResponse, PerformanceReviewUpdate


def _enrich_review(db: Session, review: PerformanceReview) -> PerformanceReviewResponse:
    employee = db.query(Employee).filter(Employee.id == review.employee_id).first()
    reviewer = db.query(User).filter(User.id == review.reviewer_id).first()
    return PerformanceReviewResponse(
        id=review.id,
        employee_id=review.employee_id,
        employee_name=employee.profile_name if employee else None,
        reviewer_id=review.reviewer_id,
        reviewer_name=reviewer.full_name if reviewer else None,
        review_period=review.review_period,
        cycle=review.cycle,
        status=review.status,
        rating=review.rating,
        strengths=review.strengths,
        improvements=review.improvements,
        goals=review.goals,
        comments=review.comments,
        created_at=review.created_at,
        updated_at=review.updated_at,
    )


def _batch_enrich_reviews(db: Session, reviews: list[PerformanceReview]) -> list[PerformanceReviewResponse]:
    """Batch-load related employees & reviewers to avoid N+1."""
    emp_ids = list({r.employee_id for r in reviews})
    reviewer_ids = list({r.reviewer_id for r in reviews})

    employees_by_id = {
        e.id: e for e in db.query(Employee).filter(Employee.id.in_(emp_ids)).all()
    } if emp_ids else {}
    users_by_id = {
        u.id: u for u in db.query(User).filter(User.id.in_(reviewer_ids)).all()
    } if reviewer_ids else {}

    result = []
    for review in reviews:
        emp = employees_by_id.get(review.employee_id)
        reviewer = users_by_id.get(review.reviewer_id)
        result.append(PerformanceReviewResponse(
            id=review.id,
            employee_id=review.employee_id,
            employee_name=emp.profile_name if emp else None,
            reviewer_id=review.reviewer_id,
            reviewer_name=reviewer.full_name if reviewer else None,
            review_period=review.review_period,
            cycle=review.cycle,
            status=review.status,
            rating=review.rating,
            strengths=review.strengths,
            improvements=review.improvements,
            goals=review.goals,
            comments=review.comments,
            created_at=review.created_at,
            updated_at=review.updated_at,
        ))
    return result


def create_review(db: Session, payload: PerformanceReviewCreate, reviewer_id: int) -> PerformanceReview:
    # Verify employee exists
    employee = db.query(Employee).filter(Employee.id == payload.employee_id).first()
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

    review = PerformanceReview(
        employee_id=payload.employee_id,
        reviewer_id=reviewer_id,
        review_period=payload.review_period,
        cycle=payload.cycle,
        rating=payload.rating,
        strengths=payload.strengths,
        improvements=payload.improvements,
        goals=payload.goals,
        comments=payload.comments,
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review


def list_reviews(
    db: Session,
    *,
    employee_id: int | None = None,
    skip: int = 0,
    limit: int = 50,
) -> tuple[list[PerformanceReview], int]:
    query = db.query(PerformanceReview)
    if employee_id is not None:
        query = query.filter(PerformanceReview.employee_id == employee_id)

    total = query.count()
    items = query.order_by(PerformanceReview.created_at.desc()).offset(skip).limit(limit).all()
    return items, total


def get_review(db: Session, review_id: int) -> PerformanceReview:
    review = db.query(PerformanceReview).filter(PerformanceReview.id == review_id).first()
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Performance review not found")
    return review


def update_review(db: Session, review_id: int, payload: PerformanceReviewUpdate) -> PerformanceReview:
    review = get_review(db, review_id)
    update_data = payload.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(review, key, value)

    db.commit()
    db.refresh(review)
    return review


def delete_review(db: Session, review_id: int) -> None:
    review = get_review(db, review_id)
    db.delete(review)
    db.commit()
