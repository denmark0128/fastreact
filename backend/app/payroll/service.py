import re
from datetime import date, timedelta
from decimal import Decimal, ROUND_HALF_UP

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.employees.models import Employee
from app.leave.service import summarize_employee_attendance_for_cutoff
from app.payroll.models import ADDITION_TYPES, DEDUCTION_TYPES, PayrollAdjustmentItem, PayrollRecord
from app.payroll.schemas import AdjustmentItemCreate, AdjustmentItemResponse, PayrollAdjustment, PayrollProcessRequest, PayrollSummaryResponse


TIME_RANGE_PATTERN = re.compile(r"(?P<start>\d{1,2}:\d{2})-(?P<end>\d{1,2}:\d{2})")
STANDARD_HOURS_PER_DAY = Decimal("8")
STANDARD_MONTHLY_WORK_DAYS = Decimal("22")
OVERTIME_MULTIPLIER = Decimal("1.25")


def _to_decimal(value: int | float | Decimal) -> Decimal:
	return Decimal(str(value))


def _to_money(value: Decimal) -> Decimal:
	return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def _minutes_from_hhmm(value: str) -> int:
	hours, minutes = value.split(":")
	return (int(hours) * 60) + int(minutes)


def _extract_schedule_minutes(schedule_value: str | None) -> int:
	if not schedule_value:
		return 0

	match = TIME_RANGE_PATTERN.search(schedule_value)
	if not match:
		return 0

	start_minutes = _minutes_from_hhmm(match.group("start"))
	end_minutes = _minutes_from_hhmm(match.group("end"))
	if end_minutes <= start_minutes:
		return 0

	return end_minutes - start_minutes


def _minute_rate(employee: Employee) -> Decimal:
	# Always derive from rate_amount so that edits to the employee rate are
	# reflected immediately in payroll without relying on the cached hourly_rate field.
	rate_amount = _to_decimal(employee.rate_amount or 0)
	if str(employee.rate_type) == "daily":
		return (rate_amount / STANDARD_HOURS_PER_DAY) / Decimal("60")
	monthly_hourly = rate_amount / (STANDARD_MONTHLY_WORK_DAYS * STANDARD_HOURS_PER_DAY)
	return monthly_hourly / Decimal("60")


def _build_adjustment_map(adjustments: list[PayrollAdjustment]) -> dict[int, PayrollAdjustment]:
	return {item.employee_id: item for item in adjustments}


# ---------------------------------------------------------------------------
# Adjustment item CRUD
# ---------------------------------------------------------------------------

def list_adjustment_items(
	db: Session,
	cutoff_start: date | None = None,
	cutoff_end: date | None = None,
	employee_id: int | None = None,
) -> list[PayrollAdjustmentItem]:
	q = db.query(PayrollAdjustmentItem)
	if cutoff_start:
		q = q.filter(PayrollAdjustmentItem.cutoff_start == cutoff_start)
	if cutoff_end:
		q = q.filter(PayrollAdjustmentItem.cutoff_end == cutoff_end)
	if employee_id:
		q = q.filter(PayrollAdjustmentItem.employee_id == employee_id)
	return q.order_by(PayrollAdjustmentItem.employee_id, PayrollAdjustmentItem.id).all()


def create_adjustment_item(db: Session, data: AdjustmentItemCreate) -> PayrollAdjustmentItem:
	item = PayrollAdjustmentItem(
		employee_id=data.employee_id,
		cutoff_start=data.cutoff_start,
		cutoff_end=data.cutoff_end,
		type=data.type,
		amount=data.amount,
		label=data.label,
		notes=data.notes,
	)
	db.add(item)
	db.commit()
	db.refresh(item)
	return item


def delete_adjustment_item(db: Session, item_id: int) -> bool:
	item = db.query(PayrollAdjustmentItem).filter(PayrollAdjustmentItem.id == item_id).first()
	if not item:
		return False
	db.delete(item)
	db.commit()
	return True


