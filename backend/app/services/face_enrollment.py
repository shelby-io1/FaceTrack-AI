import base64

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.ai.face_service import detect_and_embed
from app.models.face_encoding import FaceEncoding
from app.models.student import Student


def capture_face(db: Session, student_id: int, image_b64: str, pose: str) -> dict:
    student = db.query(Student).filter(
        (Student.id == student_id) | (Student.user_id == student_id)
    ).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    if not image_b64 or len(image_b64) < 100:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid image data")

    try:
        image_bytes = base64.b64decode(image_b64)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid image data")

    try:
        result = detect_and_embed(image_bytes, student_id, pose)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to process image. Please try again.",
        )

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No face detected. Please ensure your face is clearly visible.",
        )

    embedding, image_path, quality = result

    encoding = FaceEncoding(
        student_id=student_id,
        embedding=embedding,
        image_path=image_path,
        pose=pose,
        quality=quality,
    )
    db.add(encoding)
    db.commit()
    db.refresh(encoding)

    count = db.query(FaceEncoding).filter(FaceEncoding.student_id == student_id).count()

    return {
        "id": encoding.id,
        "captured": count,
        "required": 20,
        "quality": round(quality, 4),
        "pose": pose,
    }
