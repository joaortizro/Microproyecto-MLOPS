"""Analyze endpoints — prediction and analysis of order satisfaction."""

from fastapi import APIRouter

from app.schemas.base import ApiResponse
from app.schemas.predict import (
    HybridInput,
    PredictionDataSchema,
    ReasonSchema,
)

router = APIRouter(prefix="/analyze", tags=["Analyze"])


@router.post("/hybrid", response_model=ApiResponse)
def analyze_hybrid(input_data: HybridInput) -> ApiResponse:
    """
    Predict customer satisfaction from order data + review text.

    Stub implementation — returns dummy prediction until model integration.
    """
    review_text = input_data.review.text.lower()

    negative_probability = 0.3
    sentiment = "positive"
    score = 4

    if "delay" in review_text or "demorou" in review_text:
        negative_probability += 0.3

    if "damaged" in review_text or "danificada" in review_text:
        negative_probability += 0.3

    if negative_probability > 0.6:
        sentiment = "negative"
        score = 2

    shipping_cost = 0.0
    if input_data.financials:
        shipping_cost = input_data.financials.shipping_cost or 0.0

    reasons = [
        ReasonSchema(factor="delivery_delay", value=4, impact="high"),
        ReasonSchema(factor="freight_cost", value=shipping_cost, impact="medium"),
        ReasonSchema(factor="review_text", value=review_text[:40], impact="medium"),
    ]

    prediction = PredictionDataSchema(
        predicted_score=score,
        negative_probability=round(negative_probability, 2),
        sentiment=sentiment,
        reasons=reasons,
    )

    return ApiResponse(data=prediction.model_dump())
