from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.audit.service import create_audit_log
from app.auth.models import User, UserRole
from app.dependencies import get_db, require_roles
from app.settings.schemas import AdminSettingsResponse, AdminSettingsUpdateRequest, CompanyProfileResponse, CompanyProfileUpdateRequest, DepartmentCreateRequest, DepartmentResponse, DepartmentUpdateRequest
from app.settings.service import create_department, delete_department, get_or_create_admin_settings, get_or_create_company_profile, list_departments, update_admin_settings, update_company_profile, update_department
from app.utils.responses import success_response

router = APIRouter()


@router.get("/health")
def settings_health():
    return success_response("Settings module scaffold ready")


@router.get("/departments")
def list_departments_endpoint(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.admin, UserRole.hr_manager, UserRole.employee)),
):
    departments = list_departments(db)
    data = [DepartmentResponse.model_validate(item).model_dump() for item in departments]
    return success_response("Departments fetched successfully", data)


@router.post("/departments", status_code=status.HTTP_201_CREATED)
def create_department_endpoint(
    payload: DepartmentCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin, UserRole.hr_manager)),
):
    department = create_department(db, payload)
    create_audit_log(
        db,
        action="create_department",
        entity_type="department",
        entity_id=department.id,
        actor=current_user,
        details={"name": department.name},
    )
    return success_response(
        "Department created successfully",
        DepartmentResponse.model_validate(department).model_dump(),
    )


@router.delete("/departments/{department_id}")
def delete_department_endpoint(
    department_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin, UserRole.hr_manager)),
):
    delete_department(db, department_id)
    create_audit_log(
        db,
        action="delete_department",
        entity_type="department",
        entity_id=department_id,
        actor=current_user,
    )
    return success_response("Department deleted successfully")


@router.put("/departments/{department_id}")
def update_department_endpoint(
    department_id: int,
    payload: DepartmentUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin, UserRole.hr_manager)),
):
    department = update_department(db, department_id, payload)
    create_audit_log(
        db,
        action="update_department",
        entity_type="department",
        entity_id=department.id,
        actor=current_user,
    )
    return success_response(
        "Department updated successfully",
        DepartmentResponse.model_validate(department).model_dump(),
    )


@router.get("/company-profile")
def get_company_profile_endpoint(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.admin, UserRole.hr_manager, UserRole.employee)),
):
    profile = get_or_create_company_profile(db)
    return success_response(
        "Company profile fetched successfully",
        CompanyProfileResponse.model_validate(profile).model_dump(),
    )


@router.put("/company-profile")
def update_company_profile_endpoint(
    payload: CompanyProfileUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin, UserRole.hr_manager)),
):
    profile = update_company_profile(db, payload)
    create_audit_log(
        db,
        action="update_company_profile",
        entity_type="company_profile",
        entity_id=profile.id,
        actor=current_user,
    )
    return success_response(
        "Company profile updated successfully",
        CompanyProfileResponse.model_validate(profile).model_dump(),
    )


def _admin_settings_payload(settings) -> dict:
    return {
        "id": settings.id,
        "late_grace_minutes": settings.late_grace_minutes,
        "minimum_overtime_minutes": settings.minimum_overtime_minutes,
        "undertime_rounding_minutes": settings.undertime_rounding_minutes,
        "payroll_cutoff_mode": settings.payroll_cutoff_mode,
        "employee_self_service_enabled": bool(settings.employee_self_service_enabled),
        "allow_hr_process_payroll": bool(settings.allow_hr_process_payroll),
        "allow_hr_manage_employees": bool(settings.allow_hr_manage_employees),
        "allow_hr_manage_settings": bool(settings.allow_hr_manage_settings),
        "default_employee_role": settings.default_employee_role,
        "default_rate_type": settings.default_rate_type,
        "default_shift_start": settings.default_shift_start,
        "default_shift_end": settings.default_shift_end,
        "default_work_days": settings.default_work_days,
    }


@router.get("/admin")
def get_admin_settings_endpoint(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.admin, UserRole.hr_manager)),
):
    settings = get_or_create_admin_settings(db)
    return success_response(
        "Admin settings fetched successfully",
        AdminSettingsResponse.model_validate(_admin_settings_payload(settings)).model_dump(),
    )


@router.put("/admin")
def update_admin_settings_endpoint(
    payload: AdminSettingsUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin)),
):
    settings = update_admin_settings(db, payload)
    create_audit_log(
        db,
        action="update_admin_settings",
        entity_type="admin_settings",
        entity_id=settings.id,
        actor=current_user,
    )
    return success_response(
        "Admin settings updated successfully",
        AdminSettingsResponse.model_validate(_admin_settings_payload(settings)).model_dump(),
    )
