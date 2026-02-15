"""Tests for FastAPI application setup."""

from http import HTTPStatus


class TestAppSetup:
    def test_docs_endpoint_returns_200(self, client):
        # Given: a running API
        # When: accessing the auto-generated docs
        response = client.get("/docs")

        # Then: Swagger UI is served
        assert response.status_code == HTTPStatus.OK

    def test_openapi_schema_is_available(self, client):
        # Given: a running API
        # When: requesting the OpenAPI JSON schema
        response = client.get("/openapi.json")

        # Then: schema is returned with correct title
        assert response.status_code == HTTPStatus.OK
        data = response.json()
        assert data["info"]["title"] == "E-commerce Customer Satisfaction API"

    def test_unknown_route_returns_404(self, client):
        # Given: a running API
        # When: requesting a route that does not exist
        response = client.get("/nonexistent-route")

        # Then: 404 is returned
        assert response.status_code == HTTPStatus.NOT_FOUND
