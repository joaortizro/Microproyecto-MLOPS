"""Tests for Pydantic response schemas."""


class TestApiResponse:
    def test_success_response_has_envelope(self):
        # Given: a data payload
        from app.schemas.base import ApiResponse

        # When: creating a success response
        response = ApiResponse(data={"key": "value"})

        # Then: envelope has all required fields
        assert response.data == {"key": "value"}
        assert response.status == "ok"
        assert response.timestamp is not None

    def test_success_response_default_status(self):
        # Given: no explicit status
        from app.schemas.base import ApiResponse

        # When: creating a response without status
        response = ApiResponse(data={})

        # Then: status defaults to "ok"
        assert response.status == "ok"


class TestErrorResponse:
    def test_error_response_has_message(self):
        # Given: an error message
        from app.schemas.base import ErrorResponse

        # When: creating an error response
        response = ErrorResponse(message="something went wrong")

        # Then: envelope has error fields
        assert response.data is None
        assert response.status == "error"
        assert response.message == "something went wrong"
        assert response.timestamp is not None
