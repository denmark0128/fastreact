from datetime import UTC, date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Integer, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


def _utcnow() -> datetime:
	return datetime.now(UTC)


class PayrollRecord(Base):
	__tablename__ = "payroll_records"
	__table_args__ = (
		UniqueConstraint("employee_id", "cutoff_start", "cutoff_end", name="uq_payroll_employee_cutoff"),
	)

	id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
	employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id"), nullable=False, index=True)
	cutoff_start: Mapped[date] = mapped_column(Date, nullable=False, index=True)
	cutoff_end: Mapped[date] = mapped_column(Date, nullable=False, index=True)
	pay_date: Mapped[date] = mapped_column(Date, nullable=False)

	scheduled_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
	actual_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
	late_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
	undertime_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
	overtime_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

	allowances: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0)
	other_deductions: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0)

	basic_pay: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0)
	overtime_pay: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0)
	late_deduction: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0)
	undertime_deduction: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0)
	gross_pay: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0)
	net_pay: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0)

	notes: Mapped[str | None] = mapped_column(String(500), nullable=True)
	created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=_utcnow)
