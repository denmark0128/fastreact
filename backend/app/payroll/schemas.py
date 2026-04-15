from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field, model_validator

# ---------------------------------------------------------------------------
# Adjustment items (modal-based, pre-saved before processing)
# ---------------------------------------------------------------------------

AdjustmentTypeStr = Literal[
	"cash_advance",
	"allowance",
	"bonus",
	"sss_loan",
	"pagibig_loan",
	"other_deduction",
	"other_addition",
]


class AdjustmentItemCreate(BaseModel):
	employee_id: int
	cutoff_start: date
	cutoff_end: date
	type: AdjustmentTypeStr
	amount: float = Field(gt=0)
	label: str | None = Field(default=None, max_length=200)
	notes: str | None = Field(default=None, max_length=500)


class AdjustmentItemResponse(BaseModel):
	id: int
	employee_id: int
	cutoff_start: date
	cutoff_end: date
	type: str
	amount: float
	label: str | None = None
	notes: str | None = None
	created_at: datetime


class PayrollAdjustment(BaseModel):
	employee_id: int
	actual_minutes: int | None = Field(default=None, ge=0)
	late_minutes: int = Field(default=0, ge=0)
	overtime_minutes: int = Field(default=0, ge=0)
	allowances: float = Field(default=0, ge=0)
	other_deductions: float = Field(default=0, ge=0)
	notes: str | None = None


class PayrollProcessRequest(BaseModel):
	cutoff_start: date
	cutoff_end: date
	pay_date: date | None = None
	employee_ids: list[int] | None = None
	adjustments: list[PayrollAdjustment] = Field(default_factory=list)

	@model_validator(mode="after")
	def validate_cutoff(self):
		if self.cutoff_end < self.cutoff_start:
			raise ValueError("cutoff_end must be on or after cutoff_start")
		return self


class PayrollRecordResponse(BaseModel):
	id: int
	employee_id: int
	employee_code: str
	profile_name: str
	cutoff_start: date
	cutoff_end: date
	pay_date: date

	scheduled_minutes: int
	actual_minutes: int
	late_minutes: int
	undertime_minutes: int
	overtime_minutes: int

	allowances: float
	other_deductions: float
	basic_pay: float
	overtime_pay: float
	late_deduction: float
	undertime_deduction: float
	gross_pay: float
	net_pay: float
	notes: str | None = None


class PayrollSummaryResponse(BaseModel):
	cutoff_start: date | None = None
	cutoff_end: date | None = None
	record_count: int
	total_gross_pay: float
	total_net_pay: float
	total_late_minutes: int
	total_undertime_minutes: int
	total_overtime_minutes: int
