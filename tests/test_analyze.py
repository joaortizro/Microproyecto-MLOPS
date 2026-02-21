"""Tests for POST /analyze/hybrid endpoint."""

from http import HTTPStatus


VALID_PAYLOAD = {
    "delivery": {
        "purchase_date": "2024-01-01T10:00:00",
        "promised_date": "2024-01-08T23:59:59",
    },
    "review": {
        "text": "Produto chegou bem, sem problemas",
    },
}


class TestAnalyzeHybrid:
    def test_returns_200_with_minimum_fields(self, client):
        # Given: a payload with only required fields
        # When: POST /analyze/hybrid
        response = client.post("/analyze/hybrid", json=VALID_PAYLOAD)

        # Then: returns 200
        assert response.status_code == HTTPStatus.OK

    def test_response_has_envelope(self, client):
        # Given: a valid payload
        # When: POST /analyze/hybrid
        response = client.post("/analyze/hybrid", json=VALID_PAYLOAD)

        # Then: standard envelope is present
        data = response.json()
        assert "data" in data
        assert "status" in data
        assert "timestamp" in data
        assert data["status"] == "ok"

    def test_prediction_has_required_fields(self, client):
        # Given: a valid payload
        # When: POST /analyze/hybrid
        response = client.post("/analyze/hybrid", json=VALID_PAYLOAD)

        # Then: prediction data has all expected fields
        prediction = response.json()["data"]
        assert "predicted_score" in prediction
        assert "negative_probability" in prediction
        assert "sentiment" in prediction
        assert "reasons" in prediction

    def test_prediction_values_are_in_valid_range(self, client):
        # Given: a valid payload
        # When: POST /analyze/hybrid
        response = client.post("/analyze/hybrid", json=VALID_PAYLOAD)

        # Then: model returns values within expected ranges
        prediction = response.json()["data"]
        assert prediction["predicted_score"] in (1, 5)
        assert 0.0 <= prediction["negative_probability"] <= 1.0
        assert prediction["sentiment"] in ("negative", "positive")

    def test_full_payload_with_all_optional_fields(self, client):
        # Given: a payload with all fields populated
        payload = {
            "delivery": {
                "purchase_date": "2024-01-01T10:00:00",
                "promised_date": "2024-01-08T23:59:59",
                "dispatched_date": "2024-01-02T14:00:00",
                "delivered_date": "2024-01-12T15:30:00",
            },
            "financials": {
                "order_total": 189.90,
                "shipping_cost": 24.50,
                "payment_installments": 3,
            },
            "location": {"distance_km": 1127.4},
            "item": {
                "category": "electronics",
                "weight_g": 850,
                "description_length": 320,
                "media_count": 2,
            },
            "review": {"text": "Tudo certo"},
        }

        # When: POST /analyze/hybrid
        response = client.post("/analyze/hybrid", json=payload)

        # Then: returns 200 with valid prediction
        assert response.status_code == HTTPStatus.OK
        assert response.json()["data"]["predicted_score"] in range(1, 6)

    def test_missing_review_returns_422(self, client):
        # Given: a payload without the required review field
        payload = {
            "delivery": {
                "purchase_date": "2024-01-01T10:00:00",
                "promised_date": "2024-01-08T23:59:59",
            },
        }

        # When: POST /analyze/hybrid
        response = client.post("/analyze/hybrid", json=payload)

        # Then: returns 422 validation error
        assert response.status_code == HTTPStatus.UNPROCESSABLE_ENTITY

    def test_missing_delivery_returns_422(self, client):
        # Given: a payload without delivery dates
        payload = {"review": {"text": "Produto bom"}}

        # When: POST /analyze/hybrid
        response = client.post("/analyze/hybrid", json=payload)

        # Then: returns 422 validation error
        assert response.status_code == HTTPStatus.UNPROCESSABLE_ENTITY

    def test_shipping_cost_without_order_total_returns_422(self, client):
        # Given: shipping_cost without order_total
        payload = {
            "delivery": {
                "purchase_date": "2024-01-01T10:00:00",
                "promised_date": "2024-01-08T23:59:59",
            },
            "financials": {"shipping_cost": 24.50},
            "review": {"text": "Produto ok"},
        }

        # When: POST /analyze/hybrid
        response = client.post("/analyze/hybrid", json=payload)

        # Then: returns 422 — both or neither rule
        assert response.status_code == HTTPStatus.UNPROCESSABLE_ENTITY
