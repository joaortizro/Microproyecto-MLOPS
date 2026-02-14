"""
Standard response envelope helpers.

All API endpoints must use these helpers to ensure a consistent
response shape: {"data": ..., "status": "ok|error", "timestamp": "ISO8601"}.
"""

from datetime import datetime, timezone
from typing import Any

from flask import jsonify
from flask.wrappers import Response


def success_response(data: Any, status_code: int = 200) -> tuple[Response, int]:
    """
    Build a standard success response envelope.

    Args:
        data: Payload to include under the 'data' key.
        status_code: HTTP status code (default 200).

    Returns:
        Tuple of (JSON Response, status_code).

    Example:
        >>> return success_response({"id": 1, "score": 4})
        (Response, 200)
    """
    return (
        jsonify(
            {
                "data": data,
                "status": "ok",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
        ),
        status_code,
    )


def error_response(message: str, status_code: int = 500) -> tuple[Response, int]:
    """
    Build a standard error response envelope.

    Args:
        message: Human-readable error description.
        status_code: HTTP status code (default 500).

    Returns:
        Tuple of (JSON Response, status_code).

    Example:
        >>> return error_response("Order not found", 404)
        (Response, 404)
    """
    return (
        jsonify(
            {
                "data": {"error": message},
                "status": "error",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
        ),
        status_code,
    )
