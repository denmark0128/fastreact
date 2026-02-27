from pydantic import BaseModel, EmailStr

from app.auth.models import UserRole


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    role: UserRole = UserRole.employee


class SignupRequest(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    department: str


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
