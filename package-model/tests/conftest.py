"""
Test fixtures for the Olist review model package.
"""

import pytest

from olist_review_model.pipeline import load_config


@pytest.fixture
def sample_input():
    """A sample input representing a typical order."""
    return {
        "delivery_delta_days": 5.0,
        "seller_dispatch_days": 2.0,
        "carrier_transit_days": 8.0,
        "distance_seller_customer_km": 350.0,
        "price": 120.0,
        "freight_value": 25.0,
        "payment_value": 145.0,
        "payment_installments": 3.0,
        "product_weight_g": 500.0,
        "product_description_lenght": 200.0,
        "product_photos_qty": 3.0,
        "char_count": 50.0,
        "word_count": 10.0,
        "exclamation_count": 0.0,
        "question_count": 0.0,
        "avg_word_length": 5.0,
    }


@pytest.fixture
def config():
    """Load model config."""
    return load_config()
