from fastapi import HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.student import Student
from app.models.user import User
from app.services.auth import hash_password


def create_student(db: Session, data: dict) -> Student:
    if db.query(User).filter(User.email == data["email"]).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already exists")
    roll = data.get("roll_number")
    if roll and db.query(Student).filter(Student.roll_number == roll).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Roll number already exists"
        )

    user = User(
        email=data["email"],
        password_hash=hash_password(data["password"]),
        name=data["name"],
        role="student",
    )
    db.add(user)
    db.flush()

    student = Student(
        user_id=user.id,
        roll_number=data.get("roll_number"),
        department=data.get("department"),
        semester=data.get("semester"),
        phone=data.get("phone"),
    )
    db.add(student)
    db.commit()
    db.refresh(student)
    return student


def get_students(db: Session, search: str | None = None) -> list[Student]:
    query = db.query(Student)
    if search:
        query = query.join(User).filter(
            or_(
                Student.roll_number.ilike(f"%{search}%"),
                Student.department.ilike(f"%{search}%"),
                Student.semester.ilike(f"%{search}%"),
                User.name.ilike(f"%{search}%"),
                User.email.ilike(f"%{search}%"),
            )
        )
    return query.order_by(Student.roll_number).all()


def get_student(db: Session, student_id: int) -> Student:
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    return student


def update_student(db: Session, student_id: int, data: dict) -> Student:
    student = get_student(db, student_id)

    if "roll_number" in data and data["roll_number"] != student.roll_number:
        if db.query(Student).filter(Student.roll_number == data["roll_number"]).first():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail="Roll number already exists"
            )

    for key, value in data.items():
        if value is not None and hasattr(student, key):
            setattr(student, key, value)

    if "name" in data and data["name"] is not None:
        student.user.name = data["name"]

    db.commit()
    db.refresh(student)
    return student


def delete_student(db: Session, student_id: int) -> None:
    student = get_student(db, student_id)
    user_id = student.user_id

    from app.models.attendance import Attendance
    from app.models.face_encoding import FaceEncoding

    db.query(Attendance).filter(Attendance.student_id == student_id).delete()
    db.query(FaceEncoding).filter(FaceEncoding.student_id == student_id).delete()

    db.delete(student)
    db.flush()
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        db.delete(user)
    db.commit()
