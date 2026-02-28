from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.audit.service import create_audit_log
from app.auth.models import User, UserRole
from app.dependencies import get_db, require_roles
from app.employees.schemas import EmployeeCreate, EmployeeResponse, EmployeeUpdate
from app.employees.service import create_employee, delete_employee, get_employee, list_employees, update_employee
from app.utils.responses import success_response


router = APIRouter()


def _merge_user_profile_fields(employee_payload: dict, user: User | None) -> dict:
    employee_payload["contact_number"] = user.contact_number if user else None
    employee_payload["street"] = user.street if user else None
    employee_payload["city"] = user.city if user else None
    employee_payload["region"] = user.region if user else None
    return employee_payload


def _employee_payload_with_user(db: Session, employee) -> dict:
    payload = EmployeeResponse.model_validate(employee).model_dump()
    linked_user = db.query(User).filter(User.id == employee.user_id).first() if employee.user_id else None
    return _merge_user_profile_fields(payload, linked_user)


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_employee_endpoint(
    payload: EmployeeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin, UserRole.hr_manager)),
):
    employee = create_employee(db, payload)
    create_audit_log(
        db,
        action="create_employee",
        entity_type="employee",
        entity_id=employee.id,
        actor=current_user,
        details={"employee_code": employee.employee_code},
    )
    return success_response("Employee created successfully", _employee_payload_with_user(db, employee))


@router.get("/")
def list_employees_endpoint(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    search: str | None = None,
    department: str | None = None,
    employment_status: str | None = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.admin, UserRole.hr_manager, UserRole.employee)),
):
    employees, total = list_employees(
        db, skip=skip, limit=limit, search=search,
        department=department, employment_status=employment_status,
    )
    user_ids = [item.user_id for item in employees if item.user_id is not None]
    users_by_id = {
        item.id: item
        for item in db.query(User).filter(User.id.in_(user_ids)).all()
    } if user_ids else {}

    data = [
        _merge_user_profile_fields(
            EmployeeResponse.model_validate(item).model_dump(),
            users_by_id.get(item.user_id),
        )
        for item in employees
    ]
    return success_response("Employees fetched successfully", {"items": data, "total": total})


@router.get("/{employee_id}")
def get_employee_endpoint(
    employee_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.admin, UserRole.hr_manager, UserRole.employee)),
):
    employee = get_employee(db, employee_id)
    return success_response("Employee fetched successfully", _employee_payload_with_user(db, employee))


@router.put("/{employee_id}")
def update_employee_endpoint(
    employee_id: int,
    payload: EmployeeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin, UserRole.hr_manager)),
):
    employee = update_employee(db, employee_id, payload)
    create_audit_log(
        db,
        action="update_employee",
        entity_type="employee",
        entity_id=employee.id,
        actor=current_user,
    )
    return success_response("Employee updated successfully", _employee_payload_with_user(db, employee))


@router.delete("/{employee_id}", status_code=status.HTTP_200_OK)
def delete_employee_endpoint(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin, UserRole.hr_manager)),
):
    target_employee = get_employee(db, employee_id)
    delete_employee(db, employee_id)
    create_audit_log(
        db,
        action="delete_employee",
        entity_type="employee",
        entity_id=employee_id,
        actor=current_user,
        details={"employee_code": target_employee.employee_code},
    )
    return success_response("Employee deleted successfully")
