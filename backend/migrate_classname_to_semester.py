from sqlalchemy import create_engine, text
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)
with engine.connect() as conn:
    conn.execute(text("ALTER TABLE students RENAME COLUMN class_name TO semester"))
    conn.commit()
    print("Renamed class_name -> semester in students table")
