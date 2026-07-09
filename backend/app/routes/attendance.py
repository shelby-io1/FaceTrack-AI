from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.attendance import Attendance
from app.models.student import Student
from app.models.user import User, UserRole
from app.schemas.attendance import (
    AttendanceResponse,
    AttendanceStats,
    DailyStats,
    MarkAttendanceRequest,
)
from app.services.auth import get_current_user, require_role

router = APIRouter(prefix="/attendance", tags=["attendance"])


@router.post("/mark", response_model=AttendanceResponse)
def mark_attendance(
    body: MarkAttendanceRequest,
    db: Session = Depends(get_db),
    _: UserRole = Depends(require_role(UserRole.ADMIN, UserRole.TEACHER)),
):
    student = db.query(Student).filter(Student.id == body.student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    today = date.today()
    existing = (
        db.query(Attendance)
        .filter(Attendance.student_id == body.student_id, Attendance.date == today)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Attendance already marked for today",
        )

    record = Attendance(
        student_id=body.student_id,
        date=today,
        status="present",
        confidence=body.confidence,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return AttendanceResponse(
        id=record.id,
        student_id=record.student_id,
        name=student.user.name,
        roll_number=student.roll_number,
        date=record.date,
        status=record.status,
        confidence=record.confidence,
        recognized_at=record.recognized_at,
    )


@router.get("/today", response_model=list[AttendanceResponse])
def get_today(
    db: Session = Depends(get_db),
    _: UserRole = Depends(require_role(UserRole.ADMIN, UserRole.TEACHER)),
):
    records = (
        db.query(Attendance)
        .filter(Attendance.date == date.today())
        .order_by(Attendance.recognized_at.desc())
        .all()
    )
    return [
        AttendanceResponse(
            id=r.id,
            student_id=r.student_id,
            name=r.student.user.name,
            roll_number=r.student.roll_number,
            date=r.date,
            status=r.status,
            confidence=r.confidence,
            recognized_at=r.recognized_at,
        )
        for r in records
    ]


@router.get("/history", response_model=list[AttendanceResponse])
def get_history(
    student_id: int | None = Query(None),
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db),
    _: UserRole = Depends(require_role(UserRole.ADMIN, UserRole.TEACHER)),
):
    q = db.query(Attendance)
    if student_id:
        q = q.filter(Attendance.student_id == student_id)
    records = q.order_by(Attendance.recognized_at.desc()).limit(limit).all()
    return [
        AttendanceResponse(
            id=r.id,
            student_id=r.student_id,
            name=r.student.user.name,
            roll_number=r.student.roll_number,
            date=r.date,
            status=r.status,
            confidence=r.confidence,
            recognized_at=r.recognized_at,
        )
        for r in records
    ]


@router.get("/stats", response_model=AttendanceStats)
def get_attendance_stats(
    db: Session = Depends(get_db),
    _: UserRole = Depends(require_role(UserRole.ADMIN, UserRole.TEACHER)),
):
    total_students = db.query(Student).count()
    total_records = db.query(Attendance).count()
    today_present = (
        db.query(Attendance)
        .filter(Attendance.date == date.today(), Attendance.status == "present")
        .count()
    )
    today_absent = total_students - today_present if total_students else 0

    thirty_days = date.today() - timedelta(days=29)
    daily_rows = (
        db.query(Attendance.date, func.count(Attendance.id))
        .filter(Attendance.date >= thirty_days)
        .group_by(Attendance.date)
        .order_by(Attendance.date)
        .all()
    )
    daily_map = {r[0]: r[1] for r in daily_rows}
    daily = []
    for i in range(30):
        d = thirty_days + timedelta(days=i)
        daily.append(
            DailyStats(date=d, present=daily_map.get(d, 0), total=total_students)
        )

    return AttendanceStats(
        total_students=total_students,
        total_records=total_records,
        today_present=today_present,
        today_absent=today_absent,
        daily=daily,
    )


@router.get("/my", response_model=list[AttendanceResponse])
def get_my_attendance(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        return []

    records = (
        db.query(Attendance)
        .filter(Attendance.student_id == student.id)
        .order_by(Attendance.recognized_at.desc())
        .all()
    )
    return [
        AttendanceResponse(
            id=r.id,
            student_id=r.student_id,
            name=r.student.user.name,
            roll_number=r.student.roll_number,
            date=r.date,
            status=r.status,
            confidence=r.confidence,
            recognized_at=r.recognized_at,
        )
        for r in records
    ]
