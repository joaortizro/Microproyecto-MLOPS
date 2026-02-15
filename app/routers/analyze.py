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
def analyze_hybrid(input_data: HybridInput) -> ApiResponse:  # noqa: ARG001
    """
    Predict customer satisfaction from order data + review text.

    Stub: returns a hardcoded negative prediction. Will be replaced by real model.
    """
    # TODO: replace with real model inference (PR model integration)
    prediction = PredictionDataSchema(
        predicted_score=2,
        negative_probability=0.81,
        sentiment="negative",
        reasons=[
            ReasonSchema(factor="delivery_delay", value=4, impact="high"),
            ReasonSchema(factor="freight_cost", value=24.5, impact="medium"),
            ReasonSchema(factor="review_text", value="stub", impact="medium"),
        ],
    )

    return ApiResponse(data=prediction.model_dump())
