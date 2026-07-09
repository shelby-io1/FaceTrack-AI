import secrets
import string
from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.invite import StudentInvite


def _generate_code() -> str:
    return "FT-" + "".join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(6))


def create_invite(db: Session, data: dict) -> StudentInvite:
    existing = db.query(StudentInvite).filter(
        StudentInvite.email == data["email"], StudentInvite.used_at.is_(None)
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An active invite already exists for this email",
        )

    code = _generate_code()
    while db.query(StudentInvite).filter(StudentInvite.registration_code == code).first():
        code = _generate_code()

    invite = StudentInvite(
        email=data["email"],
        name=data["name"],
        roll_number=data["roll_number"],
        department=data["department"],
        semester=data["semester"],
        phone=data.get("phone"),
        registration_code=code,
    )
    db.add(invite)
    db.commit()
    db.refresh(invite)
    return invite


def validate_invite(db: Session, code: str, email: str) -> StudentInvite:
    invite = db.query(StudentInvite).filter(
        StudentInvite.registration_code == code,
        StudentInvite.used_at.is_(None),
    ).first()
    if not invite:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired registration code",
        )
    if invite.email != email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email does not match the registration code",
        )
    return invite


def mark_invite_used(db: Session, invite: StudentInvite) -> None:
    invite.used_at = datetime.now(UTC)
