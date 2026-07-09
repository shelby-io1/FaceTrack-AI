from datetime import datetime

from pydantic import BaseModel, EmailStr


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "student"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    role: str
    phone: str | None = None
    age: int | None = None
    address: str | None = None
    cnic: str | None = None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class ProfileUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None
    age: int | None = None
    address: str | None = None
    cnic: str | None = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
