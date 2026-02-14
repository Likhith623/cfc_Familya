import os
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    APP_NAME: str = "Familia API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # Supabase (handles auth + database)
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_KEY: str = ""

    # Google Cloud Translation API key
    GOOGLE_TRANSLATE_API_KEY: str = ""

    # Deepgram (Speech-to-Text)
    DEEPGRAM_API_KEY: str = ""

    # Cartesia (Text-to-Speech)
    CARTESIA_API_KEY: str = ""

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:3001"]

    class Config:
        env_file = ".env"
        extra = "allow"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
