"""
Prediction schemas for /analyze/* endpoints.

Based on initial work in backend/ecomerce-sentiments-api/app/schemas/predict.py,
refactored with optional fields and distance_km instead of lat/lng.
"""

from typing import Optional

from pydantic import BaseModel, model_validator


# =========================
# INPUT SCHEMAS
# =========================

class DeliverySchema(BaseModel):
    purchase_date: str
    promised_date: str
    dispatched_date: Optional[str] = None
    delivered_date: Optional[str] = None


class FinancialsSchema(BaseModel):
    order_total: Optional[float] = None
    shipping_cost: Optional[float] = None
    payment_installments: Optional[int] = None
    currency: str = "BRL"

    @model_validator(mode="after")
    def both_or_neither(self) -> "FinancialsSchema":
        has_total = self.order_total is not None
        has_shipping = self.shipping_cost is not None
        if has_total != has_shipping:
            raise ValueError("order_total and shipping_cost must both be present or both absent")
        return self


class LocationSchema(BaseModel):
    distance_km: Optional[float] = None


class ItemSchema(BaseModel):
    category: Optional[str] = None
    weight_g: Optional[float] = None
    description_length: Optional[int] = None
    media_count: Optional[int] = None


class ReviewSchema(BaseModel):
    text: str


class HybridInput(BaseModel):
    delivery: DeliverySchema
    financials: Optional[FinancialsSchema] = None
    location: Optional[LocationSchema] = None
    item: Optional[ItemSchema] = None
    review: ReviewSchema


# =========================
# OUTPUT SCHEMAS
# =========================

class ReasonSchema(BaseModel):
    factor: str
    description: str
    value: str | float | int
    impact: str


class PredictionDataSchema(BaseModel):
    predicted_score: int
    negative_probability: float
    sentiment: str
    reasons: list[ReasonSchema]
