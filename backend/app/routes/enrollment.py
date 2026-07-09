from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import UserRole
from app.schemas.face_enrollment import CaptureImage
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
