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


def list_employees(db: Session) -> list[Employee]:
    return db.query(Employee).order_by(Employee.id.desc()).all()


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
