import hmac
import hashlib
import httpx
import base64
from datetime import datetime, timedelta
import pytz
from app.config import (
    EASYPAISA_STORE_ID,
    EASYPAISA_HASH_KEY,
    EASYPAISA_USERNAME,
    EASYPAISA_PASSWORD,
    EASYPAISA_BASE_URL,
    EASYPAISA_RETURN_URL,
)

PKT = pytz.timezone("Asia/Karachi")


def get_pkt_datetime(offset_minutes: int = 0) -> str:
    dt = datetime.now(PKT) + timedelta(minutes=offset_minutes)
    return dt.strftime("%Y%m%d %H:%M:%S")


def generate_order_ref() -> str:
    import random
    now    = datetime.now(PKT)
    stamp  = now.strftime("%Y%m%d%H%M%S")
    suffix = str(random.randint(1000, 9999))
    return f"EP{stamp}{suffix}"


def build_hash(params: dict) -> str:
    sorted_keys = sorted(params.keys(), key=lambda k: k.lower())
    values      = [str(params[k]) for k in sorted_keys if params[k] is not None]
    hash_string = "&".join(values)

    digest = hmac.new(
        EASYPAISA_HASH_KEY.encode("utf-8"),
        hash_string.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest().lower()

    return digest


def build_redirect_payload(
    amount:         float,
    order_ref:      str,
    bill_reference: str,
    mobile_number:  str = "",
    email:          str = "",
) -> dict:
    payload = {
        "storeId":          EASYPAISA_STORE_ID,
        "amount":           f"{amount:.2f}",
        "postBackURL":      EASYPAISA_RETURN_URL,
        "orderRefNum":      order_ref,
        "expiryDate":       get_pkt_datetime(offset_minutes=30),
        "autoRedirect":     "0",
        "paymentMethod":    "MA_PAYMENT",
        "mobileAccountNo":  mobile_number,
        "emailAddress":     email,
        "tokenExpiry":      get_pkt_datetime(offset_minutes=30),
        "creationDateTime": get_pkt_datetime(),
        "httpMethod":       "POST",
        "recurringPayment": "0",
        "selectedBank":     "MA_PAYMENT",
    }

    payload["hashValue"] = build_hash(payload)
    return payload


def build_ma_payload(
    mobile_number:  str,
    amount:         float,
    order_ref:      str,
    bill_reference: str,
) -> dict:
    payload = {
        "storeId":            EASYPAISA_STORE_ID,
        "amount":             f"{amount:.2f}",
        "msisdn":             clean_mobile_number(mobile_number),
        "cnic":               "",
        "orderRefNum":        order_ref,
        "accountNum":         "",
        "transactionType":    "MA_PAY",
        "emailAddress":       "",
        "merchantPaymentRef": bill_reference,
        "tokenExpiry":        get_pkt_datetime(offset_minutes=5),
        "recurringPayment":   "0",
    }
    payload["hashValue"] = build_hash(payload)
    return payload


def clean_mobile_number(mobile: str) -> str:
    digits = "".join(filter(str.isdigit, mobile))
    if digits.startswith("92") and len(digits) == 12:
        digits = "0" + digits[2:]
    elif digits.startswith("3") and len(digits) == 10:
        digits = "0" + digits
    if not (digits.startswith("03") and len(digits) == 11):
        raise ValueError(
            f"Invalid Pakistani mobile number: {mobile}. "
            "Expected format: 03XXXXXXXXX"
        )
    return digits


def verify_callback_hash(params: dict) -> bool:
    received = params.get("hashValue", "")
    params_without_hash = {k: v for k, v in params.items() if k != "hashValue"}
    expected = build_hash(params_without_hash)
    return hmac.compare_digest(received.lower(), expected.lower())


def get_auth_header() -> str:
    credentials = f"{EASYPAISA_USERNAME}:{EASYPAISA_PASSWORD}"
    encoded     = base64.b64encode(credentials.encode()).decode()
    return f"Basic {encoded}"


async def send_ma_payment_request(payload: dict) -> dict:
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            f"{EASYPAISA_BASE_URL}MakePayment",
            json=payload,
            headers={
                "Content-Type": "application/json",
                "Authorization": get_auth_header(),
            },
        )
        response.raise_for_status()
        return response.json()


def parse_response_code(response: dict) -> tuple:
    code    = str(response.get("responseCode", ""))
    message = response.get("responseDesc", "Unknown error")

    if code == "0000":
        return True, "Payment successful"

    friendly = EASYPAISA_ERROR_CODES.get(code, message)
    return False, friendly


EASYPAISA_ERROR_CODES = {
    "0001": "Invalid request parameters. Contact IESCO support.",
    "0002": "Invalid store ID or hash. Contact IESCO support.",
    "0003": "Duplicate order reference. Please try again.",
    "0004": "Transaction declined. Check your Easypaisa account balance.",
    "0005": "Easypaisa account not found for this mobile number.",
    "0006": "Easypaisa account is inactive. Activate via the Easypaisa app.",
    "0007": "Insufficient Easypaisa account balance.",
    "0008": "Transaction limit exceeded. Contact Easypaisa support.",
    "0009": "Incorrect OTP. Please try again.",
    "0010": "OTP expired. Please restart the payment.",
    "0011": "Transaction timed out. Please try again.",
    "0012": "Invalid mobile account number.",
    "0099": "Easypaisa service temporarily unavailable. Try JazzCash.",
    "4009": "Invalid expiry date format.",
    "4010": "Transaction expired before completion.",
}