def _item_to_dict(item: PayrollAdjustmentItem) -> dict:
	return {
		"id": item.id,
		"employee_id": item.employee_id,
		"cutoff_start": item.cutoff_start,
		"cutoff_end": item.cutoff_end,
		"type": item.type,
		"amount": float(item.amount),
		"label": item.label,
		"notes": item.notes,
		"created_at": item.created_at,
	}


def _aggregate_stored_items(
	db: Session,
	employee_ids: list[int],
	cutoff_start: date,
	cutoff_end: date,
) -> dict[int, tuple[Decimal, Decimal]]:
	"""Return {employee_id: (total_additions, total_deductions)} from stored items."""
	items = (
		db.query(PayrollAdjustmentItem)
		.filter(
			PayrollAdjustmentItem.employee_id.in_(employee_ids),
			PayrollAdjustmentItem.cutoff_start == cutoff_start,
			PayrollAdjustmentItem.cutoff_end == cutoff_end,
		)
		.all()
	)
	result: dict[int, list[Decimal]] = {}
	for item in items:
		amt = _to_decimal(item.amount)
		if item.employee_id not in result:
			result[item.employee_id] = [Decimal("0"), Decimal("0")]
		if item.type in DEDUCTION_TYPES:
			result[item.employee_id][1] += amt
		elif item.type in ADDITION_TYPES:
			result[item.employee_id][0] += amt
	return {eid: (vals[0], vals[1]) for eid, vals in result.items()}


def process_payroll_cutoff(db: Session, payload: PayrollProcessRequest) -> list[PayrollRecord]:
	base_query = db.query(Employee).filter(Employee.employment_status.in_(["active", "probation"]))
	if payload.employee_ids:
		base_query = base_query.filter(Employee.id.in_(payload.employee_ids))

	employees = base_query.order_by(Employee.id.asc()).all()
	adjustments_by_employee = _build_adjustment_map(payload.adjustments)
	employee_ids = [e.id for e in employees]
	stored_items_by_employee = _aggregate_stored_items(db, employee_ids, payload.cutoff_start, payload.cutoff_end)

	records: list[PayrollRecord] = []
	default_pay_date = payload.pay_date or payload.cutoff_end

	for employee in employees:
		attendance_summary = summarize_employee_attendance_for_cutoff(db, employee, payload.cutoff_start, payload.cutoff_end)
		scheduled_minutes = attendance_summary.scheduled_minutes
		adjustment = adjustments_by_employee.get(employee.id)

		actual_minutes = (
			adjustment.actual_minutes
			if adjustment and adjustment.actual_minutes is not None
			else attendance_summary.actual_minutes
		)
		late_minutes = adjustment.late_minutes if adjustment else attendance_summary.late_minutes
		overtime_minutes = adjustment.overtime_minutes if adjustment else attendance_summary.overtime_minutes
		# Start with any payload-level monetary adjustments (legacy / advanced use)
		allowances = _to_decimal(adjustment.allowances if adjustment else 0)
		other_deductions = _to_decimal(adjustment.other_deductions if adjustment else 0)
		notes = adjustment.notes if adjustment else None
		# Add aggregated stored adjustment items (modal-based)
		stored_additions, stored_deductions = stored_items_by_employee.get(employee.id, (Decimal("0"), Decimal("0")))
		allowances += stored_additions
		other_deductions += stored_deductions

		minute_rate = _minute_rate(employee)
		shortfall_minutes = max(scheduled_minutes - actual_minutes, 0)
		computed_undertime = (
			max(shortfall_minutes - late_minutes, 0)
			if adjustment and adjustment.actual_minutes is not None
			else attendance_summary.undertime_minutes
		)

		derived_overtime = max(actual_minutes - scheduled_minutes, 0)
		computed_overtime = max(overtime_minutes, derived_overtime)

		basic_pay = _to_money(_to_decimal(scheduled_minutes) * minute_rate)
		overtime_pay = _to_money(_to_decimal(computed_overtime) * minute_rate * OVERTIME_MULTIPLIER)
		late_deduction = _to_money(_to_decimal(late_minutes) * minute_rate)
		undertime_deduction = _to_money(_to_decimal(computed_undertime) * minute_rate)
		gross_pay = _to_money(basic_pay + overtime_pay + allowances)
		net_pay = _to_money(gross_pay - late_deduction - undertime_deduction - other_deductions)
		if net_pay < 0:
			net_pay = Decimal("0.00")

		record = (
			db.query(PayrollRecord)
			.filter(
				PayrollRecord.employee_id == employee.id,
				PayrollRecord.cutoff_start == payload.cutoff_start,
				PayrollRecord.cutoff_end == payload.cutoff_end,
			)
			.first()
		)

		if not record:
			record = PayrollRecord(
				employee_id=employee.id,
				cutoff_start=payload.cutoff_start,
				cutoff_end=payload.cutoff_end,
				pay_date=default_pay_date,
			)
			db.add(record)

		record.pay_date = default_pay_date
		record.scheduled_minutes = scheduled_minutes
		record.actual_minutes = actual_minutes
		record.late_minutes = late_minutes
		record.undertime_minutes = computed_undertime
		record.overtime_minutes = computed_overtime
		record.allowances = allowances
		record.other_deductions = other_deductions
		record.basic_pay = basic_pay
		record.overtime_pay = overtime_pay
		record.late_deduction = late_deduction
		record.undertime_deduction = undertime_deduction
		record.gross_pay = gross_pay
		record.net_pay = net_pay
		record.notes = notes

		records.append(record)

	db.commit()
	for record in records:
		db.refresh(record)

	return records


