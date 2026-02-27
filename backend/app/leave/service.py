import re
from collections import defaultdict
from datetime import date, datetime, timedelta

from sqlalchemy.orm import Session

from app.employees.models import Employee
from app.leave.models import AttendancePunch
from app.leave.schemas import AttendanceEmployeeSummaryResponse, AttendancePunchIngestItem


TIME_RANGE_PATTERN = re.compile(r"(?P<start>\d{1,2}:\d{2})-(?P<end>\d{1,2}:\d{2})")


def _minutes_from_hhmm(value: str) -> int:
	hours, minutes = value.split(":")
	return (int(hours) * 60) + int(minutes)


def _parse_schedule_range(schedule_value: str | None) -> tuple[int, int] | None:
	if not schedule_value:
		return None

	match = TIME_RANGE_PATTERN.search(schedule_value)
	if not match:
		return None

	start_minutes = _minutes_from_hhmm(match.group("start"))
	end_minutes = _minutes_from_hhmm(match.group("end"))
	if end_minutes <= start_minutes:
		return None

	return start_minutes, end_minutes


def _to_day_minutes(dt: datetime) -> int:
	return (dt.hour * 60) + dt.minute


def ingest_biometric_punches(db: Session, punches: list[AttendancePunchIngestItem]) -> dict[str, int]:
	ingested_count = 0
	duplicate_count = 0
	unresolved_count = 0

	biometric_ids = {item.employee_biometric_id for item in punches}
	employees = db.query(Employee).filter(Employee.biometric_id.in_(biometric_ids)).all() if biometric_ids else []
	employees_by_biometric_id = {
		employee.biometric_id: employee
		for employee in employees
		if employee.biometric_id
	}

	for item in punches:
		employee = employees_by_biometric_id.get(item.employee_biometric_id)
		if not employee:
			unresolved_count += 1

		punch_key = f"{item.device_id}|{item.employee_biometric_id}|{item.punch_time.isoformat()}|{(item.punch_type or '').lower()}"
		existing = db.query(AttendancePunch).filter(AttendancePunch.punch_key == punch_key).first()
		if existing:
			duplicate_count += 1
			continue

		punch = AttendancePunch(
			employee_id=employee.id if employee else None,
			employee_biometric_id=item.employee_biometric_id,
			device_id=item.device_id,
			punch_id=item.punch_id,
			punch_type=item.punch_type,
			punch_time=item.punch_time,
			source="biometric",
			punch_key=punch_key,
		)
		db.add(punch)
		ingested_count += 1

	db.commit()

	return {
		"received_count": len(punches),
		"ingested_count": ingested_count,
		"duplicate_count": duplicate_count,
		"unresolved_count": unresolved_count,
	}


def summarize_employee_attendance_for_cutoff(
	db: Session,
	employee: Employee,
	cutoff_start: date,
	cutoff_end: date,
) -> AttendanceEmployeeSummaryResponse:
	start_dt = datetime.combine(cutoff_start, datetime.min.time())
	end_dt = datetime.combine(cutoff_end + timedelta(days=1), datetime.min.time())

	punches = (
		db.query(AttendancePunch)
		.filter(
			AttendancePunch.employee_id == employee.id,
			AttendancePunch.punch_time >= start_dt,
			AttendancePunch.punch_time < end_dt,
		)
		.order_by(AttendancePunch.punch_time.asc())
		.all()
	)

	punches_by_day: dict[date, list[AttendancePunch]] = defaultdict(list)
	for punch in punches:
		punches_by_day[punch.punch_time.date()].append(punch)

	weekly_schedule = employee.weekly_schedule or {}
	scheduled_minutes = 0
	actual_minutes = 0
	late_minutes = 0
	undertime_minutes = 0
	overtime_minutes = 0

	current_day = cutoff_start
	while current_day <= cutoff_end:
		day_key = current_day.strftime("%A").lower()
		schedule_range = _parse_schedule_range(weekly_schedule.get(day_key))
		day_punches = punches_by_day.get(current_day, [])

		if schedule_range:
			schedule_start, schedule_end = schedule_range
			day_scheduled_minutes = schedule_end - schedule_start
			scheduled_minutes += day_scheduled_minutes

			if day_punches:
				first_punch_minutes = _to_day_minutes(day_punches[0].punch_time)
				last_punch_minutes = _to_day_minutes(day_punches[-1].punch_time)
				if last_punch_minutes > first_punch_minutes:
					day_actual_minutes = last_punch_minutes - first_punch_minutes
					actual_minutes += day_actual_minutes

				late_minutes += max(first_punch_minutes - schedule_start, 0)
				undertime_minutes += max(schedule_end - last_punch_minutes, 0)
				overtime_minutes += max(last_punch_minutes - schedule_end, 0)

		current_day += timedelta(days=1)

	return AttendanceEmployeeSummaryResponse(
		employee_id=employee.id,
		cutoff_start=cutoff_start,
		cutoff_end=cutoff_end,
		scheduled_minutes=scheduled_minutes,
		actual_minutes=actual_minutes,
		late_minutes=late_minutes,
		undertime_minutes=undertime_minutes,
		overtime_minutes=overtime_minutes,
	)
