from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import UserRole
from app.schemas.teacher import TeacherResponse, TeacherUpdate
from app.services.auth import require_role
from app.services.teacher import get_teacher, get_teachers, update_teacher

router = APIRouter(prefix="/teachers", tags=["teachers"])


@router.get("/", response_model=list[TeacherResponse])
def list_teachers(
    db: Session = Depends(get_db),
    _: UserRole = Depends(require_role(UserRole.ADMIN)),
):
    return get_teachers(db)


@router.get("/{teacher_id}", response_model=TeacherResponse)
def read_teacher(
    teacher_id: int,
    db: Session = Depends(get_db),
    _: UserRole = Depends(require_role(UserRole.ADMIN)),
):
    return get_teacher(db, teacher_id)


@router.patch("/{teacher_id}", response_model=TeacherResponse)
def edit_teacher(
    teacher_id: int,
    body: TeacherUpdate,
    db: Session = Depends(get_db),
    _: UserRole = Depends(require_role(UserRole.ADMIN)),
):
    return update_teacher(db, teacher_id, body.model_dump(exclude_none=True))
