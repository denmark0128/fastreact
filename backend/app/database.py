import json

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker

from app.config import settings


engine_kwargs = {}
if settings.database_url.startswith("sqlite"):
	engine_kwargs["connect_args"] = {"check_same_thread": False}

engine = create_engine(settings.database_url, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def ensure_schema_compatibility() -> None:
	inspector = inspect(engine)
	tables = inspector.get_table_names()

	if "users" not in tables:
		return

	user_columns = {column["name"] for column in inspector.get_columns("users")}
	if "profile_picture_url" in user_columns:
		pass
	else:
		with engine.begin() as connection:
			connection.execute(text("ALTER TABLE users ADD COLUMN profile_picture_url VARCHAR(500)"))

	with engine.begin() as connection:
		if "contact_number" not in user_columns:
			connection.execute(text("ALTER TABLE users ADD COLUMN contact_number VARCHAR(50)"))
		if "street" not in user_columns:
			connection.execute(text("ALTER TABLE users ADD COLUMN street VARCHAR(255)"))
		if "city" not in user_columns:
			connection.execute(text("ALTER TABLE users ADD COLUMN city VARCHAR(100)"))
		if "region" not in user_columns:
			connection.execute(text("ALTER TABLE users ADD COLUMN region VARCHAR(100)"))

	if "employees" in tables:
		employee_columns = {column["name"] for column in inspector.get_columns("employees")}
		with engine.begin() as connection:
			if "biometric_id" not in employee_columns:
				connection.execute(text("ALTER TABLE employees ADD COLUMN biometric_id VARCHAR(100)"))

			if "birth_date" not in employee_columns:
				connection.execute(text("ALTER TABLE employees ADD COLUMN birth_date VARCHAR(20)"))
			if "civil_status" not in employee_columns:
				connection.execute(text("ALTER TABLE employees ADD COLUMN civil_status VARCHAR(50)"))
			if "emergency_contact_name" not in employee_columns:
				connection.execute(text("ALTER TABLE employees ADD COLUMN emergency_contact_name VARCHAR(255)"))
			if "emergency_contact_number" not in employee_columns:
				connection.execute(text("ALTER TABLE employees ADD COLUMN emergency_contact_number VARCHAR(50)"))

			if "employment_type" not in employee_columns:
				connection.execute(text("ALTER TABLE employees ADD COLUMN employment_type VARCHAR(50)"))
				connection.execute(text("UPDATE employees SET employment_type = 'regular' WHERE employment_type IS NULL"))

			if "rate_type" not in employee_columns:
				connection.execute(text("ALTER TABLE employees ADD COLUMN rate_type VARCHAR(20)"))
				connection.execute(text("UPDATE employees SET rate_type = 'monthly' WHERE rate_type IS NULL"))

			if "rate_amount" not in employee_columns:
				connection.execute(text("ALTER TABLE employees ADD COLUMN rate_amount NUMERIC(10, 2)"))
				if "hourly_rate" in employee_columns:
					connection.execute(text("UPDATE employees SET rate_amount = hourly_rate WHERE rate_amount IS NULL"))
				connection.execute(text("UPDATE employees SET rate_amount = 0 WHERE rate_amount IS NULL"))

			if "hourly_rate" not in employee_columns:
				connection.execute(text("ALTER TABLE employees ADD COLUMN hourly_rate NUMERIC(10, 2)"))
				connection.execute(text("UPDATE employees SET hourly_rate = 0 WHERE hourly_rate IS NULL"))

			if "weekly_schedule" not in employee_columns:
				connection.execute(text("ALTER TABLE employees ADD COLUMN weekly_schedule TEXT"))
				default_schedule = json.dumps(
					{
						"monday": "09:00-18:00",
						"tuesday": "09:00-18:00",
						"wednesday": "09:00-18:00",
						"thursday": "09:00-18:00",
						"friday": "09:00-18:00",
						"saturday": None,
						"sunday": None,
					}
				)
				connection.execute(
					text("UPDATE employees SET weekly_schedule = :schedule WHERE weekly_schedule IS NULL"),
					{"schedule": default_schedule},
				)

	if "departments" in tables:
		department_columns = {column["name"] for column in inspector.get_columns("departments")}
		if "head_employee_id" not in department_columns:
			with engine.begin() as connection:
				connection.execute(text("ALTER TABLE departments ADD COLUMN head_employee_id INTEGER"))

	if "company_profiles" in tables:
		company_columns = {column["name"] for column in inspector.get_columns("company_profiles")}
		with engine.begin() as connection:
			if "contact_number" not in company_columns:
				connection.execute(text("ALTER TABLE company_profiles ADD COLUMN contact_number VARCHAR(50)"))
			if "street" not in company_columns:
				connection.execute(text("ALTER TABLE company_profiles ADD COLUMN street VARCHAR(255)"))
			if "city" not in company_columns:
				connection.execute(text("ALTER TABLE company_profiles ADD COLUMN city VARCHAR(100)"))
			if "region" not in company_columns:
				connection.execute(text("ALTER TABLE company_profiles ADD COLUMN region VARCHAR(100)"))
