from supabase import create_client, Client
from config import get_settings

settings = get_settings()

supabase: Client = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_SERVICE_KEY or settings.SUPABASE_ANON_KEY
)


def get_supabase() -> Client:
    return supabase
