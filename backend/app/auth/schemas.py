from pydantic import BaseModel, EmailStr, field_validator

from app.auth.models import UserRole


def _validate_password_strength(value: str) -> str:
    if len(value) < 8:
        raise ValueError("Password must be at least 8 characters")
    if not any(c.isupper() for c in value):
        raise ValueError("Password must contain at least one uppercase letter")
    if not any(c.islower() for c in value):
        raise ValueError("Password must contain at least one lowercase letter")
    if not any(c.isdigit() for c in value):
        raise ValueError("Password must contain at least one digit")
    return value


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    role: UserRole = UserRole.employee

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        return _validate_password_strength(v)


class SignupRequest(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    department: str

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        return _validate_password_strength(v)


class AuthUserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    profile_picture_url: str | None = None
    contact_number: str | None = None
    street: str | None = None
    city: str | None = None
    region: str | None = None
    role: UserRole


class AuthTokenPayload(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: AuthUserResponse


class UpdateProfileRequest(BaseModel):
    full_name: str
    profile_picture_url: str | None = None
    contact_number: str | None = None
    street: str | None = None
    city: str | None = None
    region: str | None = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        return _validate_password_strength(v)
