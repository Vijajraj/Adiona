from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables / .env file."""

    DATABASE_URL: str = "sqlite+aiosqlite:///./safety_map.db"
    FRONTEND_URL: str = "http://localhost:5173"

    # Rate-limit constants (spec §11)
    MAX_REPORTS_PER_DEVICE_PER_DAY: int = 5
    MAX_REPORTS_PER_IP_PER_DAY: int = 7
    GRID_CELL_COOLDOWN_HOURS: int = 24

    # Note field
    NOTE_MAX_LENGTH: int = 240

    # Moderation Admin Secret Key (Spec §10)
    ADMIN_SECRET: str = "chennai-safety-admin-key"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
