from datetime import date

from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.audit.service import create_audit_log
from app.auth.models import User, UserRole
from app.config import settings
from app.dependencies import get_current_user, get_db, require_roles
from app.employees.models import Employee
from app.employees.service import get_employee
from app.leave.models import LeaveStatus
from app.leave.schemas import AttendancePunchIngestRequest, LeaveRequestCreate, LeaveRequestListResponse, LeaveRequestReview
from app.leave.service import (
    _batch_enrich_leave_requests,
    _enrich_leave_request,
    cancel_leave_request,
    create_leave_request,
    get_leave_request,
    ingest_biometric_punches,
    list_leave_requests,
    review_leave_request,
    summarize_employee_attendance_for_cutoff,
)
from app.utils.responses import success_response

router = APIRouter()


def verify_biometric_api_key(x_biometric_api_key: str | None = Header(default=None)) -> None:
    if not x_biometric_api_key or x_biometric_api_key != settings.biometric_ingest_api_key:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid biometric API key")


@router.get("/health")
def leave_health():
    return success_response("Attendance & leave module ready")


# ── Leave Requests ──

@router.post("/requests", status_code=status.HTTP_201_CREATED)
def create_leave_request_endpoint(
    payload: LeaveRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resolved_employee_id: int

    if payload.employee_id is not None:
        if current_user.role not in (UserRole.admin, UserRole.hr_manager):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

        emp = db.query(Employee).filter(Employee.id == payload.employee_id).first()
        if not emp:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

        resolved_employee_id = emp.id
    else:
        emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
        if not emp:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No employee profile linked to your account")

        resolved_employee_id = emp.id

    lr = create_leave_request(db, resolved_employee_id, payload)
    create_audit_log(
        db,
        action="create_leave_request",
        entity_type="leave_request",
        entity_id=lr.id,
        actor=current_user,
        details={
            "employee_id": resolved_employee_id,
            "leave_type": lr.leave_type.value,
            "start": lr.start_date,
            "end": lr.end_date,
        },
    )
    return success_response("Leave request created", _enrich_leave_request(db, lr).model_dump())


@router.get("/requests")
def list_leave_requests_endpoint(
    employee_id: int | None = None,
    leave_status: LeaveStatus | None = None,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resolved_employee_id = employee_id

    # Regular employees can only see their own leave requests
    if current_user.role == UserRole.employee:
        emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
        resolved_employee_id = emp.id if emp else -1

    items, total = list_leave_requests(
        db, employee_id=resolved_employee_id, leave_status=leave_status, skip=skip, limit=limit,
    )
    enriched = _batch_enrich_leave_requests(db, items)
    response = LeaveRequestListResponse(items=enriched, total=total)
    return success_response("Leave requests fetched", response.model_dump())


@router.put("/requests/{leave_request_id}/review")
def review_leave_request_endpoint(
    leave_request_id: int,
    payload: LeaveRequestReview,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin, UserRole.hr_manager)),
):
    lr = review_leave_request(db, leave_request_id, current_user.id, payload)
    create_audit_log(
        db,
        action="review_leave_request",
        entity_type="leave_request",
        entity_id=lr.id,
        actor=current_user,
        details={"new_status": lr.status.value},
    )
    return success_response("Leave request reviewed", _enrich_leave_request(db, lr).model_dump())


@router.put("/requests/{leave_request_id}/cancel")
def cancel_leave_request_endpoint(
    leave_request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
    if not emp:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No employee profile linked to your account")

    lr = cancel_leave_request(db, leave_request_id, emp.id)
    create_audit_log(
        db,
        action="cancel_leave_request",
        entity_type="leave_request",
        entity_id=lr.id,
        actor=current_user,
    )
    return success_response("Leave request cancelled", _enrich_leave_request(db, lr).model_dump())


# ── Attendance ──

@router.post("/attendance/punches/ingest")
def ingest_attendance_punches_endpoint(
    payload: AttendancePunchIngestRequest,
    db: Session = Depends(get_db),
    _: None = Depends(verify_biometric_api_key),
):
    result = ingest_biometric_punches(db, payload.punches)
    create_audit_log(
        db,
        action="ingest_attendance_punches",
        entity_type="attendance",
        actor_email="biometric_ingest",
        details=result,
    )
    return success_response("Attendance punches ingested successfully", result)


@router.get("/attendance/summary/{employee_id}")
def employee_attendance_summary_endpoint(
    employee_id: int,
    cutoff_start: date,
    cutoff_end: date,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.admin, UserRole.hr_manager)),
):
    employee = get_employee(db, employee_id)
    summary = summarize_employee_attendance_for_cutoff(db, employee, cutoff_start, cutoff_end)
    return success_response("Attendance summary fetched successfully", summary.model_dump())
