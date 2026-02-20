import json
from typing import Any

import numpy as np
import pandas as pd
from fastapi import APIRouter, HTTPException
from fastapi.encoders import jsonable_encoder
from loguru import logger
#from retention_model import __version__ as model_version
#from retention_model.predict import predict as predict2

from app import __version__, schemas
from app.config import settings

from datetime import datetime



api_router = APIRouter()

# Ruta para verificar que la API se esté ejecutando correctamente
@api_router.get("/health", response_model=schemas.Health, status_code=200)
def health() -> dict:
    """
    Root Get
    """
    health = schemas.Health(
        name=settings.PROJECT_NAME, api_version=__version__, model_version=model_version
    )

    return health.dict()

# Ruta para realizar las predicciones
@api_router.post("/predict", response_model=schemas.PredictionResults, status_code=200)
async def predict(input_data: schemas.MultipleDataInputs) -> Any:
    """
    Prediccion usando el modelo de bankchurn
    """
    print("Hello...")
    #input_df = pd.DataFrame(jsonable_encoder(input_data.inputs))
    input_df = pd.DataFrame([jsonable_encoder(input_data)])

    

    #logger.info(f"Making prediction on inputs: {jsonable_encoder(input_data)}")
    results = make_prediction(input_data=input_df.replace({np.nan: None}))
    #features = input_df.replace({np.nan: None}).to_dict(orient="records")[0]
    #results = predict2(features)
    logger.info(results)
    # if results["errors"] is not None:
    #     logger.warning(f"Prediction validation error: {results.get('errors')}")
    #     raise HTTPException(status_code=400, detail=json.loads(results["errors"]))

    logger.info(f"Prediction results: {results.get('predictions')}")

    return results
#@router.post("/predict", response_model=PredictionResponse)
# def predict(input_data: schemas.MultipleDataInputs):

#     result = make_prediction(input_data)

#     return result #PredictionResponse(**result)


# from datetime import datetime

def make_prediction(input_data):
        return {
        "data": {
            "predicted_score": 2,
            "negative_probability": 0.81,
            "sentiment": "negative",
            "reasons": [
                {"factor": "delivery_delay", "value": 4, "impact": "high"},
                {"factor": "freight_cost", "value": 24.5, "impact": "medium"},
                {"factor": "review_text", "value": "damaged packaging", "impact": "medium"},
            ]
        },
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat()
    }






