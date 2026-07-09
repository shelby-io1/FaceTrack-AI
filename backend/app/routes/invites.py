from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import UserRole
from app.schemas.invite import InviteCreate, InviteResponse
from app.services.auth import require_role
from app.services.invite import create_invite

router = APIRouter(prefix="/invites", tags=["invites"])


@router.post("/", response_model=InviteResponse, status_code=201)
def add_invite(
    body: InviteCreate,
    db: Session = Depends(get_db),
    _: UserRole = Depends(require_role(UserRole.ADMIN)),
):
    return create_invite(db, body.model_dump())