def list_payroll_records(
	db: Session,
	cutoff_start: date | None = None,
	cutoff_end: date | None = None,
	employee_id: int | None = None,
) -> list[PayrollRecord]:
	query = db.query(PayrollRecord)

	# Exact match: only return records for the selected cutoff period.
	# Using >= / <= would return records from multiple overlapping runs.
	if cutoff_start:
		query = query.filter(PayrollRecord.cutoff_start == cutoff_start)
	if cutoff_end:
		query = query.filter(PayrollRecord.cutoff_end == cutoff_end)
	if employee_id:
		query = query.filter(PayrollRecord.employee_id == employee_id)

	return query.order_by(PayrollRecord.cutoff_end.desc(), PayrollRecord.employee_id.asc()).all()


def get_payroll_summary(
	db: Session,
	cutoff_start: date | None = None,
	cutoff_end: date | None = None,
	employee_id: int | None = None,
) -> PayrollSummaryResponse:
	query = db.query(
		func.count(PayrollRecord.id),
		func.coalesce(func.sum(PayrollRecord.gross_pay), 0),
		func.coalesce(func.sum(PayrollRecord.net_pay), 0),
		func.coalesce(func.sum(PayrollRecord.late_minutes), 0),
		func.coalesce(func.sum(PayrollRecord.undertime_minutes), 0),
		func.coalesce(func.sum(PayrollRecord.overtime_minutes), 0),
	)

	if cutoff_start:
		query = query.filter(PayrollRecord.cutoff_start == cutoff_start)
	if cutoff_end:
		query = query.filter(PayrollRecord.cutoff_end == cutoff_end)
	if employee_id:
		query = query.filter(PayrollRecord.employee_id == employee_id)

	record_count, total_gross, total_net, total_late, total_undertime, total_overtime = query.one()

	return PayrollSummaryResponse(
		cutoff_start=cutoff_start,
		cutoff_end=cutoff_end,
		record_count=int(record_count or 0),
		total_gross_pay=float(total_gross or 0),
		total_net_pay=float(total_net or 0),
		total_late_minutes=int(total_late or 0),
		total_undertime_minutes=int(total_undertime or 0),
		total_overtime_minutes=int(total_overtime or 0),
	)
