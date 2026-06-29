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

EASYPAISA_STORE_ID   = os.environ.get('EASYPAISA_STORE_ID', '')
EASYPAISA_HASH_KEY   = os.environ.get('EASYPAISA_HASH_KEY', '')
EASYPAISA_USERNAME   = os.environ.get('EASYPAISA_USERNAME', '')
EASYPAISA_PASSWORD   = os.environ.get('EASYPAISA_PASSWORD', '')
EASYPAISA_SANDBOX    = os.environ.get('EASYPAISA_SANDBOX', 'true').lower() == 'true'
EASYPAISA_RETURN_URL = os.environ.get('EASYPAISA_RETURN_URL', 'http://localhost:5173/billing/payment-complete')

EASYPAISA_BASE_URL = 'https://easypay.easypaisa.com.pk/tpay/'

ONEBILL_BILLER_ID              = os.environ.get('ONEBILL_BILLER_ID', '')
ONEBILL_SECRET_KEY             = os.environ.get('ONEBILL_SECRET_KEY', '')
ONEBILL_SANDBOX                = os.environ.get('ONEBILL_SANDBOX', 'true').lower() == 'true'
ONEBILL_CONSUMER_NUMBER_LENGTH = int(os.environ.get('ONEBILL_CONSUMER_NUMBER_LENGTH', '14'))

TWILIO_ENABLED      = os.environ.get('TWILIO_ENABLED', 'false').lower() == 'true'
TWILIO_ACCOUNT_SID  = os.environ.get('TWILIO_ACCOUNT_SID', '')
TWILIO_AUTH_TOKEN   = os.environ.get('TWILIO_AUTH_TOKEN', '')
TWILIO_FROM_NUMBER  = os.environ.get('TWILIO_FROM_NUMBER', '')
