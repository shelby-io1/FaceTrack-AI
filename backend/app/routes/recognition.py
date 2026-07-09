import base64

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.ai.face_recognition import recognize_face
from app.core.database import get_db
from app.models.face_encoding import FaceEncoding
from app.models.user import UserRole
from app.schemas.recognition import RecognizeRequest, RecognizeResponse
from app.services.auth import require_role

router = APIRouter(prefix="/recognition", tags=["recognition"])


@router.post("/recognize", response_model=RecognizeResponse)
def recognize(
    body: RecognizeRequest,
    db: Session = Depends(get_db),
    _: UserRole = Depends(require_role(UserRole.ADMIN, UserRole.TEACHER)),
):
    if not body.image or len(body.image) < 100:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid image data")

    try:
        image_bytes = base64.b64decode(body.image)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid image data"
        )

    encodings = db.query(FaceEncoding).all()

    try:
        result = recognize_face(image_bytes, encodings)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to process image. Please try again.",
        )
    if result is None:
        return RecognizeResponse(recognized=False)

    student_id, confidence, _ = result

    from app.models.student import Student

    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        return RecognizeResponse(recognized=False)

    return RecognizeResponse(
        student_id=student.id,
        name=student.user.name,
        roll_number=student.roll_number,
        confidence=confidence,
        recognized=True,
    )
