"""
Application entry point for local development.

Production: use gunicorn — `gunicorn "app:create_app()" --bind 0.0.0.0:8000`
"""

import os

from app import create_app

app = create_app(os.environ.get("FLASK_ENV", "development"))

if __name__ == "__main__":
    app.run(
        host=os.environ.get("FLASK_HOST", "0.0.0.0"),
        port=int(os.environ.get("FLASK_PORT", "5000")),
        debug=app.debug,
    )
