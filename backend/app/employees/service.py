from decimal import Decimal, ROUND_HALF_UP

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.employees.models import Employee, RateType
from app.employees.schemas import EmployeeCreate, EmployeeUpdate

STANDARD_HOURS_PER_DAY = Decimal("8")
STANDARD_MONTHLY_WORK_DAYS = Decimal("22")


def _derive_hourly_rate(rate_amount: Decimal, rate_type: RateType | str) -> Decimal:
    """Derive hourly_rate from rate_amount so payroll _minute_rate stays consistent."""
    amount = Decimal(str(rate_amount or 0))
    if str(rate_type) == "daily":
        return (amount / STANDARD_HOURS_PER_DAY).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    # monthly (default)
    return (amount / (STANDARD_MONTHLY_WORK_DAYS * STANDARD_HOURS_PER_DAY)).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    )


def create_employee(db: Session, payload: EmployeeCreate) -> Employee:
    existing_employee = db.query(Employee).filter(Employee.employee_code == payload.employee_code).first()
    if existing_employee:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Employee code already exists")

    data = payload.model_dump()
    # Auto-derive hourly_rate when not explicitly supplied or is zero
    if not data.get("hourly_rate"):
        data["hourly_rate"] = _derive_hourly_rate(data.get("rate_amount", 0), data.get("rate_type", "monthly"))

    employee = Employee(**data)
    db.add(employee)
    db.commit()
    db.refresh(employee)
    return employee


def list_employees(
    db: Session,
    *,
    skip: int = 0,
    limit: int = 50,
    search: str | None = None,
    department: str | None = None,
    employment_status: str | None = None,
) -> tuple[list[Employee], int]:
    query = db.query(Employee)

    if search:
        term = f"%{search}%"
        query = query.filter(
            (Employee.profile_name.ilike(term)) | (Employee.employee_code.ilike(term))
        )
    if department:
        query = query.filter(Employee.department == department)
    if employment_status:
        query = query.filter(Employee.employment_status == employment_status)

    total = query.count()
    items = query.order_by(Employee.id.desc()).offset(skip).limit(limit).all()
    return items, total


def get_employee(db: Session, employee_id: int) -> Employee:
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    return employee


def update_employee(db: Session, employee_id: int, payload: EmployeeUpdate) -> Employee:
    employee = get_employee(db, employee_id)
    update_data = payload.model_dump(exclude_unset=True)

    rate_amount_changed = "rate_amount" in update_data
    rate_type_changed = "rate_type" in update_data
    hourly_rate_explicit = "hourly_rate" in update_data

    for key, value in update_data.items():
        setattr(employee, key, value)

    # When rate_amount or rate_type was edited without an explicit new hourly_rate,
    # recalculate hourly_rate so payroll picks up the change immediately.
    if (rate_amount_changed or rate_type_changed) and not hourly_rate_explicit:
        employee.hourly_rate = _derive_hourly_rate(
            update_data.get("rate_amount", employee.rate_amount),
            update_data.get("rate_type", employee.rate_type),
        )

    db.commit()
    db.refresh(employee)
    return employee


def delete_employee(db: Session, employee_id: int) -> None:
    employee = get_employee(db, employee_id)
    db.delete(employee)
    db.commit()
