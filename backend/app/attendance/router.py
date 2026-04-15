import csv
from io import BytesIO, StringIO

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.attendance.schemas import AttendanceImportResult, AttendanceListResponse, AttendanceRecordCreate, AttendanceRecordUpdate
from app.attendance.service import (
    create_attendance_record,
    import_attendance_records,
    list_attendance_records,
    parse_csv_rows,
    parse_excel_rows,
    update_attendance_record,
)
from app.audit.service import create_audit_log
from app.auth.models import User, UserRole
from app.dependencies import get_current_user, get_db, require_roles
from app.employees.models import Employee
from app.utils.responses import success_response


router = APIRouter()

ATTENDANCE_TEMPLATE_HEADERS = [
    "employee_id",
    "employee_code",
    "date",
    "am_in",
    "am_out",
    "pm_in",
    "pm_out",
    "note",
]


@router.get("/health")
def attendance_health() -> dict[str, object]:
    return success_response("Attendance module ready")


@router.get("/records/template")
def download_attendance_template_endpoint(
    format: str = Query(default="csv", pattern="^(csv|xlsx)$"),
    _: User = Depends(require_roles(UserRole.admin, UserRole.hr_manager)),
):
    if format == "xlsx":
        try:
            from openpyxl import Workbook
        except ImportError as exc:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Excel template support requires openpyxl package",
            ) from exc

        workbook = Workbook()
        worksheet = workbook.active
        worksheet.title = "attendance_template"
        worksheet.append(ATTENDANCE_TEMPLATE_HEADERS)
        worksheet.append(["", "EMP-001", "2026-03-13", "09:00", "12:00", "13:00", "18:00", "Optional note"])

        stream = BytesIO()
        workbook.save(stream)
        stream.seek(0)
        return StreamingResponse(
            stream,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=attendance_template.xlsx"},
        )

    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(ATTENDANCE_TEMPLATE_HEADERS)
    writer.writerow(["", "EMP-001", "2026-03-13", "09:00", "12:00", "13:00", "18:00", "Optional note"])
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=attendance_template.csv"},
    )


@router.get("/records")
def list_attendance_records_endpoint(
    employee_id: int | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
    q: str | None = None,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resolved_employee_id = employee_id

    if current_user.role == UserRole.employee:
        own_employee = db.query(Employee).filter(Employee.user_id == current_user.id).first()
        if not own_employee:
            response = AttendanceListResponse(items=[], total=0)
            return success_response("Attendance records fetched", response.model_dump())
        resolved_employee_id = own_employee.id

    items, total = list_attendance_records(
        db,
        employee_id=resolved_employee_id,
        date_from=date_from,
        date_to=date_to,
        q=q,
        skip=skip,
        limit=limit,
    )
    response = AttendanceListResponse(items=items, total=total)
    return success_response("Attendance records fetched", response.model_dump())


@router.post("/records", status_code=status.HTTP_201_CREATED)
def create_attendance_record_endpoint(
    payload: AttendanceRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin, UserRole.hr_manager)),
):
    record = create_attendance_record(db, payload)
    create_audit_log(
        db,
        action="create_attendance_record",
        entity_type="attendance",
        entity_id=record.id,
        actor=current_user,
        details={
            "employee_id": record.employee_id,
            "date": record.date,
        },
    )
    return success_response("Attendance record created", record.model_dump())


@router.put("/records/{record_id}")
def update_attendance_record_endpoint(
    record_id: int,
    payload: AttendanceRecordUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin, UserRole.hr_manager)),
):
    record = update_attendance_record(db, record_id, payload)
    create_audit_log(
        db,
        action="update_attendance_record",
        entity_type="attendance",
        entity_id=record.id,
        actor=current_user,
    )
    return success_response("Attendance record updated", record.model_dump())


@router.post("/records/import")
async def import_attendance_records_endpoint(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin, UserRole.hr_manager)),
):
    filename = (file.filename or "").lower()
    if not filename.endswith((".csv", ".xlsx", ".xlsm")):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only CSV or Excel (.xlsx/.xlsm) files are supported")

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty")

    if filename.endswith(".csv"):
        rows = parse_csv_rows(file_bytes)
    else:
        rows = parse_excel_rows(file_bytes)

    result_dict = import_attendance_records(db, rows)
    result = AttendanceImportResult(**result_dict)

    create_audit_log(
        db,
        action="import_attendance_records",
        entity_type="attendance",
        actor=current_user,
        details={
            "filename": file.filename,
            "imported": result.imported,
            "updated": result.updated,
            "skipped": result.skipped,
        },
    )

    return success_response("Attendance records imported", result.model_dump())