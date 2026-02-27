from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Department(Base):
	__tablename__ = "departments"

	id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
	name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
	description: Mapped[str | None] = mapped_column(String(255), nullable=True)
	head_employee_id: Mapped[int | None] = mapped_column(ForeignKey("employees.id"), nullable=True)


class CompanyProfile(Base):
	__tablename__ = "company_profiles"

	id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
	company_name: Mapped[str] = mapped_column(String(255), nullable=False)
	email: Mapped[str | None] = mapped_column(String(255), nullable=True)
	phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
	address: Mapped[str | None] = mapped_column(String(255), nullable=True)
	contact_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
	street: Mapped[str | None] = mapped_column(String(255), nullable=True)
	city: Mapped[str | None] = mapped_column(String(100), nullable=True)
	region: Mapped[str | None] = mapped_column(String(100), nullable=True)
	logo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)


class AdminSettings(Base):
	__tablename__ = "admin_settings"

	id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

	late_grace_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=5)
	minimum_overtime_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=30)
	undertime_rounding_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=15)
	payroll_cutoff_mode: Mapped[str] = mapped_column(String(30), nullable=False, default="semi_monthly")

	employee_self_service_enabled: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
	allow_hr_process_payroll: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
	allow_hr_manage_employees: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
	allow_hr_manage_settings: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

	default_employee_role: Mapped[str] = mapped_column(String(30), nullable=False, default="employee")
	default_rate_type: Mapped[str] = mapped_column(String(30), nullable=False, default="monthly")
	default_shift_start: Mapped[str] = mapped_column(String(5), nullable=False, default="09:00")
	default_shift_end: Mapped[str] = mapped_column(String(5), nullable=False, default="18:00")
	default_work_days: Mapped[str] = mapped_column(String(50), nullable=False, default="monday-friday")
