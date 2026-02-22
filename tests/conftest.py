"""
Shared pytest fixtures for all tests.

Uses FastAPI TestClient backed by httpx.
"""

from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from app.main import create_app

# Stable fake response returned by the mocked model during API tests.
# Keeps tests independent of trained model artifacts and the model package.
_MOCK_SHAP_RESULT = {
    "is_negative": True,
    "probability": 0.83,
    "version": "0.1.0",
    "shap_contributions": [
        {"feature": "delivery_delta_days",         "shap_value":  0.42},
        {"feature": "freight_value",               "shap_value":  0.18},
        {"feature": "carrier_transit_days",        "shap_value":  0.09},
        {"feature": "price",                       "shap_value": -0.07},
        {"feature": "word_count",                  "shap_value":  0.04},
        {"feature": "seller_dispatch_days",        "shap_value":  0.03},
        {"feature": "distance_seller_customer_km", "shap_value":  0.02},
        {"feature": "payment_value",               "shap_value": -0.02},
        {"feature": "payment_installments",        "shap_value":  0.01},
        {"feature": "product_weight_g",            "shap_value":  0.01},
        {"feature": "product_description_lenght",  "shap_value": -0.01},
        {"feature": "product_photos_qty",          "shap_value":  0.01},
        {"feature": "char_count",                  "shap_value":  0.01},
        {"feature": "exclamation_count",           "shap_value":  0.00},
        {"feature": "question_count",              "shap_value":  0.00},
        {"feature": "avg_word_length",             "shap_value": -0.00},
    ],
}


@pytest.fixture(autouse=True)
def mock_model_predict():
    """Patch the model inference so tests never need a trained model file."""
    with patch(
        "olist_review_model.predict.make_prediction_with_shap",
        return_value=_MOCK_SHAP_RESULT,
    ):
        yield


@pytest.fixture(scope="module")
def app():
    """Create a test application instance."""
    return create_app("testing")


@pytest.fixture(scope="module")
def client(app):
    """Create a test client bound to the test application."""
    return TestClient(app)
