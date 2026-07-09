from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, LargeBinary, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.student import Student


class FaceEncoding(Base):
    __tablename__ = "face_encodings"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    student_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False
    )
    embedding: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    image_path: Mapped[str] = mapped_column(String(500), nullable=False)
    pose: Mapped[str] = mapped_column(String(20), nullable=True)
    quality: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    student: Mapped[Student] = relationship(
        "Student", backref="face_encodings", lazy="joined", passive_deletes=True
    )
