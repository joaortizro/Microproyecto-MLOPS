"""
Application configuration classes.

Supports three environments: development, production, testing.
Production validates that required env vars are set at startup.
"""

import logging
import os

logger = logging.getLogger(__name__)


class Config:
    """Base configuration shared across all environments."""

    SECRET_KEY: str = os.environ.get("SECRET_KEY", "dev-secret-change-in-production")
    SQLALCHEMY_TRACK_MODIFICATIONS: bool = False
    API_VERSION: str = "1.0.0"
    CORS_ORIGINS: list[str] = os.environ.get(
        "CORS_ORIGINS", "http://localhost:3000"
    ).split(",")

    @classmethod
    def validate(cls) -> None:
        """Validate that required config values are present."""
        pass


class DevelopmentConfig(Config):
    """Development configuration — SQLite, debug on."""

    DEBUG: bool = True
    TESTING: bool = False
    SQLALCHEMY_DATABASE_URI: str = os.environ.get(
        "DATABASE_URL", "sqlite:///olist_dev.db"
    )


class ProductionConfig(Config):
    """Production configuration — requires DATABASE_URL and SECRET_KEY env vars."""

    DEBUG: bool = False
    TESTING: bool = False
    SQLALCHEMY_DATABASE_URI: str = os.environ.get("DATABASE_URL", "")

    @classmethod
    def validate(cls) -> None:
        """Raise EnvironmentError if required production secrets are missing."""
        missing: list[str] = []
        if not os.environ.get("DATABASE_URL"):
            missing.append("DATABASE_URL")
        if not os.environ.get("SECRET_KEY"):
            missing.append("SECRET_KEY")
        if missing:
            raise EnvironmentError(
                f"Missing required environment variables: {', '.join(missing)}"
            )


class TestingConfig(Config):
    """Testing configuration — in-memory SQLite, CSRF disabled."""

    TESTING: bool = True
    DEBUG: bool = True
    SQLALCHEMY_DATABASE_URI: str = "sqlite:///:memory:"
    WTF_CSRF_ENABLED: bool = False


_CONFIG_MAP: dict[str, type[Config]] = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "testing": TestingConfig,
}


def get_config(env: str = "development") -> type[Config]:
    """
    Return the configuration class for the given environment name.

    Args:
        env: One of 'development', 'production', 'testing'.

    Returns:
        A Config subclass (not an instance).

    Example:
        >>> cfg = get_config("testing")
        >>> cfg.TESTING
        True
    """
    config = _CONFIG_MAP.get(env)
    if config is None:
        logger.warning(
            "Unknown environment requested, defaulting to development",
            extra={"requested_env": env},
        )
        return DevelopmentConfig
    return config
