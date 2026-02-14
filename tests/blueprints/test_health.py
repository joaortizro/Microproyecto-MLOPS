"""
Tests for the health blueprint.

Covers: GET /health, GET /model/info
"""

from http import HTTPStatus


class TestHealthEndpoint:
    def test_health_returns_200(self, client):
        # Given: a running API
        # When: GET /health is called
        response = client.get("/health")

        # Then: returns 200
        assert response.status_code == HTTPStatus.OK

    def test_health_status_is_ok(self, client):
        # Given: a running API
        # When: GET /health is called
        response = client.get("/health")

        # Then: envelope status is "ok" and inner status is "healthy"
        data = response.get_json()
        assert data["status"] == "ok"
        assert data["data"]["status"] == "healthy"

    def test_health_response_has_full_envelope(self, client):
        # Given: a running API
        # When: GET /health is called
        response = client.get("/health")

        # Then: all three envelope keys are present
        data = response.get_json()
        assert "data" in data
        assert "status" in data
        assert "timestamp" in data

    def test_health_returns_version(self, client):
        # Given: a running API
        # When: GET /health is called
        response = client.get("/health")

        # Then: version field is present inside data
        data = response.get_json()
        assert "version" in data["data"]

    def test_unknown_route_returns_404(self, client):
        # Given: a running API
        # When: requesting a route that does not exist
        response = client.get("/nonexistent-route")

        # Then: 404 is returned
        assert response.status_code == HTTPStatus.NOT_FOUND


class TestModelInfoEndpoint:
    def test_model_info_returns_200(self, client):
        # Given: a running API (model not yet loaded)
        # When: GET /model/info is called
        response = client.get("/model/info")

        # Then: returns 200 with stub payload
        assert response.status_code == HTTPStatus.OK

    def test_model_info_status_is_not_loaded(self, client):
        # Given: model not integrated yet (pre PR-10)
        # When: GET /model/info is called
        response = client.get("/model/info")

        # Then: status field reports not_loaded
        data = response.get_json()
        assert data["data"]["status"] == "not_loaded"

    def test_model_info_has_envelope(self, client):
        # Given: a running API
        # When: GET /model/info is called
        response = client.get("/model/info")

        # Then: standard envelope is present
        data = response.get_json()
        assert "data" in data
        assert "status" in data
        assert "timestamp" in data
