from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import model_validator


class Settings(BaseSettings):
    app_name: str = "HR Management API"
    app_env: str = "development"
    app_port: int = 8000

    database_url: str = "sqlite:///./dev.sqlite3"

    jwt_secret_key: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60

    default_admin_email: str = "admin@company.com"
    default_admin_password: str = "admin12345"
    default_admin_name: str = "System Admin"
    default_hr_email: str = "hr@company.com"
    default_hr_password: str = "hr12345"
    default_hr_name: str = "HR Manager"

    cors_origins: str = "http://127.0.0.1:5173,http://localhost:5173"
    biometric_ingest_api_key: str = "local-biometric-key"

    @model_validator(mode="after")
    def validate_security_settings(self) -> "Settings":
        if self.app_env.lower() == "production":
            if self.jwt_secret_key == "change-me-in-production" or len(self.jwt_secret_key) < 32:
                raise ValueError("JWT_SECRET_KEY must be set to a strong value in production")
            if self.default_admin_password == "admin12345" or self.default_hr_password == "hr12345":
                raise ValueError("Default account passwords must be changed in production")
            if self.biometric_ingest_api_key == "local-biometric-key" or len(self.biometric_ingest_api_key) < 16:
                raise ValueError("BIOMETRIC_INGEST_API_KEY must be set to a strong value in production")
        return self

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
