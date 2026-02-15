from typing import List, Optional
from datetime import datetime, timezone

from pydantic import BaseModel


# =========================
# INPUT SCHEMAS
# =========================

class ContextSchema(BaseModel):
    country_code: str


class DeliverySchema(BaseModel):
    purchase_date: str
    dispatched_date: str
    delivered_date: str
    promised_date: str


class FinancialsSchema(BaseModel):
    order_total: float
    shipping_cost: float
    payment_installments: int
    currency: str


class LocationSchema(BaseModel):
    origin_lat: float
    origin_lng: float
    destination_lat: float
    destination_lng: float


class ItemSchema(BaseModel):
    category: str
    weight_g: float
    description_length: int
    media_count: int


class ReviewSchema(BaseModel):
    text: str


class HybridInput(BaseModel):
    context: ContextSchema
    delivery: DeliverySchema
    financials: FinancialsSchema
    location: LocationSchema
    item: ItemSchema
    review: ReviewSchema


# =========================
# OUTPUT SCHEMAS
# =========================

class ReasonSchema(BaseModel):
    factor: str
    value: str | float | int
    impact: str


class PredictionDataSchema(BaseModel):
    predicted_score: int
    negative_probability: float
    sentiment: str
    reasons: List[ReasonSchema]


# class PredictionResponse(BaseModel):
#     data: PredictionDataSchema
#     status: str
#     timestamp: str
class PredictionResponse(BaseModel):
    data: PredictionDataSchema
    status: str
    timestamp: str
#    version: str
#    predictions: List[float]



# =========================
# PREDICT FUNCTION (DUMMY)
# =========================

def make_prediction(input_data: HybridInput) -> PredictionResponse:
    """
    Dummy prediction hasta tener modelo real
    """

    review_text = input_data.review.text.lower()

    # ---- Lógica dummy simple ----
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

    # ---- Reasons dummy ----
    reasons = [
        ReasonSchema(
            factor="delivery_delay",
            value=4,
            impact="high"
        ),
        ReasonSchema(
            factor="freight_cost",
            value=input_data.financials.shipping_cost,
            impact="medium"
        ),
        ReasonSchema(
            factor="review_text",
            value=review_text[:40],
            impact="medium"
        )
    ]

    prediction_data = PredictionDataSchema(
        predicted_score=score,
        negative_probability=round(negative_probability, 2),
        sentiment=sentiment,
        reasons=reasons
    )

    return PredictionResponse(
        data=prediction_data,
        status="ok",
        timestamp=datetime.now(timezone.utc).isoformat()
    )
 
MultipleDataInputs = HybridInput
PredictionResults = PredictionResponse
