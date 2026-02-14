"""
Flask extension instances.

Initialized here without app binding; bound in create_app() via init_app().
Import these anywhere you need db access or CORS handling.
"""

from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy

db: SQLAlchemy = SQLAlchemy()
cors: CORS = CORS()
