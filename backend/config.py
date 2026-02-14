import os
import sys
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
    settings = Settings()
    
    # Validate critical environment variables
    missing_vars = []
    if not settings.SUPABASE_URL:
        missing_vars.append("SUPABASE_URL")
    if not settings.SUPABASE_ANON_KEY:
        missing_vars.append("SUPABASE_ANON_KEY")
    if not settings.SUPABASE_SERVICE_KEY:
        missing_vars.append("SUPABASE_SERVICE_KEY")
    
    if missing_vars:
        error_msg = f"""
╔═══════════════════════════════════════════════════════════════╗
║                  CONFIGURATION ERROR                          ║
╚═══════════════════════════════════════════════════════════════╝

Missing required environment variables: {', '.join(missing_vars)}

To fix this in Cloud Run:
1. Go to Cloud Run console
2. Select your service
3. Click "Edit & Deploy New Revision"
4. Under "Variables & Secrets" → "Environment variables", add:
   - SUPABASE_URL: Your Supabase project URL
   - SUPABASE_ANON_KEY: Your Supabase anon key
   - SUPABASE_SERVICE_KEY: Your Supabase service role key

Optional variables (features will be disabled without them):
   - GOOGLE_TRANSLATE_API_KEY: For translation features
   - DEEPGRAM_API_KEY: For speech-to-text
   - CARTESIA_API_KEY: For text-to-speech

"""
        print(error_msg, file=sys.stderr)
        sys.exit(1)
    
    return settings
