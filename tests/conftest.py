"""
Shared pytest fixtures for all tests.

Scope notes:
- app / client: module-scoped (one instance per test file) for speed.
  Upgrade to function-scoped if tests start sharing state.
"""

import pytest

from app import create_app


@pytest.fixture(scope="module")
def app():
    """
    Create a test application instance using in-memory SQLite.

    Returns:
        Flask application configured for testing.
    """
    application = create_app("testing")
    return application


@pytest.fixture(scope="module")
def client(app):
    """
    Create a test client bound to the test application.

    Args:
        app: Test Flask application (from app fixture).

    Returns:
        Flask test client.
    """
    return app.test_client()
