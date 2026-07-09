from datetime import datetime

from pydantic import BaseModel


class TeacherResponse(BaseModel):
    id: int
    email: str
    name: str
    phone: str | None = None
    age: int | None = None
    address: str | None = None
    cnic: str | None = None
    is_active: bool = True
    created_at: datetime

    model_config = {"from_attributes": True}


class TeacherUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None
    age: int | None = None
    address: str | None = None
    cnic: str | None = None
