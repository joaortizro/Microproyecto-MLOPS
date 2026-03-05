import os
from importlib.metadata import version, PackageNotFoundError

PACKAGE_ROOT = os.path.dirname(__file__)
TRAINED_MODEL_DIR = os.path.join(PACKAGE_ROOT, "trained_models")
CONFIG_DIR = os.path.join(PACKAGE_ROOT, "config")

try:
    __version__ = version("olist_review_model")
except PackageNotFoundError:
    __version__ = "unknown"
