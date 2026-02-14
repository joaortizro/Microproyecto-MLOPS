"""
Health blueprint — liveness and model info endpoints.

Endpoints:
    GET /health      — API liveness check
    GET /model/info  — Model metadata (stub until PR-10)
"""

import logging
from typing import Any

from flask import Blueprint, current_app

from app.utils.responses import error_response, success_response

logger = logging.getLogger(__name__)

health_bp = Blueprint("health", __name__)


@health_bp.route("/health", methods=["GET"])
def health_check() -> tuple[Any, int]:
    """
    API liveness check.

    Returns:
        200 with health payload, or 500 if the app is misconfigured.

    Example:
        >>> GET /health
        {"data": {"status": "healthy", "version": "1.0.0", ...}, "status": "ok", ...}
    """
    try:
        payload = {
            "status": "healthy",
            "version": current_app.config.get("API_VERSION", "unknown"),
            "environment": current_app.config.get("ENV", "unknown"),
        }
        logger.info("Health check OK", extra={"version": payload["version"]})
        return success_response(payload)
    except Exception as e:
        logger.error("Health check failed", exc_info=True, extra={"error": str(e)})
        return error_response("Service unavailable", 500)


@health_bp.route("/model/info", methods=["GET"])
def model_info() -> tuple[Any, int]:
    """
    Model metadata endpoint (stub — wired to real model in PR-10).

    Returns:
        200 with model metadata placeholder.

    Example:
        >>> GET /model/info
        {"data": {"model_name": "pending", "status": "not_loaded", ...}, "status": "ok", ...}
    """
    try:
        payload = {
            "model_name": "olist-review-predictor",
            "version": "pending",
            "status": "not_loaded",
            "metrics": {},
            "features": [],
            "note": "Model integration in PR-10",
        }
        logger.info("Model info requested (stub)")
        return success_response(payload)
    except Exception as e:
        logger.error("Model info failed", exc_info=True, extra={"error": str(e)})
        return error_response("Could not retrieve model info", 500)
