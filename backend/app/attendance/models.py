from datetime import UTC, datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


def _utcnow() -> datetime:
    return datetime.now(UTC)


class AttendanceRecord(Base):
    __tablename__ = "attendance_records"
    __table_args__ = (UniqueConstraint("employee_id", "date", name="uq_attendance_employee_date"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id"), nullable=False, index=True)
    date: Mapped[str] = mapped_column(String(20), nullable=False, index=True)  # YYYY-MM-DD

    # Before noon (AM)
    am_in: Mapped[str | None] = mapped_column(String(8), nullable=True)   # HH:MM
    am_out: Mapped[str | None] = mapped_column(String(8), nullable=True)  # HH:MM

    # After noon (PM)
    pm_in: Mapped[str | None] = mapped_column(String(8), nullable=True)   # HH:MM
    pm_out: Mapped[str | None] = mapped_column(String(8), nullable=True)  # HH:MM

    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=_utcnow, onupdate=_utcnow)
