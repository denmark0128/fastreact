from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.audit.service import create_audit_log
from app.auth.models import User, UserRole
from app.dependencies import get_db, get_current_user, require_roles
from app.employees.models import Employee
from app.payroll.schemas import AdjustmentItemCreate, PayrollProcessRequest
from app.payroll.service import (
	create_adjustment_item,
	delete_adjustment_item,
	get_payroll_summary,
	list_adjustment_items,
	list_payroll_records,
	process_payroll_cutoff,
	_item_to_dict,
)
from app.utils.responses import success_response

router = APIRouter()


def _record_to_dict(record, employee: Employee | None = None) -> dict:
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


def _batch_records_to_response(db: Session, records: list) -> list[dict]:
    """Batch-load employees for all records to avoid N+1 queries."""
    employee_ids = list({r.employee_id for r in records})
    employees_by_id: dict[int, Employee] = {}
    if employee_ids:
        employees_by_id = {
            e.id: e for e in db.query(Employee).filter(Employee.id.in_(employee_ids)).all()
        }
    return [_record_to_dict(r, employees_by_id.get(r.employee_id)) for r in records]


def _resolve_employee_filter_for_current_user(current_user: User, db: Session) -> int | None:
    if current_user.role != UserRole.employee:
        return None

    employee = db.query(Employee).filter(Employee.user_id == current_user.id).first()
    return employee.id if employee else -1


@router.get("/health")
def payroll_health():
    return success_response("Payroll module scaffold ready")


# ---------------------------------------------------------------------------
# Adjustment items (modal-based pre-processing adjustments)
# ---------------------------------------------------------------------------

@router.get("/adjustments")
def list_adjustment_items_endpoint(
    cutoff_start: date = None,
    cutoff_end: date = None,
    employee_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin, UserRole.hr_manager)),
):
    items = list_adjustment_items(db, cutoff_start, cutoff_end, employee_id)
    return success_response("Adjustment items fetched", [_item_to_dict(i) for i in items])


@router.post("/adjustments")
def create_adjustment_item_endpoint(
    data: AdjustmentItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin, UserRole.hr_manager)),
):
    item = create_adjustment_item(db, data)
    create_audit_log(
        db,
        action="create_payroll_adjustment",
        entity_type="payroll_adjustment_item",
        entity_id=str(item.id),
        actor=current_user,
        details={"employee_id": item.employee_id, "type": item.type, "amount": float(item.amount)},
    )
    return success_response("Adjustment item created", _item_to_dict(item))


@router.delete("/adjustments/{item_id}")
def delete_adjustment_item_endpoint(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin, UserRole.hr_manager)),
):
    deleted = delete_adjustment_item(db, item_id)
    if not deleted:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Adjustment item not found")
    create_audit_log(
        db,
        action="delete_payroll_adjustment",
        entity_type="payroll_adjustment_item",
        entity_id=str(item_id),
        actor=current_user,
        details={},
    )
    return success_response("Adjustment item deleted", None)


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
    data = _batch_records_to_response(db, records)
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
    data = _batch_records_to_response(db, records)
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
