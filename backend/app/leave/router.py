from datetime import date

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.audit.service import create_audit_log
from app.auth.models import User, UserRole
from app.config import settings
from app.dependencies import get_db, require_roles
from app.employees.service import get_employee
from app.leave.schemas import AttendancePunchIngestRequest
from app.leave.service import ingest_biometric_punches, summarize_employee_attendance_for_cutoff
from app.utils.responses import success_response

router = APIRouter()


def verify_biometric_api_key(x_biometric_api_key: str | None = Header(default=None)) -> None:
    if not x_biometric_api_key or x_biometric_api_key != settings.biometric_ingest_api_key:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid biometric API key")


@router.get("/health")
def leave_health():
    return success_response("Attendance & leave module ready")


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
