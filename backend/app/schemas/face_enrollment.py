from pydantic import BaseModel


class EnrollmentStart(BaseModel):
    student_id: int


class CaptureImage(BaseModel):
    student_id: int
    image: str
    pose: str = "front"


class EnrollmentStatus(BaseModel):
    student_id: int
    captured: int = 0
    required: int = 20
    poses: list[str] = ["front", "left", "right", "up", "down"]

    @property
    def complete(self) -> bool:
        return self.captured >= self.required
