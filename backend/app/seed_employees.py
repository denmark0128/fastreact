from sqlalchemy.orm import Session

from app.auth import models as _auth_models  # noqa: F401
from app.database import SessionLocal, ensure_schema_compatibility
from app.employees.models import Employee, EmploymentType, RateType, default_weekly_schedule
from app.settings.models import Department


SEED_EMPLOYEES = [
    {
        "employee_code": "EMP-1001",
        "profile_name": "Maria Santos",
        "department": "Engineering",
        "position": "Engineering Manager",
        "employment_status": "active",
        "employment_type": EmploymentType.regular,
        "rate_type": RateType.monthly,
        "rate_amount": 95000,
        "hourly_rate": 540,
        "weekly_schedule": {
            "monday": "09:00-18:00",
            "tuesday": "09:00-18:00",
            "wednesday": "09:00-18:00",
            "thursday": "09:00-18:00",
            "friday": "09:00-17:00",
            "saturday": None,
            "sunday": None,
        },
        "is_department_head": True,
    },
    {
        "employee_code": "EMP-1002",
        "profile_name": "Juan Dela Cruz",
        "department": "HR",
        "position": "HR Manager",
        "employment_status": "active",
        "employment_type": EmploymentType.regular,
        "rate_type": RateType.monthly,
        "rate_amount": 78000,
        "hourly_rate": 443,
        "weekly_schedule": default_weekly_schedule(),
        "is_department_head": True,
    },
    {
        "employee_code": "EMP-1003",
        "profile_name": "Angela Reyes",
        "department": "Finance",
        "position": "Finance Lead",
        "employment_status": "active",
        "employment_type": EmploymentType.regular,
        "rate_type": RateType.monthly,
        "rate_amount": 82000,
        "hourly_rate": 466,
        "weekly_schedule": default_weekly_schedule(),
        "is_department_head": True,
    },
    {
        "employee_code": "EMP-1004",
        "profile_name": "Carlo Mendoza",
        "department": "Operations",
        "position": "Operations Supervisor",
        "employment_status": "active",
        "employment_type": EmploymentType.regular,
        "rate_type": RateType.monthly,
        "rate_amount": 62000,
        "hourly_rate": 352,
        "weekly_schedule": {
            "monday": "08:00-17:00",
            "tuesday": "08:00-17:00",
            "wednesday": "08:00-17:00",
            "thursday": "08:00-17:00",
            "friday": "08:00-17:00",
            "saturday": None,
            "sunday": None,
        },
        "is_department_head": True,
    },
    {
        "employee_code": "EMP-1005",
        "profile_name": "Bea Villanueva",
        "department": "Engineering",
        "position": "Software Engineer",
        "employment_status": "active",
        "employment_type": EmploymentType.regular,
        "rate_type": RateType.monthly,
        "rate_amount": 48000,
        "hourly_rate": 273,
        "weekly_schedule": default_weekly_schedule(),
        "is_department_head": False,
    },
    {
        "employee_code": "EMP-1006",
        "profile_name": "Mark Bautista",
        "department": "Engineering",
        "position": "QA Engineer",
        "employment_status": "active",
        "employment_type": EmploymentType.probationary,
        "rate_type": RateType.monthly,
        "rate_amount": 36000,
        "hourly_rate": 205,
        "weekly_schedule": default_weekly_schedule(),
        "is_department_head": False,
    },
    {
        "employee_code": "EMP-1007",
        "profile_name": "Pauline Garcia",
        "department": "HR",
        "position": "Recruiter",
        "employment_status": "active",
        "employment_type": EmploymentType.regular,
        "rate_type": RateType.monthly,
        "rate_amount": 34000,
        "hourly_rate": 193,
        "weekly_schedule": default_weekly_schedule(),
        "is_department_head": False,
    },
    {
        "employee_code": "EMP-1008",
        "profile_name": "Kevin Navarro",
        "department": "HR",
        "position": "HR Intern",
        "employment_status": "active",
        "employment_type": EmploymentType.intern,
        "rate_type": RateType.daily,
        "rate_amount": 700,
        "hourly_rate": 88,
        "weekly_schedule": {
            "monday": "10:00-16:00",
            "tuesday": "10:00-16:00",
            "wednesday": "10:00-16:00",
            "thursday": "10:00-16:00",
            "friday": "10:00-14:00",
            "saturday": None,
            "sunday": None,
        },
        "is_department_head": False,
    },
    {
        "employee_code": "EMP-1009",
        "profile_name": "Rica Flores",
        "department": "Finance",
        "position": "Payroll Associate",
        "employment_status": "active",
        "employment_type": EmploymentType.regular,
        "rate_type": RateType.monthly,
        "rate_amount": 33000,
        "hourly_rate": 188,
        "weekly_schedule": default_weekly_schedule(),
        "is_department_head": False,
    },
    {
        "employee_code": "EMP-1010",
        "profile_name": "Joshua Aquino",
        "department": "Operations",
        "position": "Support Specialist",
        "employment_status": "active",
        "employment_type": EmploymentType.contractual,
        "rate_type": RateType.daily,
        "rate_amount": 900,
        "hourly_rate": 113,
        "weekly_schedule": {
            "monday": "09:00-18:00",
            "tuesday": "09:00-18:00",
            "wednesday": "09:00-18:00",
            "thursday": "09:00-18:00",
            "friday": "09:00-18:00",
            "saturday": "09:00-13:00",
            "sunday": None,
        },
        "is_department_head": False,
    },
    {
        "employee_code": "EMP-1011",
        "profile_name": "Tricia Domingo",
        "department": "Engineering",
        "position": "UI/UX Designer",
        "employment_status": "active",
        "employment_type": EmploymentType.regular,
        "rate_type": RateType.monthly,
        "rate_amount": 42000,
        "hourly_rate": 239,
        "weekly_schedule": {
            "monday": None,
            "tuesday": "09:00-18:00",
            "wednesday": "09:00-18:00",
            "thursday": "09:00-18:00",
            "friday": "09:00-18:00",
            "saturday": None,
            "sunday": None,
        },
        "is_department_head": False,
    },
    {
        "employee_code": "EMP-1012",
        "profile_name": "Noel Ramirez",
        "department": "Engineering",
        "position": "Backend Developer",
        "employment_status": "active",
        "employment_type": EmploymentType.regular,
        "rate_type": RateType.monthly,
        "rate_amount": 51000,
        "hourly_rate": 290,
        "weekly_schedule": {
            "monday": "WFH 09:00-18:00",
            "tuesday": "WFH 09:00-18:00",
            "wednesday": "09:00-18:00",
            "thursday": "09:00-18:00",
            "friday": "WFH 09:00-18:00",
            "saturday": None,
            "sunday": None,
        },
        "is_department_head": False,
    },
    {
        "employee_code": "EMP-1013",
        "profile_name": "Liza Manalo",
        "department": "HR",
        "position": "HR Associate",
        "employment_status": "vacation_leave",
        "employment_type": EmploymentType.regular,
        "rate_type": RateType.monthly,
        "rate_amount": 32000,
        "hourly_rate": 182,
        "weekly_schedule": {
            "monday": None,
            "tuesday": None,
            "wednesday": None,
            "thursday": None,
            "friday": None,
            "saturday": None,
            "sunday": None,
        },
        "is_department_head": False,
    },
    {
        "employee_code": "EMP-1014",
        "profile_name": "Gerald Pineda",
        "department": "Finance",
        "position": "Accountant",
        "employment_status": "active",
        "employment_type": EmploymentType.regular,
        "rate_type": RateType.monthly,
        "rate_amount": 39000,
        "hourly_rate": 222,
        "weekly_schedule": {
            "monday": "09:00-18:00",
            "tuesday": "09:00-18:00",
            "wednesday": None,
            "thursday": "09:00-18:00",
            "friday": "09:00-18:00",
            "saturday": None,
            "sunday": None,
        },
        "is_department_head": False,
    },
    {
        "employee_code": "EMP-1015",
        "profile_name": "Shane Tolentino",
        "department": "Operations",
        "position": "Operations Analyst",
        "employment_status": "sick_leave",
        "employment_type": EmploymentType.regular,
        "rate_type": RateType.monthly,
        "rate_amount": 36000,
        "hourly_rate": 205,
        "weekly_schedule": {
            "monday": None,
            "tuesday": None,
            "wednesday": None,
            "thursday": "09:00-18:00",
            "friday": "09:00-18:00",
            "saturday": None,
            "sunday": None,
        },
        "is_department_head": False,
    },
    {
        "employee_code": "EMP-1016",
        "profile_name": "Camille Roldan",
        "department": "Finance",
        "position": "Treasury Assistant",
        "employment_status": "active",
        "employment_type": EmploymentType.part_time,
        "rate_type": RateType.daily,
        "rate_amount": 850,
        "hourly_rate": 106,
        "weekly_schedule": {
            "monday": "WFH 08:00-12:00",
            "tuesday": None,
            "wednesday": "WFH 08:00-12:00",
            "thursday": None,
            "friday": "08:00-12:00",
            "saturday": None,
            "sunday": None,
        },
        "is_department_head": False,
    },
]


