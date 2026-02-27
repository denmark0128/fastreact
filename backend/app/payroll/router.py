from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.audit.service import create_audit_log
from app.auth.models import User, UserRole
from app.dependencies import get_db, get_current_user, require_roles
from app.employees.models import Employee
from app.payroll.schemas import PayrollProcessRequest
from app.payroll.service import get_payroll_summary, list_payroll_records, process_payroll_cutoff
from app.utils.responses import success_response

router = APIRouter()


def _record_to_response(db: Session, record) -> dict:
    employee = db.query(Employee).filter(Employee.id == record.employee_id).first()
    return {
        "id": record.id,
        "employee_id": record.employee_id,
        "employee_code": employee.employee_code if employee else "-",
        "profile_name": employee.profile_name if employee else "Unknown Employee",
        "cutoff_start": record.cutoff_start,
        "cutoff_end": record.cutoff_end,
        "pay_date": record.pay_date,
        "scheduled_minutes": record.scheduled_minutes,
        "actual_minutes": record.actual_minutes,
        "late_minutes": record.late_minutes,
        "undertime_minutes": record.undertime_minutes,
        "overtime_minutes": record.overtime_minutes,
        "allowances": float(record.allowances),
        "other_deductions": float(record.other_deductions),
        "basic_pay": float(record.basic_pay),
        "overtime_pay": float(record.overtime_pay),
        "late_deduction": float(record.late_deduction),
        "undertime_deduction": float(record.undertime_deduction),
        "gross_pay": float(record.gross_pay),
        "net_pay": float(record.net_pay),
        "notes": record.notes,
    }


def _resolve_employee_filter_for_current_user(current_user: User, db: Session) -> int | None:
    if current_user.role != UserRole.employee:
        return None

    employee = db.query(Employee).filter(Employee.user_id == current_user.id).first()
    return employee.id if employee else -1


@router.get("/health")
def payroll_health():
    return success_response("Payroll module scaffold ready")


@router.post("/process")
def process_payroll_endpoint(
    payload: PayrollProcessRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin, UserRole.hr_manager)),
):
    records = process_payroll_cutoff(db, payload)
    create_audit_log(
        db,
        action="process_payroll",
        entity_type="payroll_cutoff",
        actor=current_user,
        details={
            "cutoff_start": payload.cutoff_start.isoformat(),
            "cutoff_end": payload.cutoff_end.isoformat(),
            "record_count": len(records),
        },
    )
    data = [_record_to_response(db, record) for record in records]
    return success_response("Payroll processed successfully", data)


@router.get("/records")
def list_payroll_records_endpoint(
    cutoff_start: date | None = None,
    cutoff_end: date | None = None,
    employee_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in {UserRole.admin, UserRole.hr_manager, UserRole.employee}:
        return success_response("Payroll records fetched successfully", [])

    resolved_employee_filter = employee_id
    self_employee_id = _resolve_employee_filter_for_current_user(current_user, db)
    if self_employee_id is not None:
        resolved_employee_filter = self_employee_id

    records = list_payroll_records(
        db,
        cutoff_start=cutoff_start,
        cutoff_end=cutoff_end,
        employee_id=resolved_employee_filter,
    )
    data = [_record_to_response(db, record) for record in records]
    return success_response("Payroll records fetched successfully", data)


@router.get("/summary")
def payroll_summary_endpoint(
    cutoff_start: date | None = None,
    cutoff_end: date | None = None,
    employee_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in {UserRole.admin, UserRole.hr_manager, UserRole.employee}:
        return success_response("Payroll summary fetched successfully", None)

    resolved_employee_filter = employee_id
    self_employee_id = _resolve_employee_filter_for_current_user(current_user, db)
    if self_employee_id is not None:
        resolved_employee_filter = self_employee_id

    summary = get_payroll_summary(
        db,
        cutoff_start=cutoff_start,
        cutoff_end=cutoff_end,
        employee_id=resolved_employee_filter,
    )
    return success_response("Payroll summary fetched successfully", summary.model_dump())
