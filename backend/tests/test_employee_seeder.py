from app.seed_employees import seed_employees
from app.database import SessionLocal
from app.employees.models import Employee
from app.settings.models import Department


def test_seed_employees_is_idempotent_and_assigns_department_heads(client):
    db = SessionLocal()
    try:
        seed_employees(db)
        seed_employees(db)

        employees = db.query(Employee).all()
        departments = db.query(Department).all()

        assert len(employees) == 16
        assert len(departments) == 4

        for department in departments:
            assert department.head_employee_id is not None

        intern_employee = db.query(Employee).filter(Employee.employee_code == "EMP-1008").first()
        assert intern_employee is not None
        assert intern_employee.employment_type.value == "intern"
        assert intern_employee.rate_type.value == "daily"
        assert intern_employee.rate_amount == 700
        assert intern_employee.weekly_schedule["monday"] == "10:00-16:00"

        wfh_employee = db.query(Employee).filter(Employee.employee_code == "EMP-1012").first()
        assert wfh_employee is not None
        assert wfh_employee.weekly_schedule["monday"] == "WFH 09:00-18:00"

        weekday_off_employee = db.query(Employee).filter(Employee.employee_code == "EMP-1011").first()
        assert weekday_off_employee is not None
        assert weekday_off_employee.weekly_schedule["monday"] is None

        sick_leave_employee = db.query(Employee).filter(Employee.employee_code == "EMP-1015").first()
        assert sick_leave_employee is not None
        assert sick_leave_employee.employment_status == "sick_leave"

        vacation_leave_employee = db.query(Employee).filter(Employee.employee_code == "EMP-1013").first()
        assert vacation_leave_employee is not None
        assert vacation_leave_employee.employment_status == "vacation_leave"
    finally:
        db.close()
