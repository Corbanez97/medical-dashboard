from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator

class Settings(BaseSettings):
    """Application settings loaded from environment variables or .env file."""
    
    DATABASE_URL: str 
    # SECRET_KEY: str 
    LOG_LEVEL: str = "INFO"

    # AWS / OCR Settings
    OCR_BUCKET: str | None = None
    AWS_ACCESS_KEY_ID: str | None = None
    AWS_SECRET_ACCESS_KEY: str | None = None
    AWS_REGION: str = "us-east-1"

    model_config = SettingsConfigDict(env_file=".env")

    @field_validator("DATABASE_URL")
    @classmethod
    def assemble_db_connection(cls, v: str) -> str:
        if v.startswith("sqlite://") and not v.startswith("sqlite+aiosqlite://"):
            return v.replace("sqlite://", "sqlite+aiosqlite://")
        
        # Asyncpg requires postgresql+asyncpg://
        if v.startswith("postgres://"):
            v = v.replace("postgres://", "postgresql+asyncpg://")
        elif v.startswith("postgresql://") and not v.startswith("postgresql+asyncpg://"):
             v = v.replace("postgresql://", "postgresql+asyncpg://")
        
        # Asyncpg doesn't support sslmode in query params, it handles it differently
        if "sslmode=" in v:
            v = v.split("?")[0]

        return v

settings = Settings()
