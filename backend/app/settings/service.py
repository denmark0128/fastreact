from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.settings.models import AdminSettings, CompanyProfile, Department
from app.settings.schemas import AdminSettingsUpdateRequest, CompanyProfileUpdateRequest, DepartmentCreateRequest, DepartmentUpdateRequest


def list_departments(db: Session) -> list[Department]:
	return db.query(Department).order_by(Department.name.asc()).all()


def create_department(db: Session, payload: DepartmentCreateRequest) -> Department:
	existing = db.query(Department).filter(Department.name == payload.name).first()
	if existing:
		raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Department already exists")

	department = Department(
		name=payload.name,
		description=payload.description,
		head_employee_id=payload.head_employee_id,
	)
	db.add(department)
	db.commit()
	db.refresh(department)
	return department


def update_department(db: Session, department_id: int, payload: DepartmentUpdateRequest) -> Department:
	department = db.query(Department).filter(Department.id == department_id).first()
	if not department:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found")

	if payload.name is not None and payload.name != department.name:
		existing = db.query(Department).filter(Department.name == payload.name).first()
		if existing:
			raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Department already exists")

	update_data = payload.model_dump(exclude_unset=True)
	for key, value in update_data.items():
		setattr(department, key, value)

	db.commit()
	db.refresh(department)
	return department


def delete_department(db: Session, department_id: int) -> None:
	department = db.query(Department).filter(Department.id == department_id).first()
	if not department:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found")
	db.delete(department)
	db.commit()


def get_or_create_company_profile(db: Session) -> CompanyProfile:
	profile = db.query(CompanyProfile).first()
	if profile:
		return profile

	profile = CompanyProfile(company_name="My Company")
	db.add(profile)
	db.commit()
	db.refresh(profile)
	return profile


def update_company_profile(db: Session, payload: CompanyProfileUpdateRequest) -> CompanyProfile:
	profile = get_or_create_company_profile(db)
	profile.company_name = payload.company_name
	profile.email = payload.email
	profile.contact_number = payload.contact_number if payload.contact_number is not None else payload.phone
	profile.street = payload.street
	profile.city = payload.city
	profile.region = payload.region

	combined_address = ", ".join([part for part in [payload.street, payload.city, payload.region] if part])
	profile.phone = payload.phone if payload.phone is not None else payload.contact_number
	profile.address = payload.address if payload.address is not None else (combined_address or None)
	profile.logo_url = payload.logo_url
	db.commit()
	db.refresh(profile)
	return profile


def get_or_create_admin_settings(db: Session) -> AdminSettings:
	settings = db.query(AdminSettings).first()
	if settings:
		return settings

	settings = AdminSettings()
	db.add(settings)
	db.commit()
	db.refresh(settings)
	return settings


def update_admin_settings(db: Session, payload: AdminSettingsUpdateRequest) -> AdminSettings:
	settings = get_or_create_admin_settings(db)

	settings.late_grace_minutes = max(payload.late_grace_minutes, 0)
	settings.minimum_overtime_minutes = max(payload.minimum_overtime_minutes, 0)
	settings.undertime_rounding_minutes = max(payload.undertime_rounding_minutes, 0)
	settings.payroll_cutoff_mode = payload.payroll_cutoff_mode

	settings.employee_self_service_enabled = 1 if payload.employee_self_service_enabled else 0
	settings.allow_hr_process_payroll = 1 if payload.allow_hr_process_payroll else 0
	settings.allow_hr_manage_employees = 1 if payload.allow_hr_manage_employees else 0
	settings.allow_hr_manage_settings = 1 if payload.allow_hr_manage_settings else 0

	settings.default_employee_role = payload.default_employee_role
	settings.default_rate_type = payload.default_rate_type
	settings.default_shift_start = payload.default_shift_start
	settings.default_shift_end = payload.default_shift_end
	settings.default_work_days = payload.default_work_days

	db.commit()
	db.refresh(settings)
	return settings
