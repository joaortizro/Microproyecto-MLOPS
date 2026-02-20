"""
FastAPI application entry point.

Based on the initial work by the team in backend/ecomerce-sentiments-api/app/main.py,
refactored to align with the project's architecture conventions.
"""

import logging
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings

logger = logging.getLogger(__name__)


def create_app(env: str | None = None) -> FastAPI:
    """
    Create and configure the FastAPI application.

    Args:
        env: Environment name ('development', 'production', 'testing').
             Falls back to ENVIRONMENT env var, then 'development'.

    Returns:
        Configured FastAPI application instance.
    """
    environment = env or os.environ.get("ENVIRONMENT", "development")
    settings = get_settings(environment)

    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.API_VERSION,
        description="""
## Overview
REST API for predicting and analyzing customer satisfaction in e-commerce orders.
Given order data — delivery times, shipping costs, geography, and review text —
the model identifies the key drivers behind negative reviews (1–2 stars).

## Dataset
Powered by the [Olist Brazilian E-Commerce dataset](https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce),
a real-world dataset of 100k orders from 2016–2018.

## Response Format
All endpoints return a standard envelope:
```json
{
  "data": {},
  "status": "ok | error",
  "timestamp": "ISO 8601"
}
```
""",
        docs_url="/docs",
        redoc_url="/redoc",
    )

    _configure_logging(settings)
    _add_middleware(app, settings)
    _register_routers(app)

    logger.info("Application started", extra={"environment": environment})
    return app


def _configure_logging(settings: object) -> None:
    """Set log level based on debug flag."""
    log_level = logging.DEBUG if getattr(settings, "DEBUG", False) else logging.INFO
    logging.basicConfig(
        level=log_level,
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )


def _add_middleware(app: FastAPI, settings: object) -> None:
    """Add CORS middleware."""
    app.add_middleware(
        CORSMiddleware,
        allow_origins=getattr(settings, "CORS_ORIGINS", ["*"]),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


def _register_routers(app: FastAPI) -> None:
    """Register all application routers."""
    from app.routers.analyze import router as analyze_router

    app.include_router(analyze_router)


app = create_app()
