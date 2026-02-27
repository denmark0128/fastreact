from datetime import UTC, datetime, timedelta

from fastapi import HTTPException, status
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.auth.models import User, UserRole
from app.auth.schemas import RegisterRequest
from app.config import settings
from app.employees.models import Employee


password_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


def hash_password(password: str) -> str:
    return password_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return password_context.verify(plain_password, hashed_password)


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()


def create_access_token(user_id: int, role: UserRole) -> str:
    expire_at = datetime.now(UTC) + timedelta(minutes=settings.jwt_expire_minutes)
    payload = {"sub": str(user_id), "role": role.value, "exp": expire_at}
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc


def authenticate_user(db: Session, email: str, password: str) -> User:
    user = get_user_by_email(db, email)
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    return user


def create_user(db: Session, payload: RegisterRequest) -> User:
    existing_user = get_user_by_email(db, payload.email)
    if existing_user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already exists")

    user = User(
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=hash_password(payload.password),
        role=payload.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def create_signup_user(db: Session, email: str, full_name: str, password: str, department: str) -> User:
    existing_user = get_user_by_email(db, email)
    if existing_user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already exists")

    user = User(
        email=email,
        full_name=full_name,
        hashed_password=hash_password(password),
        role=UserRole.employee,
    )
    db.add(user)
    db.flush()

    employee_profile = Employee(
        user_id=user.id,
        employee_code=f"EMP-{user.id:04d}",
        profile_name=full_name,
        department=department,
        position="Employee",
        employment_status="active",
    )
    db.add(employee_profile)

    db.commit()
    db.refresh(user)
    return user


def update_user_profile(
    db: Session,
    user: User,
    full_name: str,
    profile_picture_url: str | None,
    contact_number: str | None,
    street: str | None,
    city: str | None,
    region: str | None,
) -> User:
    user.full_name = full_name
    user.profile_picture_url = profile_picture_url
    user.contact_number = contact_number
    user.street = street
    user.city = city
    user.region = region
    db.commit()
    db.refresh(user)
    return user


def change_user_password(db: Session, user: User, current_password: str, new_password: str) -> None:
    if not verify_password(current_password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")

    user.hashed_password = hash_password(new_password)
    db.commit()


def _create_default_user_if_missing(
    db: Session,
    *,
    email: str,
    full_name: str,
    password: str,
    role: UserRole,
) -> bool:
    existing_user = get_user_by_email(db, email)
    if existing_user:
        return False

    user = User(
        email=email,
        full_name=full_name,
        hashed_password=hash_password(password),
        role=role,
    )
    db.add(user)
    return True


def seed_default_accounts(db: Session) -> None:
    has_changes = False

    has_changes |= _create_default_user_if_missing(
        db,
        email=settings.default_admin_email,
        full_name=settings.default_admin_name,
        password=settings.default_admin_password,
        role=UserRole.admin,
    )

    has_changes |= _create_default_user_if_missing(
        db,
        email=settings.default_hr_email,
        full_name=settings.default_hr_name,
        password=settings.default_hr_password,
        role=UserRole.hr_manager,
    )

    if has_changes:
        db.commit()


def create_default_admin_if_missing(db: Session) -> None:
    seed_default_accounts(db)
