from pydantic import BaseModel


class DepartmentCreateRequest(BaseModel):
	name: str
	description: str | None = None
	head_employee_id: int | None = None


class DepartmentUpdateRequest(BaseModel):
	name: str | None = None
	description: str | None = None
	head_employee_id: int | None = None


class DepartmentResponse(BaseModel):
	id: int
	name: str
	description: str | None = None
	head_employee_id: int | None = None

	class Config:
		from_attributes = True


class CompanyProfileUpdateRequest(BaseModel):
	company_name: str
	email: str | None = None
	phone: str | None = None
	address: str | None = None
	contact_number: str | None = None
	street: str | None = None
	city: str | None = None
	region: str | None = None
	logo_url: str | None = None


class CompanyProfileResponse(BaseModel):
	id: int
	company_name: str
	email: str | None = None
	phone: str | None = None
	address: str | None = None
	contact_number: str | None = None
	street: str | None = None
	city: str | None = None
	region: str | None = None
	logo_url: str | None = None

	class Config:
		from_attributes = True


class AdminSettingsUpdateRequest(BaseModel):
	late_grace_minutes: int = 5
	minimum_overtime_minutes: int = 30
	undertime_rounding_minutes: int = 15
	payroll_cutoff_mode: str = "semi_monthly"

	employee_self_service_enabled: bool = True
	allow_hr_process_payroll: bool = True
	allow_hr_manage_employees: bool = True
	allow_hr_manage_settings: bool = False

	default_employee_role: str = "employee"
	default_rate_type: str = "monthly"
	default_shift_start: str = "09:00"
	default_shift_end: str = "18:00"
	default_work_days: str = "monday-friday"


class AdminSettingsResponse(BaseModel):
	id: int
	late_grace_minutes: int
	minimum_overtime_minutes: int
	undertime_rounding_minutes: int
	payroll_cutoff_mode: str

	employee_self_service_enabled: bool
	allow_hr_process_payroll: bool
	allow_hr_manage_employees: bool
	allow_hr_manage_settings: bool

	default_employee_role: str
	default_rate_type: str
	default_shift_start: str
	default_shift_end: str
	default_work_days: str
