# E-commerce Customer Satisfaction API

Predicts and explains negative reviews in e-commerce orders using logistics, economic, and NLP features.

Built on the [Olist Brazilian E-Commerce dataset](https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce) — 100k real orders from 2016–2018.

---

## Setup

```bash
git clone [<repo-url>](https://github.com/joaortizro/Microproyecto-MLOPS.git)
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
| POST | `/analyze/text` | Sentiment from review text only |
| POST | `/analyze/order` | Prediction from order data only |
| POST | `/analyze/hybrid` | Order + text — best accuracy |
| GET | `/reviews` | Paginated review list |
| GET | `/reviews/{id}` | Review detail + reasons |
| GET | `/reviews/search` | Full-text search |
| GET | `/insights/top-issues` | Top negative drivers |
| GET | `/insights/summary` | KPIs |
| GET | `/insights/by-category` | Breakdown by product |
| GET | `/insights/by-region` | Breakdown by geography |
| GET | `/insights/delivery-impact` | Delay vs score |
| GET | `/dashboard/metrics` | Model performance |
| GET | `/dashboard/score-distribution` | Star rating distribution |
| GET | `/dashboard/sentiment-trend` | Time series sentiment |

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

---

> For educational purposes only. Model predictions are probabilistic and not intended for production use.
