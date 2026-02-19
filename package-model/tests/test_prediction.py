"""
Unit tests for the prediction module.
"""

from olist_review_model.predict import make_prediction, make_multiple_predictions


def test_make_prediction_returns_expected_keys(sample_input):
    """Test that make_prediction returns the expected keys."""
    result = make_prediction(sample_input)
    assert "is_negative" in result
    assert "probability" in result
    assert "version" in result


def test_make_prediction_types(sample_input):
    """Test that prediction values have the correct types."""
    result = make_prediction(sample_input)
    assert isinstance(result["is_negative"], bool)
    assert isinstance(result["probability"], float)
    assert isinstance(result["version"], str)


def test_make_prediction_probability_range(sample_input):
    """Test that probability is between 0 and 1."""
    result = make_prediction(sample_input)
    assert 0.0 <= result["probability"] <= 1.0


def test_make_multiple_predictions(sample_input):
    """Test that multiple predictions work."""
    result = make_multiple_predictions([sample_input, sample_input])
    assert "predictions" in result
    assert len(result["predictions"]) == 2
    for pred in result["predictions"]:
        assert "is_negative" in pred
        assert "probability" in pred


def test_config_features_count(config):
    """Test that config has the expected 16 features."""
    assert len(config["features"]) == 16
