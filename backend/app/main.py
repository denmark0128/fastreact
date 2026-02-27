from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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


Base.metadata.create_all(bind=engine)
ensure_schema_compatibility()

app = FastAPI(title=settings.app_name)

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
app.include_router(employees_router, prefix="/api/v1/employees", tags=["Employees"])
app.include_router(leave_router, prefix="/api/v1/leave", tags=["Leave"])
app.include_router(payroll_router, prefix="/api/v1/payroll", tags=["Payroll"])
app.include_router(recruitment_router, prefix="/api/v1/recruitment", tags=["Recruitment"])
app.include_router(performance_router, prefix="/api/v1/performance", tags=["Performance"])
app.include_router(settings_router, prefix="/api/v1/settings", tags=["Settings"])


@app.on_event("startup")
def startup_seed_default_accounts() -> None:
    db = SessionLocal()
    try:
        seed_default_accounts(db)
    finally:
        db.close()


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "HR Management API is running"}
