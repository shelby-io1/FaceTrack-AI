from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User, UserRole


def get_teachers(db: Session) -> list[User]:
    return db.query(User).filter(User.role == UserRole.TEACHER).order_by(User.name).all()


def get_teacher(db: Session, teacher_id: int) -> User:
    teacher = db.query(User).filter(User.id == teacher_id, User.role == UserRole.TEACHER).first()
    if not teacher:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Teacher not found")
    return teacher


def update_teacher(db: Session, teacher_id: int, data: dict) -> User:
    teacher = get_teacher(db, teacher_id)
    for key, value in data.items():
        if value is not None:
            setattr(teacher, key, value)
    db.commit()
    db.refresh(teacher)
    return teacher
