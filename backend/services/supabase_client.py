from supabase import create_client, Client
from config import get_settings

settings = get_settings()

# Create TWO clients:
# 1. Admin client with service role key - bypasses RLS for backend operations
# 2. Auth client with anon key - for user authentication

# Admin client (service role) - for database operations that need to bypass RLS
supabase_admin: Client = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_SERVICE_KEY
)

# Auth client (anon key) - for user authentication
supabase_auth: Client = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_ANON_KEY
)


def get_supabase() -> Client:
    """Get the admin Supabase client (bypasses RLS)."""
    return supabase_admin


def get_auth_client() -> Client:
    """Get the auth Supabase client (for user authentication)."""
    return supabase_auth
