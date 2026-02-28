import re
from collections import defaultdict
from datetime import date, datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.employees.models import Employee
from app.leave.models import AttendancePunch, LeaveRequest, LeaveStatus
from app.leave.schemas import (
    AttendanceEmployeeSummaryResponse,
    AttendancePunchIngestItem,
    LeaveRequestCreate,
    LeaveRequestResponse,
    LeaveRequestReview,
)
from app.settings.models import AdminSettings


TIME_RANGE_PATTERN = re.compile(r"(?P<start>\d{1,2}:\d{2})-(?P<end>\d{1,2}:\d{2})")


def _parse_iso_date(date_value: str, field_name: str) -> date:
	try:
		return date.fromisoformat(date_value)
	except ValueError as exc:
		raise HTTPException(
			status_code=status.HTTP_400_BAD_REQUEST,
			detail=f"{field_name} must be in YYYY-MM-DD format",
		) from exc


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


def _get_admin_settings(db: Session) -> AdminSettings:
	settings = db.query(AdminSettings).first()
	if settings:
		return settings
	# Return a transient instance with Python-level defaults
	# (SQLAlchemy column defaults only apply on INSERT)
	return AdminSettings(
		late_grace_minutes=5,
		minimum_overtime_minutes=30,
		undertime_rounding_minutes=15,
		payroll_cutoff_mode="semi_monthly",
		employee_self_service_enabled=1,
		allow_hr_process_payroll=1,
		allow_hr_manage_employees=1,
		allow_hr_manage_settings=0,
		default_employee_role="employee",
		default_rate_type="monthly",
		default_shift_start="09:00",
		default_shift_end="18:00",
		default_work_days="monday-friday",
	)


def summarize_employee_attendance_for_cutoff(
	db: Session,
	employee: Employee,
	cutoff_start: date,
	cutoff_end: date,
) -> AttendanceEmployeeSummaryResponse:
	admin_settings = _get_admin_settings(db)
	late_grace = admin_settings.late_grace_minutes
	min_overtime = admin_settings.minimum_overtime_minutes
	undertime_rounding = admin_settings.undertime_rounding_minutes

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

				# Apply late grace period: ignore lateness within grace window
				raw_late = max(first_punch_minutes - schedule_start, 0)
				late_minutes += raw_late if raw_late > late_grace else 0

				# Apply undertime rounding: round down to nearest multiple
				raw_undertime = max(schedule_end - last_punch_minutes, 0)
				if undertime_rounding > 0:
					raw_undertime = (raw_undertime // undertime_rounding) * undertime_rounding
				undertime_minutes += raw_undertime

				# Apply minimum overtime threshold
				raw_overtime = max(last_punch_minutes - schedule_end, 0)
				overtime_minutes += raw_overtime if raw_overtime >= min_overtime else 0

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


# ── Leave Requests ──

def _enrich_leave_request(db: Session, lr: LeaveRequest) -> LeaveRequestResponse:
	employee = db.query(Employee).filter(Employee.id == lr.employee_id).first()
	return LeaveRequestResponse(
		id=lr.id,
		employee_id=lr.employee_id,
		employee_name=employee.profile_name if employee else None,
		leave_type=lr.leave_type,
		start_date=lr.start_date,
		end_date=lr.end_date,
		reason=lr.reason,
		status=lr.status,
		reviewer_id=lr.reviewer_id,
		review_note=lr.review_note,
		created_at=lr.created_at,
		updated_at=lr.updated_at,
	)


def _batch_enrich_leave_requests(db: Session, requests: list[LeaveRequest]) -> list[LeaveRequestResponse]:
	emp_ids = list({r.employee_id for r in requests})
	employees_by_id: dict[int, Employee] = {}
	if emp_ids:
		employees_by_id = {e.id: e for e in db.query(Employee).filter(Employee.id.in_(emp_ids)).all()}

	return [
		LeaveRequestResponse(
			id=lr.id,
			employee_id=lr.employee_id,
			employee_name=employees_by_id.get(lr.employee_id, None) and employees_by_id[lr.employee_id].profile_name,
			leave_type=lr.leave_type,
			start_date=lr.start_date,
			end_date=lr.end_date,
			reason=lr.reason,
			status=lr.status,
			reviewer_id=lr.reviewer_id,
			review_note=lr.review_note,
			created_at=lr.created_at,
			updated_at=lr.updated_at,
		)
		for lr in requests
	]


def create_leave_request(db: Session, employee_id: int, payload: LeaveRequestCreate) -> LeaveRequest:
	# Verify employee exists
	employee = db.query(Employee).filter(Employee.id == employee_id).first()
	if not employee:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

	start_date = _parse_iso_date(payload.start_date, "start_date")
	end_date = _parse_iso_date(payload.end_date, "end_date")
	if end_date < start_date:
		raise HTTPException(
			status_code=status.HTTP_400_BAD_REQUEST,
			detail="end_date cannot be earlier than start_date",
		)

	lr = LeaveRequest(
		employee_id=employee_id,
		leave_type=payload.leave_type,
		start_date=payload.start_date,
		end_date=payload.end_date,
		reason=payload.reason,
	)
	db.add(lr)
	db.commit()
	db.refresh(lr)
	return lr


def list_leave_requests(
	db: Session,
	*,
	employee_id: int | None = None,
	leave_status: LeaveStatus | None = None,
	skip: int = 0,
	limit: int = 50,
) -> tuple[list[LeaveRequest], int]:
	query = db.query(LeaveRequest)
	if employee_id is not None:
		query = query.filter(LeaveRequest.employee_id == employee_id)
	if leave_status is not None:
		query = query.filter(LeaveRequest.status == leave_status)

	total = query.count()
	items = query.order_by(LeaveRequest.created_at.desc()).offset(skip).limit(limit).all()
	return items, total


def get_leave_request(db: Session, leave_request_id: int) -> LeaveRequest:
	lr = db.query(LeaveRequest).filter(LeaveRequest.id == leave_request_id).first()
	if not lr:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Leave request not found")
	return lr


def review_leave_request(
	db: Session,
	leave_request_id: int,
	reviewer_id: int,
	payload: LeaveRequestReview,
) -> LeaveRequest:
	lr = get_leave_request(db, leave_request_id)
	if lr.status != LeaveStatus.pending:
		raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Leave request has already been reviewed")

	if payload.status not in (LeaveStatus.approved, LeaveStatus.rejected):
		raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Status must be 'approved' or 'rejected'")

	lr.status = payload.status
	lr.reviewer_id = reviewer_id
	lr.review_note = payload.review_note
	db.commit()
	db.refresh(lr)
	return lr


def cancel_leave_request(db: Session, leave_request_id: int, employee_id: int) -> LeaveRequest:
	lr = get_leave_request(db, leave_request_id)
	if lr.employee_id != employee_id:
		raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot cancel another employee's leave request")
	if lr.status not in (LeaveStatus.pending, LeaveStatus.approved):
		raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot cancel this leave request")

	lr.status = LeaveStatus.cancelled
	db.commit()
	db.refresh(lr)
	return lr
