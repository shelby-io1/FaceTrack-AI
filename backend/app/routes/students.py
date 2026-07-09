from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import UserRole
from app.schemas.student import StudentCreate, StudentResponse, StudentUpdate
from app.services.auth import require_role
from app.services.student import (
    create_student,
    delete_student,
    get_student,
    get_students,
    update_student,
)

router = APIRouter(prefix="/students", tags=["students"])


@router.get("/", response_model=list[StudentResponse])
def list_students(
    search: str | None = Query(None),
    db: Session = Depends(get_db),
    _: UserRole = Depends(require_role(UserRole.ADMIN, UserRole.TEACHER)),
):
    return get_students(db, search)


@router.get("/{student_id}", response_model=StudentResponse)
def read_student(
    student_id: int,
    db: Session = Depends(get_db),
    _: UserRole = Depends(require_role(UserRole.ADMIN, UserRole.TEACHER)),
):
    return get_student(db, student_id)


@router.post("/", response_model=StudentResponse, status_code=201)
def add_student(
    body: StudentCreate,
    db: Session = Depends(get_db),
    _: UserRole = Depends(require_role(UserRole.ADMIN)),
):
    return create_student(db, body.model_dump())


@router.patch("/{student_id}", response_model=StudentResponse)
def edit_student(
    student_id: int,
    body: StudentUpdate,
    db: Session = Depends(get_db),
    _: UserRole = Depends(require_role(UserRole.ADMIN)),
):
    return update_student(db, student_id, body.model_dump(exclude_none=True))


@router.delete("/{student_id}", status_code=204)
def remove_student(
    student_id: int,
    db: Session = Depends(get_db),
    _: UserRole = Depends(require_role(UserRole.ADMIN)),
):
    delete_student(db, student_id)
