"""
Seed script: EMP-PERF1 — perfect-attendance payroll verification employee.

Employee setup
--------------
  employee_code : EMP-PERF1
  profile_name  : Alex Payroll Test
  department    : Engineering
  position      : Payroll Tester
  employment_type: regular
  rate_type      : monthly
  rate_amount    : 26_400   (₱ 26,400.00 / month)
  hourly_rate    : 150      (= 26,400 / (22 days × 8 hrs) exactly)
  schedule       : Mon–Fri  08:00–16:00  (exactly 8 hrs = 480 min/day)

Perfect-attendance record per work day
---------------------------------------
  am_in  = "08:00"   (on time, = schedule start)
  am_out = "12:00"   (4 hrs AM)
  pm_in  = "12:00"   (no gap = no lunch deduction in the actual-minutes calc)
  pm_out = "16:00"   (on time, = schedule end)

  day_actual_minutes = (am_out − am_in) + (pm_out − pm_in)
                     = 240 + 240 = 480 min  ← equals scheduled_minutes ✓
  late_minutes       = 0   ← first_in == schedule_start
  undertime_minutes  = 0   ← last_out == schedule_end
  overtime_minutes   = 0   ← last_out == schedule_end

Expected payroll for March 2026 (22 Mon–Fri work days)
-------------------------------------------------------
  Full month  (03-01 → 03-31):  22 days × 480 min × ₱2.50/min = ₱26,400.00
  First half  (03-01 → 03-15):  10 days × 480 min × ₱2.50/min = ₱12,000.00
  Second half (03-16 → 03-31):  12 days × 480 min × ₱2.50/min = ₱14,400.00
"""

from datetime import date, timedelta

from sqlalchemy.orm import Session

from app.auth import models as _auth_models  # noqa: F401
from app.attendance.models import AttendanceRecord
from app.database import SessionLocal, ensure_schema_compatibility
from app.employees.models import Employee, EmploymentType, RateType
from app.settings.models import Department


PERF_EMPLOYEE_CODE = "EMP-PERF1"
SEED_MONTH_START = date(2026, 3, 1)
SEED_MONTH_END = date(2026, 3, 31)

PERFECT_AM_IN = "08:00"
PERFECT_AM_OUT = "12:00"
PERFECT_PM_IN = "12:00"
PERFECT_PM_OUT = "16:00"


def _ensure_department(db: Session, name: str) -> Department:
    dept = db.query(Department).filter(Department.name == name).first()
    if not dept:
        dept = Department(name=name, description=f"{name} department")
        db.add(dept)
        db.flush()
    return dept


def _upsert_employee(db: Session) -> Employee:
    existing = db.query(Employee).filter(Employee.employee_code == PERF_EMPLOYEE_CODE).first()
    if existing:
        existing.profile_name = "Alex Payroll Test"
        existing.department = "Engineering"
        existing.position = "Payroll Tester"
        existing.employment_status = "active"
        existing.employment_type = EmploymentType.regular
        existing.rate_type = RateType.monthly
        existing.rate_amount = 26_400
        existing.hourly_rate = 150
        existing.weekly_schedule = {
            "monday": "08:00-16:00",
            "tuesday": "08:00-16:00",
            "wednesday": "08:00-16:00",
            "thursday": "08:00-16:00",
            "friday": "08:00-16:00",
            "saturday": None,
            "sunday": None,
        }
        return existing

    employee = Employee(
        employee_code=PERF_EMPLOYEE_CODE,
        profile_name="Alex Payroll Test",
        department="Engineering",
        position="Payroll Tester",
        employment_status="active",
        employment_type=EmploymentType.regular,
        rate_type=RateType.monthly,
        rate_amount=26_400,
        hourly_rate=150,
        weekly_schedule={
            "monday": "08:00-16:00",
            "tuesday": "08:00-16:00",
            "wednesday": "08:00-16:00",
            "thursday": "08:00-16:00",
            "friday": "08:00-16:00",
            "saturday": None,
            "sunday": None,
        },
    )
    db.add(employee)
    db.flush()
    return employee


def _upsert_attendance(db: Session, employee_id: int, day: date) -> None:
    day_key = day.isoformat()
    existing = (
        db.query(AttendanceRecord)
        .filter(AttendanceRecord.employee_id == employee_id, AttendanceRecord.date == day_key)
        .first()
    )

    note = (
        f"Perfect attendance seed: {day.strftime('%A')} "
        f"{PERFECT_AM_IN}-{PERFECT_AM_OUT} / {PERFECT_PM_IN}-{PERFECT_PM_OUT}"
    )

    if existing:
        existing.am_in = PERFECT_AM_IN
        existing.am_out = PERFECT_AM_OUT
        existing.pm_in = PERFECT_PM_IN
        existing.pm_out = PERFECT_PM_OUT
        existing.note = note
        return

    db.add(
        AttendanceRecord(
            employee_id=employee_id,
            date=day_key,
            am_in=PERFECT_AM_IN,
            am_out=PERFECT_AM_OUT,
            pm_in=PERFECT_PM_IN,
            pm_out=PERFECT_PM_OUT,
            note=note,
        )
    )


def seed_perfect_attendance(
    db: Session,
    month_start: date = SEED_MONTH_START,
    month_end: date = SEED_MONTH_END,
) -> None:
    _ensure_department(db, "Engineering")
    employee = _upsert_employee(db)
    db.flush()

    # Clear any existing records for the month so this is idempotent
    db.query(AttendanceRecord).filter(
        AttendanceRecord.employee_id == employee.id,
        AttendanceRecord.date >= month_start.isoformat(),
        AttendanceRecord.date <= month_end.isoformat(),
    ).delete(synchronize_session=False)
    db.flush()

    work_days: list[date] = []
    current = month_start
    while current <= month_end:
        weekday = current.strftime("%A").lower()
        if weekday in {"monday", "tuesday", "wednesday", "thursday", "friday"}:
            _upsert_attendance(db, employee.id, current)
            work_days.append(current)
        current += timedelta(days=1)

    db.commit()

    # ── verification printout ──────────────────────────────────────────────
    print(f"\nPerfect-attendance seed complete for {PERF_EMPLOYEE_CODE} ({employee.profile_name})")
    print(f"  Period     : {month_start.isoformat()} → {month_end.isoformat()}")
    print(f"  Work days  : {len(work_days)}")
    print(f"  Schedule   : Mon–Fri 08:00–16:00  (480 min/day)")
    print(f"  Rate       : ₱{employee.rate_amount:,}/month  |  ₱{employee.hourly_rate}/hr  |  ₱2.50/min")
    print()
    print("  Expected payroll (basic pay = scheduled_min × minute_rate, zero deductions):")
    print(f"    Full month  (03-01 → 03-31): {len(work_days)} days × 480 × ₱2.50 = "
          f"₱{len(work_days) * 480 * 2.50:,.2f}")
    first_half = [d for d in work_days if d <= date(month_start.year, month_start.month, 15)]
    second_half = [d for d in work_days if d > date(month_start.year, month_start.month, 15)]
    print(f"    First half  (03-01 → 03-15): {len(first_half)} days × 480 × ₱2.50 = "
          f"₱{len(first_half) * 480 * 2.50:,.2f}")
    print(f"    Second half (03-16 → 03-31): {len(second_half)} days × 480 × ₱2.50 = "
          f"₱{len(second_half) * 480 * 2.50:,.2f}")


def run() -> None:
    ensure_schema_compatibility()
    db = SessionLocal()
    try:
        seed_perfect_attendance(db)
    finally:
        db.close()


if __name__ == "__main__":
    run()
