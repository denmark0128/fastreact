from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from app.leave.models import LeaveStatus, LeaveType


# ── Leave Requests ──

class LeaveRequestCreate(BaseModel):
	leave_type: LeaveType
	start_date: str
	end_date: str
	reason: str | None = None
	employee_id: int | None = None


class LeaveRequestReview(BaseModel):
	status: LeaveStatus
	review_note: str | None = None


class LeaveRequestResponse(BaseModel):
	id: int
	employee_id: int
	employee_name: str | None = None
	leave_type: LeaveType
	start_date: str
	end_date: str
	reason: str | None = None
	status: LeaveStatus
	reviewer_id: int | None = None
	review_note: str | None = None
	created_at: datetime
	updated_at: datetime

	model_config = ConfigDict(from_attributes=True)


class LeaveRequestListResponse(BaseModel):
	items: list[LeaveRequestResponse]
	total: int


# ── Attendance ──

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
