"""Tests for application configuration."""

from app.config import get_settings, DevelopmentSettings, TestingSettings, ProductionSettings


class TestGetSettings:
    def test_development_is_default(self):
        # Given: no environment specified
        # When: getting settings
        settings = get_settings("development")

        # Then: development config is returned
        assert isinstance(settings, DevelopmentSettings)
        assert settings.DEBUG is True

    def test_testing_settings(self):
        # Given: testing environment
        # When: getting settings
        settings = get_settings("testing")

        # Then: testing config is returned
        assert isinstance(settings, TestingSettings)
        assert settings.is_testing is True

    def test_unknown_env_falls_back_to_development(self):
        # Given: an unknown environment name
        # When: getting settings
        settings = get_settings("unknown")

        # Then: falls back to development
        assert isinstance(settings, DevelopmentSettings)

    def test_production_settings_type(self):
        # Given: production environment class
        # Then: it exists and has correct env
        assert ProductionSettings.model_fields["ENVIRONMENT"].default == "production"
