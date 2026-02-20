from setuptools import setup, find_packages

with open("VERSION") as f:
    version = f.read().strip()

with open("requirements/requirements.txt") as f:
    install_requires = [line.strip() for line in f if line.strip() and not line.startswith("#")]

setup(
    name="olist_review_model",
    version=version,
    description="XGBoost model for Olist negative review prediction",
    author="Equipo MLOps",
    packages=find_packages(exclude=["tests"]),
    package_data={"olist_review_model": ["config/*.yml", "trained_models/*"]},
    install_requires=install_requires,
    python_requires=">=3.10",
)
