from pydantic import BaseModel


class EnrollmentStart(BaseModel):
    student_id: int


class CaptureImage(BaseModel):
    student_id: int
    image: str
    pose: str = "front"


class EnrollmentStatus(BaseModel):
    student_id: int
    user_id: int
    name: str = ""
    email: str = ""
    roll_number: str | None = None
    captured: int = 0
    required: int = 20
    complete: bool = False
