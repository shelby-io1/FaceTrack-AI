from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routes import attendance, auth, enrollment, health, neon_auth, recognition, students

app = FastAPI(title=settings.PROJECT_NAME, version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(auth.router, prefix="/api", tags=["auth"])
app.include_router(students.router, prefix="/api", tags=["students"])
app.include_router(enrollment.router, prefix="/api", tags=["enrollment"])
app.include_router(recognition.router, prefix="/api", tags=["recognition"])
app.include_router(attendance.router, prefix="/api", tags=["attendance"])
app.include_router(neon_auth.router, prefix="/api", tags=["neon-auth"])
