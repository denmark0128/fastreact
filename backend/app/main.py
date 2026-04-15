from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.attendance.router import router as attendance_router
from app.audit.router import router as audit_router
from app.auth.router import router as auth_router
from app.auth.service import seed_default_accounts
from app.config import settings
from app.database import Base, SessionLocal, engine, ensure_schema_compatibility
from app.employees.router import router as employees_router
from app.leave.router import router as leave_router
from app.payroll.router import router as payroll_router
from app.performance.router import router as performance_router
from app.recruitment.router import router as recruitment_router
from app.settings.router import router as settings_router

# Import models so Base.metadata.create_all picks them up
import app.attendance.models  # noqa: F401 – AttendanceRecord
import app.leave.models  # noqa: F401 – LeaveRequest
import app.payroll.models  # noqa: F401 – PayrollRecord, PayrollAdjustmentItem
import app.performance.models  # noqa: F401 – PerformanceReview
import app.recruitment.models  # noqa: F401 – JobPosting, Application


Base.metadata.create_all(bind=engine)
ensure_schema_compatibility()


@asynccontextmanager
async def lifespan(application: FastAPI) -> AsyncIterator[None]:
    # Startup
    db = SessionLocal()
    try:
        seed_default_accounts(db)
    finally:
        db.close()
    yield
    # Shutdown (nothing needed)


app = FastAPI(title=settings.app_name, lifespan=lifespan)

allowed_origins = [origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(audit_router, prefix="/api/v1/audit", tags=["Audit"])
app.include_router(attendance_router, prefix="/api/v1/attendance", tags=["Attendance"])
app.include_router(employees_router, prefix="/api/v1/employees", tags=["Employees"])
app.include_router(leave_router, prefix="/api/v1/leave", tags=["Leave"])
app.include_router(payroll_router, prefix="/api/v1/payroll", tags=["Payroll"])
app.include_router(recruitment_router, prefix="/api/v1/recruitment", tags=["Recruitment"])
app.include_router(performance_router, prefix="/api/v1/performance", tags=["Performance"])
app.include_router(settings_router, prefix="/api/v1/settings", tags=["Settings"])


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "HR Management API is running"}
