"""Base response schemas — standard envelope for all endpoints."""

from datetime import datetime, timezone
from typing import Any

from pydantic import BaseModel, Field


class ApiResponse(BaseModel):
    """Standard API response envelope."""

    data: Any
    status: str = "ok"
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )


class ErrorResponse(BaseModel):
    """Standard error response."""

    data: None = None
    status: str = "error"
    message: str
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
