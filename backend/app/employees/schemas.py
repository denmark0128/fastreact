from decimal import Decimal

from pydantic import BaseModel, Field

from app.employees.models import EmploymentType, RateType


class WeeklySchedule(BaseModel):
    monday: str | None = "09:00-18:00"
    tuesday: str | None = "09:00-18:00"
    wednesday: str | None = "09:00-18:00"
    thursday: str | None = "09:00-18:00"
    friday: str | None = "09:00-18:00"
    saturday: str | None = None
    sunday: str | None = None


class EmployeeBase(BaseModel):
    biometric_id: str | None = None
    employee_code: str
    profile_name: str
    birth_date: str | None = None
    civil_status: str | None = None
    emergency_contact_name: str | None = None
    emergency_contact_number: str | None = None
    department: str
    position: str
    employment_status: str = "active"
    employment_type: EmploymentType = EmploymentType.regular
    rate_type: RateType = RateType.monthly
    rate_amount: Decimal = Decimal("0")
    hourly_rate: Decimal = Decimal("0")
    weekly_schedule: WeeklySchedule = Field(default_factory=WeeklySchedule)


class EmployeeCreate(EmployeeBase):
    user_id: int | None = None


class EmployeeUpdate(BaseModel):
    biometric_id: str | None = None
    profile_name: str | None = None
    birth_date: str | None = None
    civil_status: str | None = None
    emergency_contact_name: str | None = None
    emergency_contact_number: str | None = None
    department: str | None = None
    position: str | None = None
    employment_status: str | None = None
    employment_type: EmploymentType | None = None
    rate_type: RateType | None = None
    rate_amount: Decimal | None = None
    hourly_rate: Decimal | None = None
    weekly_schedule: WeeklySchedule | None = None


class EmployeeResponse(EmployeeBase):
    id: int
    user_id: int | None = None
    contact_number: str | None = None
    street: str | None = None
    city: str | None = None
    region: str | None = None

    class Config:
        from_attributes = True
