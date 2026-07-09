import base64
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.face_encoding import FaceEncoding
from app.models.student import Student
from app.models.user import UserRole
from app.schemas.face_enrollment import CaptureImage, EnrollmentStatus
from app.services.auth import require_role
from app.services.face_enrollment import capture_face

router = APIRouter(prefix="/enrollment", tags=["enrollment"])


@router.post("/capture")
def capture(
    body: CaptureImage,
    db: Session = Depends(get_db),
    _: UserRole = Depends(require_role(UserRole.ADMIN, UserRole.TEACHER)),
):
    return capture_face(db, body.student_id, body.image, body.pose)


@router.get("/student/{student_id}/images")
def student_images(
    student_id: int,
    db: Session = Depends(get_db),
    _: UserRole = Depends(require_role(UserRole.ADMIN, UserRole.TEACHER)),
):
    student = db.query(Student).filter(
        (Student.id == student_id) | (Student.user_id == student_id)
    ).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    encodings = (
        db.query(FaceEncoding)
        .filter(FaceEncoding.student_id == student.id)
        .order_by(FaceEncoding.created_at)
        .all()
    )

    images = []
    for enc in encodings:
        try:
            path = Path(enc.image_path)
            with open(path, "rb") as f:
                b64 = base64.b64encode(f.read()).decode()
                images.append({
                    "id": enc.id,
                    "pose": enc.pose,
                    "quality": round(enc.quality, 4),
                    "image": f"data:image/jpeg;base64,{b64}",
                })
        except (FileNotFoundError, OSError):
            images.append({
                "id": enc.id,
                "pose": enc.pose,
                "quality": round(enc.quality, 4),
                "image": None,
            })

    name = student.user.name if student.user else ""
    return JSONResponse({"student_id": student.id, "name": name, "images": images})


@router.get("/status", response_model=list[EnrollmentStatus])
def enrollment_status(
    db: Session = Depends(get_db),
    _: UserRole = Depends(require_role(UserRole.ADMIN, UserRole.TEACHER)),
):
    counts = (
        db.query(
            FaceEncoding.student_id,
            func.count(FaceEncoding.id).label("captured"),
        )
        .group_by(FaceEncoding.student_id)
        .subquery()
    )
    students = (
        db.query(Student, func.coalesce(counts.c.captured, 0).label("captured"))
        .outerjoin(counts, Student.id == counts.c.student_id)
        .all()
    )
    result = []
    for student, captured in students:
        result.append({
            "student_id": student.id,
            "user_id": student.user_id,
            "name": student.user.name if student.user else "",
            "email": student.user.email if student.user else "",
            "roll_number": student.roll_number,
            "captured": captured,
            "required": 20,
            "complete": captured >= 20,
        })
    return result
