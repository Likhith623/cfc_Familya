from supabase import create_client, Client
from config import get_settings

settings = get_settings()

# Lazy-initialized clients (created on first use, not at import time)
_supabase_admin: Client = None
_supabase_auth: Client = None


def get_supabase() -> Client:
    """Get the admin Supabase client (bypasses RLS)."""
    global _supabase_admin
    if _supabase_admin is None:
        _supabase_admin = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_KEY
        )
    return _supabase_admin


def get_auth_client() -> Client:
    """Get the auth Supabase client (for user authentication)."""
    global _supabase_auth
    if _supabase_auth is None:
        _supabase_auth = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_ANON_KEY
        )
    return _supabase_auth
