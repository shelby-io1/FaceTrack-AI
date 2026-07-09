from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import create_access_token, create_refresh_token, hash_password
from app.models.user import User, UserRole

router = APIRouter(prefix="/auth", tags=["neon-auth"])


class NeonExchangeRequest(BaseModel):
    email: EmailStr
    name: str
    sub: str


class NeonExchangeResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict


@router.post("/neon-exchange", response_model=NeonExchangeResponse)
def neon_exchange(
    body: NeonExchangeRequest,
    db: Session = Depends(get_db),
    authorization: str = Header(""),
):
    expected = f"Bearer {settings.NEON_AUTH_SHARED_SECRET}"
    if not authorization or authorization != expected:
        raise HTTPException(status_code=401, detail="Invalid or missing shared secret")

    user = db.query(User).filter(User.email == body.email).first()

    if not user:
        random_password = hash_password(body.sub)
        user = User(
            email=body.email,
            password_hash=random_password,
            name=body.name,
            role=UserRole.STUDENT,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    elif not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    token_data = {"sub": str(user.id), "role": user.role.value}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    return NeonExchangeResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user={
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role.value,
            "is_active": user.is_active,
            "created_at": user.created_at.isoformat(),
        },
    )
