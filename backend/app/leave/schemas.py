from datetime import date, datetime

from pydantic import BaseModel, Field


class AttendancePunchIngestItem(BaseModel):
	device_id: str
	employee_biometric_id: str
	punch_time: datetime
	punch_id: str | None = None
	punch_type: str | None = None


class AttendancePunchIngestRequest(BaseModel):
	punches: list[AttendancePunchIngestItem] = Field(default_factory=list)


class AttendanceIngestResponse(BaseModel):
	received_count: int
	ingested_count: int
	duplicate_count: int
	unresolved_count: int


class AttendanceEmployeeSummaryResponse(BaseModel):
	employee_id: int
	cutoff_start: date
	cutoff_end: date
	scheduled_minutes: int
	actual_minutes: int
	late_minutes: int
	undertime_minutes: int
	overtime_minutes: int
