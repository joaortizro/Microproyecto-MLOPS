"""
Application configuration using pydantic-settings.

Supports three environments: development, production, testing.
Production validates that required env vars are set at startup.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # General
    PROJECT_NAME: str = "E-commerce Customer Satisfaction API"
    API_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"  # development | production | testing

    # Security
    SECRET_KEY: str = "dev-secret-change-in-production"

    # Database
    DATABASE_URL: str = "sqlite:///olist_dev.db"

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = False

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

    @property
    def is_testing(self) -> bool:
        return self.ENVIRONMENT == "testing"


class DevelopmentSettings(Settings):
    """Development defaults."""

    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    DATABASE_URL: str = "sqlite:///olist_dev.db"


class ProductionSettings(Settings):
    """Production — validates required env vars."""

    ENVIRONMENT: str = "production"
    DEBUG: bool = False

    def model_post_init(self, __context: object) -> None:
        missing: list[str] = []
        if self.DATABASE_URL.startswith("sqlite"):
            missing.append("DATABASE_URL")
        if self.SECRET_KEY == "dev-secret-change-in-production":
            missing.append("SECRET_KEY")
        if missing:
            raise EnvironmentError(
                f"Missing required environment variables: {', '.join(missing)}"
            )


class TestingSettings(Settings):
    """Testing — in-memory SQLite."""

    ENVIRONMENT: str = "testing"
    DEBUG: bool = True
    DATABASE_URL: str = "sqlite:///test.db"


_SETTINGS_MAP: dict[str, type[Settings]] = {
    "development": DevelopmentSettings,
    "production": ProductionSettings,
    "testing": TestingSettings,
}


@lru_cache
def get_settings(env: str = "development") -> Settings:
    """Return a cached Settings instance for the given environment."""
    settings_class = _SETTINGS_MAP.get(env, DevelopmentSettings)
    return settings_class()
