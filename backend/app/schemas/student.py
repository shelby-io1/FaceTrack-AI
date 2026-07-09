from datetime import datetime

from pydantic import BaseModel, EmailStr, model_validator


class StudentCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    roll_number: str
    department: str
    class_name: str
    phone: str | None = None


class StudentUpdate(BaseModel):
    name: str | None = None
    roll_number: str | None = None
    department: str | None = None
    class_name: str | None = None
    phone: str | None = None


class StudentResponse(BaseModel):
    id: int
    user_id: int
    roll_number: str
    department: str
    class_name: str
    phone: str | None = None
    photo: str | None = None
    email: str = ""
    name: str = ""
    is_active: bool = True
    created_at: datetime | None = None

    model_config = {"from_attributes": True}

    @model_validator(mode="before")
    @classmethod
    def populate_user_fields(cls, data):
        if hasattr(data, "user"):
            user = data.user
            data.email = user.email
            data.name = user.name
            data.is_active = user.is_active
        return data
