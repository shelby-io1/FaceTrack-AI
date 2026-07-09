from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.schemas.auth import (
    ChangePasswordRequest,
    LoginRequest,
    ProfileUpdate,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)
from app.services.auth import (
    change_password,
    get_current_user,
    login_user,
    refresh_access_token,
    register_user,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse, status_code=201)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    user = register_user(db, body.email, body.password, body.name, body.role)
    return user


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    access_token, refresh_token, _ = login_user(db, body.email, body.password)
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=TokenResponse)
def refresh(body: RefreshRequest):
    access_token, refresh_token = refresh_access_token(body.refresh_token)
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from app.models.student import Student
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if student:
        current_user.roll_number = student.roll_number
        current_user.department = student.department
        current_user.semester = student.semester
    return current_user


@router.patch("/me", response_model=UserResponse)
def update_profile(
    body: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.models.student import Student

    user_fields = {"name", "phone", "age", "address", "cnic"}
    student_fields = {"roll_number", "department", "semester"}

    user_data = body.model_dump(exclude_none=True)

    for field, value in user_data.items():
        if field in user_fields:
            setattr(current_user, field, value)

    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if student:
        for field, value in user_data.items():
            if field in student_fields:
                setattr(student, field, value)
        db.flush()

    db.commit()
    db.refresh(current_user)

    if student:
        current_user.roll_number = student.roll_number
        current_user.department = student.department
        current_user.semester = student.semester
    return current_user


@router.post("/change-password", status_code=200)
def change_password_route(
    body: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    change_password(db, current_user, body.current_password, body.new_password)
    return {"message": "Password changed successfully"}
