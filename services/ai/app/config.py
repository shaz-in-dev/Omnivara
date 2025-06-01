import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    environment: str = "development"
    api_url: str = "http://localhost:4000"
    app_url: str = "http://localhost:3000"
    database_url: str = "postgresql://omnivara:omnivara@localhost:5432/omnivara_dev"
    redis_url: str = "redis://localhost:6379"
    anthropic_api_key: str = ""
    openai_api_key: str = ""
    jwt_secret: str = "dev-secret-change-in-production"

    class Config:
        env_file = "../../.env"
        extra = "ignore"


settings = Settings()

# Fail fast in production if secrets are placeholders
if settings.environment == "production":
    if settings.jwt_secret == "dev-secret-change-in-production":
        raise RuntimeError("JWT_SECRET must be set to a secure value in production")
