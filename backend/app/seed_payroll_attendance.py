import re
from datetime import date, timedelta

from sqlalchemy.orm import Session

from app.auth import models as _auth_models  # noqa: F401
from app.attendance.models import AttendanceRecord
from app.database import SessionLocal, ensure_schema_compatibility
from app.employees.models import Employee
from app.seed_employees import SEED_EMPLOYEES, seed_employees


SEED_MONTH_START = date(2026, 3, 1)
SEED_MONTH_END = date(2026, 3, 31)
TIME_RANGE_PATTERN = re.compile(r"(?P<start>\d{1,2}:\d{2})-(?P<end>\d{1,2}:\d{2})")
SCENARIO_CYCLE = ["on_time", "late", "undertime", "overtime", "late_undertime", "late_overtime", "absent"]


def _minutes_from_hhmm(value: str) -> int:
    hours, minutes = value.split(":")
    return (int(hours) * 60) + int(minutes)


def _hhmm_from_minutes(total_minutes: int) -> str:
    bounded = max(total_minutes, 0)
    hours = bounded // 60
    minutes = bounded % 60
    return f"{hours:02d}:{minutes:02d}"


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


def _build_record_from_schedule(
    schedule_start: int,
    schedule_end: int,
    scenario: str,
) -> dict[str, str | None]:
    work_minutes = schedule_end - schedule_start
    lunch_minutes = 60 if work_minutes >= 420 else 30
    paid_minutes = max(work_minutes - lunch_minutes, 120)
    am_minutes = paid_minutes // 2
    pm_minutes = paid_minutes - am_minutes

    late_adjustment = 0
    undertime_adjustment = 0
    overtime_adjustment = 0

    if scenario == "late":
        late_adjustment = 18
    elif scenario == "undertime":
        undertime_adjustment = 45
    elif scenario == "overtime":
        overtime_adjustment = 60
    elif scenario == "late_undertime":
        late_adjustment = 22
        undertime_adjustment = 30
    elif scenario == "late_overtime":
        late_adjustment = 12
        overtime_adjustment = 75

    am_in = schedule_start + late_adjustment
    am_out = am_in + am_minutes
    pm_in = am_out + lunch_minutes
    pm_out = schedule_end - undertime_adjustment + overtime_adjustment
    pm_out = max(pm_out, pm_in + 30)

    return {
        "am_in": _hhmm_from_minutes(am_in),
        "am_out": _hhmm_from_minutes(am_out),
        "pm_in": _hhmm_from_minutes(pm_in),
        "pm_out": _hhmm_from_minutes(pm_out),
        "note": f"Payroll seeder: {scenario.replace('_', ' ')}",
    }


def _iter_days(start_day: date, end_day: date):
    current = start_day
    while current <= end_day:
        yield current
        current += timedelta(days=1)


def _upsert_attendance_record(
    db: Session,
    employee_id: int,
    day: date,
    item: dict[str, str | None],
) -> None:
    day_key = day.isoformat()
    existing = (
        db.query(AttendanceRecord)
        .filter(AttendanceRecord.employee_id == employee_id, AttendanceRecord.date == day_key)
        .first()
    )

    if existing:
        existing.am_in = item["am_in"]
        existing.am_out = item["am_out"]
        existing.pm_in = item["pm_in"]
        existing.pm_out = item["pm_out"]
        existing.note = item["note"]
        return

    db.add(
        AttendanceRecord(
            employee_id=employee_id,
            date=day_key,
            am_in=item["am_in"],
            am_out=item["am_out"],
            pm_in=item["pm_in"],
            pm_out=item["pm_out"],
            note=item["note"],
        )
    )


def _clear_month_attendance(db: Session, employee_ids: list[int], month_start: date, month_end: date) -> None:
    if not employee_ids:
        return

    db.query(AttendanceRecord).filter(
        AttendanceRecord.employee_id.in_(employee_ids),
        AttendanceRecord.date >= month_start.isoformat(),
        AttendanceRecord.date <= month_end.isoformat(),
    ).delete(synchronize_session=False)


def seed_payroll_attendance_scenarios(
    db: Session,
    month_start: date = SEED_MONTH_START,
    month_end: date = SEED_MONTH_END,
) -> None:
    seed_employees(db)

    target_employee_codes = {str(item["employee_code"]) for item in SEED_EMPLOYEES}

    employees = (
        db.query(Employee)
        .filter(Employee.employee_code.in_(target_employee_codes))
        .order_by(Employee.employee_code.asc())
        .all()
    )

    _clear_month_attendance(db, [employee.id for employee in employees], month_start, month_end)

    for employee_index, employee in enumerate(employees):
        weekly_schedule = employee.weekly_schedule or {}
        scheduled_day_index = 0

        for work_day in _iter_days(month_start, month_end):
            weekday_key = work_day.strftime("%A").lower()
            schedule_range = _parse_schedule_range(weekly_schedule.get(weekday_key))
            if not schedule_range:
                continue

            schedule_start, schedule_end = schedule_range
            scenario = SCENARIO_CYCLE[(employee_index + work_day.day + scheduled_day_index) % len(SCENARIO_CYCLE)]
            if scenario == "absent":
                scheduled_day_index += 1
                continue

            record = _build_record_from_schedule(schedule_start, schedule_end, scenario)
            record["note"] = f"Payroll seeder: {scenario.replace('_', ' ')} ({weekday_key} {weekly_schedule.get(weekday_key)})"
            _upsert_attendance_record(db, employee.id, work_day, record)
            scheduled_day_index += 1

    db.commit()


def run() -> None:
    ensure_schema_compatibility()
    db = SessionLocal()
    try:
        seed_payroll_attendance_scenarios(db)
        print(
            f"Seeded payroll attendance scenarios for {SEED_MONTH_START.isoformat()} to {SEED_MONTH_END.isoformat()} "
            "with varying late/undertime/overtime and absences"
        )
    finally:
        db.close()


if __name__ == "__main__":
    run()
