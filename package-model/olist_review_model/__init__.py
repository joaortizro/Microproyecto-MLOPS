import os

PACKAGE_ROOT = os.path.dirname(__file__)
TRAINED_MODEL_DIR = os.path.join(PACKAGE_ROOT, "trained_models")
CONFIG_DIR = os.path.join(PACKAGE_ROOT, "config")

with open(os.path.join(os.path.dirname(PACKAGE_ROOT), "VERSION")) as f:
    __version__ = f.read().strip()
