"""
Prediction module for the Olist negative review model.
Loads the trained model and makes predictions.
"""

import os

import joblib
import numpy as np
import pandas as pd

from olist_review_model import TRAINED_MODEL_DIR
from olist_review_model.pipeline import load_config
from olist_review_model.processing.validation import DataInputSchema, MultipleDataInputs


def load_model():
    config = load_config()
    model_path = os.path.join(TRAINED_MODEL_DIR, config["trained_model_file"])
    return joblib.load(model_path)


def make_prediction(input_data: dict) -> dict:
    """
    Make a prediction for a single input.

    Parameters
    ----------
    input_data : dict
        Dictionary with the 16 feature values.

    Returns
    -------
    dict with keys: is_negative (bool), probability (float), version (str)
    """
    validated = DataInputSchema(**input_data)
    df = pd.DataFrame([validated.model_dump()])
    return _predict(df)


def make_multiple_predictions(inputs: list[dict]) -> dict:
    """
    Make predictions for multiple inputs.

    Parameters
    ----------
    inputs : list of dict
        List of dictionaries, each with the 16 feature values.

    Returns
    -------
    dict with keys: predictions (list), version (str)
    """
    validated = MultipleDataInputs(inputs=[DataInputSchema(**inp) for inp in inputs])
    df = validated.to_dataframe()
    return _predict_multiple(df)


def _predict(df: pd.DataFrame) -> dict:
    """Internal: predict a single row."""
    from olist_review_model import __version__

    model = load_model()
    config = load_config()
    features = config["features"]

    proba = model.predict_proba(df[features])[:, 1][0]
    prediction = int(proba >= 0.5)

    return {
        "is_negative": bool(prediction),
        "probability": float(np.round(proba, 4)),
        "version": __version__,
    }


def make_prediction_with_shap(input_data: dict) -> dict:
    """
    Make a prediction with SHAP feature contributions for a single input.

    Returns
    -------
    dict with keys:
        is_negative (bool), probability (float), version (str),
        shap_contributions (list of {feature, shap_value}), sorted by |shap_value| desc
    """
    import shap
    from olist_review_model import __version__

    validated = DataInputSchema(**input_data)
    df = pd.DataFrame([validated.model_dump()])

    model = load_model()
    config = load_config()
    features = config["features"]

    X = df[features]
    proba = model.predict_proba(X)[:, 1][0]
    prediction = int(proba >= 0.5)

    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X)

    contributions = [
        {"feature": feat, "shap_value": float(np.round(val, 4))}
        for feat, val in zip(features, shap_values[0])
    ]
    contributions.sort(key=lambda x: abs(x["shap_value"]), reverse=True)

    return {
        "is_negative": bool(prediction),
        "probability": float(np.round(proba, 4)),
        "version": __version__,
        "shap_contributions": contributions,
    }


def _predict_multiple(df: pd.DataFrame) -> dict:
    """Internal: predict multiple rows."""
    from olist_review_model import __version__

    model = load_model()
    config = load_config()
    features = config["features"]

    probas = model.predict_proba(df[features])[:, 1]
    predictions = (probas >= 0.5).astype(int)

    return {
        "predictions": [
            {
                "is_negative": bool(pred),
                "probability": float(np.round(prob, 4)),
            }
            for pred, prob in zip(predictions, probas)
        ],
        "version": __version__,
    }
