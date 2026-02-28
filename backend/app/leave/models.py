import enum
from datetime import UTC, datetime

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


def _utcnow() -> datetime:
	return datetime.now(UTC)


class LeaveType(str, enum.Enum):
	vacation = "vacation"
	sick = "sick"
	personal = "personal"
	maternity = "maternity"
	paternity = "paternity"
	bereavement = "bereavement"
	unpaid = "unpaid"


class LeaveStatus(str, enum.Enum):
	pending = "pending"
	approved = "approved"
	rejected = "rejected"
	cancelled = "cancelled"


class LeaveRequest(Base):
	__tablename__ = "leave_requests"

	id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
	employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id"), nullable=False, index=True)
	leave_type: Mapped[LeaveType] = mapped_column(Enum(LeaveType), nullable=False)
	start_date: Mapped[str] = mapped_column(String(20), nullable=False)
	end_date: Mapped[str] = mapped_column(String(20), nullable=False)
	reason: Mapped[str | None] = mapped_column(Text, nullable=True)
	status: Mapped[LeaveStatus] = mapped_column(Enum(LeaveStatus), nullable=False, default=LeaveStatus.pending)
	reviewer_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
	review_note: Mapped[str | None] = mapped_column(Text, nullable=True)
	created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=_utcnow)
	updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=_utcnow, onupdate=_utcnow)


class AttendancePunch(Base):
	__tablename__ = "attendance_punches"
	__table_args__ = (UniqueConstraint("punch_key", name="uq_attendance_punch_key"),)

	id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
	employee_id: Mapped[int | None] = mapped_column(ForeignKey("employees.id"), nullable=True, index=True)
	employee_biometric_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
	device_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
	punch_id: Mapped[str | None] = mapped_column(String(120), nullable=True)
	punch_type: Mapped[str | None] = mapped_column(String(20), nullable=True)
	punch_time: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
	source: Mapped[str] = mapped_column(String(30), nullable=False, default="biometric")
	punch_key: Mapped[str] = mapped_column(String(255), nullable=False)
	created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=_utcnow)
