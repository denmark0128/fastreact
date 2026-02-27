from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.audit.service import create_audit_log
from app.auth.models import User, UserRole
from app.auth.schemas import AuthTokenPayload, AuthUserResponse, ChangePasswordRequest, LoginRequest, RegisterRequest, SignupRequest, UpdateProfileRequest
from app.auth.service import authenticate_user, change_user_password, create_access_token, create_signup_user, create_user, update_user_profile
from app.dependencies import get_current_user, get_db, require_roles
from app.utils.responses import success_response


router = APIRouter()


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(
    payload: RegisterRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin, UserRole.hr_manager)),
):
    user = create_user(db, payload)
    create_audit_log(
        db,
        action="register_user",
        entity_type="user",
        entity_id=user.id,
        actor=current_user,
        details={"email": user.email, "role": user.role.value},
    )
    user_data = AuthUserResponse.model_validate(user, from_attributes=True)
    return success_response("User registered successfully", user_data.model_dump())


@router.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    user = create_signup_user(
        db,
        email=payload.email,
        full_name=payload.full_name,
        password=payload.password,
        department=payload.department,
    )
    create_audit_log(
        db,
        action="signup_user",
        entity_type="user",
        entity_id=user.id,
        actor=user,
        details={"department": payload.department},
    )
    user_data = AuthUserResponse.model_validate(user, from_attributes=True)
    return success_response("Account created successfully", user_data.model_dump())


@router.post("/login")
def login(payload: LoginRequest, response: Response, db: Session = Depends(get_db)):
    user = authenticate_user(db, payload.email, payload.password)
    access_token = create_access_token(user.id, user.role)
    create_audit_log(
        db,
        action="login",
        entity_type="auth",
        entity_id=user.id,
        actor=user,
    )

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=False,
        samesite="lax",
    )

    token_payload = AuthTokenPayload(
        access_token=access_token,
        user=AuthUserResponse.model_validate(user, from_attributes=True),
    )
    return success_response("Login successful", token_payload.model_dump())


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("access_token")
    return success_response("Logout successful")


@router.get("/me")
def me(current_user: User = Depends(get_current_user)):
    user_data = AuthUserResponse.model_validate(current_user, from_attributes=True)
    return success_response("Current user fetched", user_data.model_dump())


@router.put("/me")
def update_me(
    payload: UpdateProfileRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    updated_user = update_user_profile(
        db,
        user=current_user,
        full_name=payload.full_name,
        profile_picture_url=payload.profile_picture_url,
        contact_number=payload.contact_number,
        street=payload.street,
        city=payload.city,
        region=payload.region,
    )
    create_audit_log(
        db,
        action="update_profile",
        entity_type="user",
        entity_id=updated_user.id,
        actor=current_user,
    )
    user_data = AuthUserResponse.model_validate(updated_user, from_attributes=True)
    return success_response("Profile updated successfully", user_data.model_dump())


@router.put("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    change_user_password(
        db,
        user=current_user,
        current_password=payload.current_password,
        new_password=payload.new_password,
    )
    create_audit_log(
        db,
        action="change_password",
        entity_type="user",
        entity_id=current_user.id,
        actor=current_user,
    )
    return success_response("Password changed successfully")
