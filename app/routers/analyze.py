"""Analyze endpoints — prediction and analysis of order satisfaction."""

from datetime import datetime

from fastapi import APIRouter

from app.schemas.base import ApiResponse
from app.schemas.predict import (
    HybridInput,
    PredictionDataSchema,
    ReasonSchema,
)

router = APIRouter(prefix="/analyze", tags=["Analyze"])

FEATURE_DESCRIPTIONS: dict[str, str] = {
    # Logístico
    "delivery_delta_days":          "Days between promised and actual delivery date (positive = late, negative = early)",
    "seller_dispatch_days":         "Days the seller took to hand the order to the carrier after purchase",
    "carrier_transit_days":         "Days the carrier took to deliver after receiving the package",
    "distance_seller_customer_km":  "Straight-line distance between seller and customer in kilometres",
    # Financiero
    "price":                        "Product price in BRL (order total minus shipping cost)",
    "freight_value":                "Shipping cost paid by the customer in BRL",
    "payment_value":                "Total order value paid in BRL",
    "payment_installments":         "Number of payment instalments chosen by the customer",
    # Producto
    "product_weight_g":             "Product weight in grams",
    "product_description_lenght":   "Number of characters in the product description",
    "product_photos_qty":           "Number of photos in the product listing",
    # Texto de reseña
    "char_count":                   "Total number of characters written in the review",
    "word_count":                   "Total number of words written in the review",
    "exclamation_count":            "Number of exclamation marks in the review text",
    "question_count":               "Number of question marks in the review text",
    "avg_word_length":              "Average word length in the review (longer words may signal more formal complaints)",
}


def _impact_label(shap_val: float, max_abs: float) -> str:
    """Map a SHAP value to a human-readable impact level."""
    ratio = abs(shap_val) / max_abs if max_abs > 0 else 0
    if ratio >= 0.5:
        return "high"
    if ratio >= 0.2:
        return "medium"
    return "low"


def _build_features(data: HybridInput) -> dict:
    """Map HybridInput fields to the 16 model feature values.

    Optional fields fall back to training-time medians (loaded from
    feature_medians.json) so imputation matches what the model was trained on.
    """
    from olist_review_model.pipeline import load_feature_medians

    m = load_feature_medians()

    def median(key: str, fallback: float = 0.0) -> float:
        return m.get(key, fallback)

    purchase = datetime.fromisoformat(data.delivery.purchase_date)
    promised = datetime.fromisoformat(data.delivery.promised_date)
    dispatched = datetime.fromisoformat(data.delivery.dispatched_date) if data.delivery.dispatched_date else purchase
    delivered = datetime.fromisoformat(data.delivery.delivered_date) if data.delivery.delivered_date else promised

    delivery_delta_days = (delivered - promised).days
    seller_dispatch_days = (dispatched - purchase).days
    carrier_transit_days = (delivered - dispatched).days

    text = data.review.text
    words = text.split()
    avg_word_len = sum(len(w) for w in words) / len(words) if words else 0.0

    return {
        "delivery_delta_days": delivery_delta_days,
        "seller_dispatch_days": seller_dispatch_days,
        "carrier_transit_days": carrier_transit_days,
        "distance_seller_customer_km": data.location.distance_km if data.location and data.location.distance_km is not None else median("distance_seller_customer_km"),
        "price": max(data.financials.order_total - data.financials.shipping_cost, 0.0) if data.financials else median("price"),
        "freight_value": data.financials.shipping_cost if data.financials else median("freight_value"),
        "payment_value": data.financials.order_total if data.financials else median("payment_value"),
        "payment_installments": data.financials.payment_installments if data.financials and data.financials.payment_installments else median("payment_installments", 1.0),
        "product_weight_g": data.item.weight_g if data.item and data.item.weight_g is not None else median("product_weight_g"),
        "product_description_lenght": data.item.description_length if data.item and data.item.description_length is not None else median("product_description_lenght"),
        "product_photos_qty": data.item.media_count if data.item and data.item.media_count is not None else median("product_photos_qty"),
        "char_count": len(text),
        "word_count": len(words),
        "exclamation_count": text.count("!"),
        "question_count": text.count("?"),
        "avg_word_length": round(avg_word_len, 4),
    }


@router.post("/hybrid", response_model=ApiResponse)
def analyze_hybrid(input_data: HybridInput) -> ApiResponse:
    """
    Predict customer satisfaction from order data + review text.
    Returns prediction probability and all SHAP feature contributions as reasons, sorted by absolute impact.
    """
    from olist_review_model.predict import make_prediction_with_shap

    features = _build_features(input_data)
    result = make_prediction_with_shap(features)

    contributions = result["shap_contributions"]
    total_abs = sum(abs(c["shap_value"]) for c in contributions) or 1.0
    max_abs = max(abs(c["shap_value"]) for c in contributions) if contributions else 1.0

    reasons = [
        ReasonSchema(
            factor=c["feature"],
            description=FEATURE_DESCRIPTIONS.get(c["feature"], c["feature"]),
            value=round(c["shap_value"] / total_abs * 100, 1),  # signed % of total explanation
            impact=_impact_label(c["shap_value"], max_abs),
        )
        for c in contributions
    ]

    prediction = PredictionDataSchema(
        predicted_score=1 if result["is_negative"] else 5,
        negative_probability=result["probability"],
        sentiment="negative" if result["is_negative"] else "positive",
        reasons=reasons,
    )

    return ApiResponse(data=prediction.model_dump())
