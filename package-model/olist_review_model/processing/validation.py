"""
Input data validation schemas for the Olist negative review model.
"""

from typing import List, Optional

import pandas as pd
from pydantic import BaseModel


class DataInputSchema(BaseModel):
    """Schema for a single prediction input."""
    delivery_delta_days: float
    seller_dispatch_days: float
    carrier_transit_days: float
    distance_seller_customer_km: float
    price: float
    freight_value: float
    payment_value: float
    payment_installments: float
    product_weight_g: float
    product_description_lenght: float
    product_photos_qty: float
    char_count: float
    word_count: float
    exclamation_count: float
    question_count: float
    avg_word_length: float


class MultipleDataInputs(BaseModel):
    """Schema for multiple prediction inputs."""
    inputs: List[DataInputSchema]

    def to_dataframe(self) -> pd.DataFrame:
        return pd.DataFrame([inp.model_dump() for inp in self.inputs])
