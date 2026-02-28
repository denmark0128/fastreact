from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import model_validator


class Settings(BaseSettings):
    app_name: str = "HR Management API"
    app_env: str = "development"
    app_port: int = 8000

    database_url: str = "sqlite:///./dev.sqlite3"

    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60

    default_admin_email: str = "admin@company.com"
    default_admin_password: str
    default_admin_name: str = "System Admin"
    default_hr_email: str = "hr@company.com"
    default_hr_password: str
    default_hr_name: str = "HR Manager"

    cors_origins: str = "http://127.0.0.1:5173,http://localhost:5173"
    biometric_ingest_api_key: str

    @model_validator(mode="after")
    def validate_security_settings(self) -> "Settings":
        if len(self.jwt_secret_key) < 32:
            raise ValueError("JWT_SECRET_KEY must be at least 32 characters")
        if len(self.biometric_ingest_api_key) < 16:
            raise ValueError("BIOMETRIC_INGEST_API_KEY must be at least 16 characters")
        if self.default_admin_password in {"admin12345", "change-me"}:
            raise ValueError("DEFAULT_ADMIN_PASSWORD must not use weak default values")
        if self.default_hr_password in {"hr12345", "change-me"}:
            raise ValueError("DEFAULT_HR_PASSWORD must not use weak default values")
        if self.app_env.lower() == "production" and self.default_admin_password == self.default_hr_password:
            raise ValueError("DEFAULT_ADMIN_PASSWORD and DEFAULT_HR_PASSWORD must be different in production")
        return self

    model_config = SettingsConfigDict(
        env_file=(".env", "backend/.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
