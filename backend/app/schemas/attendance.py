from datetime import date, datetime

from pydantic import BaseModel


class MarkAttendanceRequest(BaseModel):
    student_id: int
    confidence: float | None = None


class AttendanceResponse(BaseModel):
    id: int
    student_id: int
    name: str
    roll_number: str
    date: date
    status: str
    confidence: float | None
    recognized_at: datetime

    model_config = {"from_attributes": True}


class DailyStats(BaseModel):
    date: date
    present: int
    total: int


class AttendanceStats(BaseModel):
    total_students: int
    total_records: int
    today_present: int
    today_absent: int
    daily: list[DailyStats]

