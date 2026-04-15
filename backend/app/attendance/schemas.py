from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator


def _validate_time(value: str | None) -> str | None:
    if value is None or value == "":
        return None
    parts = value.split(":")
    if len(parts) != 2:
        raise ValueError("Time must be in HH:MM format")
    h, m = parts
    if not (h.isdigit() and m.isdigit()):
        raise ValueError("Time must be in HH:MM format")
    if not (0 <= int(h) <= 23 and 0 <= int(m) <= 59):
        raise ValueError("Invalid time value")
    return f"{int(h):02d}:{int(m):02d}"


class AttendanceRecordCreate(BaseModel):
    employee_id: int
    date: str  # YYYY-MM-DD
    am_in: str | None = None
    am_out: str | None = None
    pm_in: str | None = None
    pm_out: str | None = None
    note: str | None = None

    @field_validator("am_in", "am_out", "pm_in", "pm_out", mode="before")
    @classmethod
    def validate_time_fields(cls, v: str | None) -> str | None:
        return _validate_time(v)


class AttendanceRecordUpdate(BaseModel):
    am_in: str | None = None
    am_out: str | None = None
    pm_in: str | None = None
    pm_out: str | None = None
    note: str | None = None

    @field_validator("am_in", "am_out", "pm_in", "pm_out", mode="before")
    @classmethod
    def validate_time_fields(cls, v: str | None) -> str | None:
        return _validate_time(v)


class AttendanceRecordResponse(BaseModel):
    id: int
    employee_id: int
    employee_name: str | None = None
    employee_code: str | None = None
    date: str
    am_in: str | None = None
    am_out: str | None = None
    pm_in: str | None = None
    pm_out: str | None = None
    note: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AttendanceListResponse(BaseModel):
    items: list[AttendanceRecordResponse]
    total: int


class AttendanceImportResult(BaseModel):
    imported: int
    updated: int
    skipped: int
    errors: list[str]
