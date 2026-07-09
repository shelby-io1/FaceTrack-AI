from datetime import datetime

from pydantic import BaseModel, EmailStr


class InviteCreate(BaseModel):
    email: EmailStr
    name: str
    roll_number: str
    department: str
    semester: str
    phone: str | None = None


class InviteResponse(BaseModel):
    id: int
    email: str
    name: str
    roll_number: str
    department: str
    semester: str
    phone: str | None = None
    registration_code: str
    created_at: datetime
    used_at: datetime | None = None

    model_config = {"from_attributes": True}
