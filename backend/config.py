import os
from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import List


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

    # CORS - accept all origins (Cloud Run deployment)
    CORS_ORIGINS: str = "*"
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Return CORS origins as a list."""
        if self.CORS_ORIGINS.strip() == "*":
            return ["*"]
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    class Config:
        env_file = ".env"
        extra = "allow"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
