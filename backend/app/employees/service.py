from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.employees.models import Employee
from app.employees.schemas import EmployeeCreate, EmployeeUpdate


def create_employee(db: Session, payload: EmployeeCreate) -> Employee:
    existing_employee = db.query(Employee).filter(Employee.employee_code == payload.employee_code).first()
    if existing_employee:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Employee code already exists")

    employee = Employee(**payload.model_dump())
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

    for key, value in update_data.items():
        setattr(employee, key, value)

    db.commit()
    db.refresh(employee)
    return employee


def delete_employee(db: Session, employee_id: int) -> None:
    employee = get_employee(db, employee_id)
    db.delete(employee)
    db.commit()