def seed_employees(db: Session) -> None:
    departments_by_name: dict[str, Department] = {}

    for item in SEED_EMPLOYEES:
        department_name = item["department"]
        department = departments_by_name.get(department_name)
        if not department:
            department = db.query(Department).filter(Department.name == department_name).first()
            if not department:
                department = Department(name=department_name, description=f"{department_name} department")
                db.add(department)
                db.flush()
            departments_by_name[department_name] = department

    department_head_by_name: dict[str, int] = {}

    for item in SEED_EMPLOYEES:
        existing = db.query(Employee).filter(Employee.employee_code == item["employee_code"]).first()

        if existing:
            existing.profile_name = item["profile_name"]
            existing.department = item["department"]
            existing.position = item["position"]
            existing.employment_status = item["employment_status"]
            existing.employment_type = item["employment_type"]
            existing.rate_type = item["rate_type"]
            existing.rate_amount = item["rate_amount"]
            existing.hourly_rate = item["hourly_rate"]
            existing.weekly_schedule = item["weekly_schedule"]
            employee = existing
        else:
            employee = Employee(
                employee_code=item["employee_code"],
                profile_name=item["profile_name"],
                department=item["department"],
                position=item["position"],
                employment_status=item["employment_status"],
                employment_type=item["employment_type"],
                rate_type=item["rate_type"],
                rate_amount=item["rate_amount"],
                hourly_rate=item["hourly_rate"],
                weekly_schedule=item["weekly_schedule"],
            )
            db.add(employee)
            db.flush()

        if item["is_department_head"]:
            department_head_by_name[item["department"]] = employee.id

    for department_name, department in departments_by_name.items():
        head_employee_id = department_head_by_name.get(department_name)
        if head_employee_id is not None:
            department.head_employee_id = head_employee_id

    db.commit()


def run() -> None:
    ensure_schema_compatibility()
    db = SessionLocal()
    try:
        seed_employees(db)
    finally:
        db.close()


if __name__ == "__main__":
    run()
