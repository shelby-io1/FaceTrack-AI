from pydantic import BaseModel


class RecognizeRequest(BaseModel):
    image: str


class RecognizeResponse(BaseModel):
    student_id: int | None = None
    name: str | None = None
    roll_number: str | None = None
    confidence: float | None = None
    recognized: bool
