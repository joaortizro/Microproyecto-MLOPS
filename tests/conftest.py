"""
Shared pytest fixtures for all tests.

Uses FastAPI TestClient backed by httpx.
"""

import pytest
from fastapi.testclient import TestClient

from app.main import create_app


@pytest.fixture(scope="module")
def app():
    """Create a test application instance."""
    return create_app("testing")


@pytest.fixture(scope="module")
def client(app):
    """Create a test client bound to the test application."""
    return TestClient(app)
