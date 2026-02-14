"""
Flask application factory.

Usage:
    from app import create_app
    app = create_app("development")
"""

import logging
import os

from flask import Flask

from app.config import get_config
from app.extensions import cors, db

logger = logging.getLogger(__name__)


def create_app(config_name: str | None = None) -> Flask:
    """
    Create and configure the Flask application.

    Args:
        config_name: Environment name ('development', 'production', 'testing').
                     Falls back to FLASK_ENV env var, then 'development'.

    Returns:
        Configured Flask application instance.

    Raises:
        EnvironmentError: If production config is missing required env vars.
    """
    app = Flask(__name__)

    env = config_name or os.environ.get("FLASK_ENV", "development")
    config_class = get_config(env)
    config_class.validate()
    app.config.from_object(config_class)

    _configure_logging(app)
    _init_extensions(app)
    _register_blueprints(app)

    logger.info("Application started", extra={"environment": env})
    return app


def _configure_logging(app: Flask) -> None:
    """Set log level based on debug flag."""
    log_level = logging.DEBUG if app.debug else logging.INFO
    logging.basicConfig(
        level=log_level,
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )


def _init_extensions(app: Flask) -> None:
    """Bind extensions to the app instance."""
    db.init_app(app)
    cors.init_app(
        app,
        resources={r"/*": {"origins": app.config.get("CORS_ORIGINS", [])}},
    )


def _register_blueprints(app: Flask) -> None:
    """Register all application blueprints."""
    from app.blueprints.health import health_bp

    app.register_blueprint(health_bp)
