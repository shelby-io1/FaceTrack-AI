from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = ""
    SECRET_KEY: str = ""
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    UPLOAD_DIR: str = "uploads"
    PROJECT_NAME: str = "FaceTrack AI"
    NEON_AUTH_SHARED_SECRET: str = ""
    NEON_AUTH_BASE_URL: str = ""

    model_config = {"env_file": ".env", "case_sensitive": True}

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.DATABASE_URL:
            raise ValueError("DATABASE_URL must be set via .env or environment variable")
        if not self.SECRET_KEY:
            raise ValueError("SECRET_KEY must be set via .env or environment variable")


settings = Settings()
