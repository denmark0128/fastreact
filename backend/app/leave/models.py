from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


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
	created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
