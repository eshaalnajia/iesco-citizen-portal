from supabase import create_client, Client
from dotenv import load_dotenv
import redis
import os

load_dotenv()

SUPABASE_URL: str = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY: str = os.environ.get("SUPABASE_SERVICE_KEY", "")
REDIS_URL: str = os.environ.get("REDIS_URL", "redis://localhost:6379")
ENVIRONMENT: str = os.environ.get("ENVIRONMENT", "development")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise ValueError(
        "SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env\n"
        "Copy .env.example to .env and fill in your Supabase credentials."
    )

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

redis_client = redis.from_url(
    REDIS_URL,
    decode_responses=True,
    socket_connect_timeout=2,
    socket_timeout=2,
)

def get_supabase() -> Client:
    return supabase

def get_redis() -> redis.Redis:
    return redis_client

JAZZCASH_MERCHANT_ID    = os.environ.get('JAZZCASH_MERCHANT_ID', '')
JAZZCASH_PASSWORD       = os.environ.get('JAZZCASH_PASSWORD', '')
JAZZCASH_INTEGRITY_SALT = os.environ.get('JAZZCASH_INTEGRITY_SALT', '')
JAZZCASH_SANDBOX        = os.environ.get('JAZZCASH_SANDBOX', 'true').lower() == 'true'

JAZZCASH_BASE_URL = (
    'https://sandbox.jazzcash.com.pk/ApplicationAPI/API/2.0/Purchase/'
    if JAZZCASH_SANDBOX
    else 'https://payments.jazzcash.com.pk/ApplicationAPI/API/2.0/Purchase/'
)
