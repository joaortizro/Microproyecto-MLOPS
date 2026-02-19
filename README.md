# E-commerce Customer Satisfaction API

Predicts and explains negative reviews in e-commerce orders using logistics, economic, and NLP features.

Built on the [Olist Brazilian E-Commerce dataset](https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce) — 100k real orders from 2016–2018.

---

## Setup

```bash
git clone https://github.com/joaortizro/Microproyecto-MLOPS.git
cd Microproyecto-MLOPS

python -m venv env
source env/bin/activate

pip install -r api_requirements.txt
cp .env.example .env
```

## Run

```bash
python run.py
```

| URL | Description |
|-----|-------------|
| `http://localhost:5000/health` | Liveness check |
| `http://localhost:5000/apidocs` | Swagger UI |

## Test

```bash
python -m pytest tests/ -v
```

---

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | API liveness check |
| GET | `/model/info` | Model metadata |
| POST | `/analyze/hybrid` | Order + text — best accuracy |


---

## Example Request

**`POST /analyze/hybrid`**

```json
{
  "context": { "country_code": "BR" },
  "delivery": {
    "purchase_date": "2024-01-01T10:00:00",
    "dispatched_date": "2024-01-03T08:00:00",
    "delivered_date": "2024-01-12T15:30:00",
    "promised_date": "2024-01-08T23:59:59"
  },
  "financials": {
    "order_total": 189.90,
    "shipping_cost": 24.50,
    "payment_installments": 3,
    "currency": "BRL"
  },
  "location": {
    "origin_lat": -23.5505, "origin_lng": -46.6333,
    "destination_lat": -30.0346, "destination_lng": -51.2177
  },
  "item": {
    "category": "electronics",
    "weight_g": 850,
    "description_length": 320,
    "media_count": 2
  },
  "review": {
    "text": "O produto demorou muito para chegar e veio com a embalagem danificada."
  }
}
```

---

## ML Model Training & Packaging

### Quick Start (Model A: Negative Review Classifier)

```bash
cd package-model

# 1. Train the model
tox run -e train

# 2. Run tests
tox run -e test_package

# 3. Build distributable package
pip install build
python -m build
# → dist/olist_review_model-0.1.0.tar.gz
# → dist/olist_review_model-0.1.0-py3-none-any.whl

# 4. Install the package
pip install dist/olist_review_model-0.1.0-py3-none-any.whl
```

### MLflow Experiments

```bash
# Start MLflow server
mlflow server -h 0.0.0.0 -p 5000

# Run experiments with different hyperparameters
cd notebooks
python train_model_a.py 1500 12 0.1
python train_model_a.py 1000 8 0.05

# Compare at http://localhost:5000
```

### Package Structure

```
package-model/
├── olist_review_model/
│   ├── config/config.yml        # Features, hyperparameters
│   ├── pipeline.py              # Feature engineering
│   ├── train_pipeline.py        # Training script
│   ├── predict.py               # Prediction logic
│   ├── processing/validation.py # Input validation schemas
│   └── trained_models/          # Trained model (not in git)
├── tests/                       # Unit tests
├── requirements/                # Dependencies
├── setup.py
├── tox.ini                      # tox run -e train | test_package
└── VERSION
```

### Adding a New Model

To add a new model :

1. **Experiment** in a new notebook: `notebooks/modelB_<name>.ipynb`
2. **Create a new package** by copying the structure:
   ```bash
   cp -r package-model package-model-b
   ```
3. **Rename** the Python package inside:
   - `package-model-b/olist_returns_model/` (rename the folder)
   - Update `setup.py`: `name = "olist_returns_model"`
   - Update `config/config.yml` with new features and hyperparameters
4. **Implement** your model logic in `train_pipeline.py`, `predict.py`, and `pipeline.py`
5. **Update** `processing/validation.py` with your input schema
6. **Train & test**:
   ```bash
   cd package-model-b
   tox run -e train
   tox run -e test_package
   python -m build
   ```

Each model is an independent package with its own version, dependencies, and lifecycle.

---

**Response**

```json
{
  "data": {
    "predicted_score": 2,
    "negative_probability": 0.81,
    "sentiment": "negative",
    "reasons": [
      { "factor": "delivery_delay", "value": 4,     "impact": "high" },
      { "factor": "freight_cost",   "value": 24.50, "impact": "medium" },
      { "factor": "review_text",    "value": "damaged packaging", "impact": "medium" }
    ]
  },
  "status": "ok",
  "timestamp": "2024-01-13T00:00:00+00:00"
}
```
