import enum

from sqlalchemy import JSON, Enum, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


def default_weekly_schedule() -> dict[str, str | None]:
    return {
        "monday": "09:00-18:00",
        "tuesday": "09:00-18:00",
        "wednesday": "09:00-18:00",
        "thursday": "09:00-18:00",
        "friday": "09:00-18:00",
        "saturday": None,
        "sunday": None,
    }


class EmploymentType(str, enum.Enum):
    regular = "regular"
    trainee = "trainee"
    intern = "intern"
    probationary = "probationary"
    contractual = "contractual"
    part_time = "part_time"


class RateType(str, enum.Enum):
    daily = "daily"
    monthly = "monthly"


class Employee(Base):
    __tablename__ = "employees"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    biometric_id: Mapped[str | None] = mapped_column(String(100), unique=True, nullable=True)
    employee_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    profile_name: Mapped[str] = mapped_column(String(255), nullable=False)
    birth_date: Mapped[str | None] = mapped_column(String(20), nullable=True)
    civil_status: Mapped[str | None] = mapped_column(String(50), nullable=True)
    emergency_contact_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    emergency_contact_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    department: Mapped[str] = mapped_column(String(100), nullable=False)
    position: Mapped[str] = mapped_column(String(100), nullable=False)
    employment_status: Mapped[str] = mapped_column(String(50), nullable=False)
    employment_type: Mapped[EmploymentType] = mapped_column(Enum(EmploymentType), nullable=False, default=EmploymentType.regular)
    rate_type: Mapped[RateType] = mapped_column(Enum(RateType), nullable=False, default=RateType.monthly)
    rate_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    hourly_rate: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    weekly_schedule: Mapped[dict[str, str | None]] = mapped_column(JSON, nullable=False, default=default_weekly_schedule)
