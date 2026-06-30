import hmac
import hashlib
import httpx
from datetime import datetime, timedelta
import pytz
from app.config import (
    JAZZCASH_MERCHANT_ID,
    JAZZCASH_PASSWORD,
    JAZZCASH_INTEGRITY_SALT,
    JAZZCASH_BASE_URL,
)

PKT = pytz.timezone("Asia/Karachi")


def generate_transaction_ref(prefix: str = "IESCO") -> str:
    import random
    now    = datetime.now(PKT)
    stamp  = now.strftime("%Y%m%d%H%M%S")
    suffix = str(random.randint(1000, 9999))
    return f"{prefix}{stamp}{suffix}"


def get_pkt_datetime(offset_minutes: int = 0) -> str:
    dt = datetime.now(PKT) + timedelta(minutes=offset_minutes)
    return dt.strftime("%Y%m%d%H%M%S")


def build_secure_hash(params: dict) -> str:
    sorted_keys = sorted([
        k for k, v in params.items()
        if k.startswith("pp_") and v is not None and str(v) != ""
    ])

    values = [str(params[k]) for k in sorted_keys]

    hash_string = "&".join([JAZZCASH_INTEGRITY_SALT] + values)

    hash_bytes = hmac.new(
        JAZZCASH_INTEGRITY_SALT.encode("utf-8"),
        hash_string.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest().upper()

    return hash_bytes


def build_payment_payload(
    mobile_number:  str,
    amount_pkr:     float,
    txn_ref:        str,
    bill_reference: str,
    description:    str = "IESCO Electricity Bill Payment",
) -> dict:
    amount_paisas = str(int(round(amount_pkr * 100)))
    mobile = clean_mobile_number(mobile_number)

    payload = {
        "pp_Version":            "1.1",
        "pp_TxnType":            "MWALLET",
        "pp_Language":           "EN",
        "pp_MerchantID":         JAZZCASH_MERCHANT_ID,
        "pp_SubMerchantID":      "",
        "pp_Password":           JAZZCASH_PASSWORD,
        "pp_BankID":             "TBANK",
        "pp_ProductID":          "RETL",
        "pp_TxnRefNo":           txn_ref,
        "pp_Amount":             amount_paisas,
        "pp_TxnCurrency":        "PKR",
        "pp_TxnDateTime":        get_pkt_datetime(),
        "pp_BillReference":      bill_reference,
        "pp_Description":        description,
        "pp_TxnExpiryDateTime":  get_pkt_datetime(offset_minutes=30),
        "pp_ReturnURL":          "",
        "pp_SecureHash":         "",
        "ppmpf_1":               mobile,
        "ppmpf_2":               "",
        "ppmpf_3":               "",
        "ppmpf_4":               "",
        "ppmpf_5":               "",
    }

    payload["pp_SecureHash"] = build_secure_hash(payload)
    return payload


def clean_mobile_number(mobile: str) -> str:
    from app.utils.validators import normalize_pakistan_mobile
    return normalize_pakistan_mobile(mobile)


async def send_payment_request(payload: dict) -> dict:
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            JAZZCASH_BASE_URL,
            data=payload,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        response.raise_for_status()
        return response.json()


def verify_response_hash(response_params: dict) -> bool:
    received_hash = response_params.get("pp_SecureHash", "")
    params_without_hash = {
        k: v for k, v in response_params.items()
        if k != "pp_SecureHash"
    }
    expected_hash = build_secure_hash(params_without_hash)
    return hmac.compare_digest(received_hash.upper(), expected_hash.upper())


def parse_response_code(response: dict) -> tuple:
    code    = response.get("pp_ResponseCode", "")
    message = response.get("pp_ResponseMessage", "Unknown error")

    success_codes = {"000"}
    pending_codes = {"124"}

    if code in success_codes:
        return True, "Payment successful"
    elif code in pending_codes:
        return None, "OTP sent to your mobile number"
    else:
        friendly = JAZZCASH_ERROR_CODES.get(code, message)
        return False, friendly


JAZZCASH_ERROR_CODES = {
    "001": "Transaction declined. Please check your JazzCash account balance.",
    "101": "Invalid merchant credentials. Contact IESCO support.",
    "111": "Your JazzCash account was not found for this mobile number.",
    "115": "Your JazzCash account is inactive. Please activate it via the JazzCash app.",
    "118": "Insufficient balance in your JazzCash account.",
    "121": "Transaction limit exceeded. Try a smaller amount or contact JazzCash.",
    "124": "OTP has been sent to your mobile number. Please enter it to complete payment.",
    "157": "Incorrect OTP. Please try again. OTP expires in 3 minutes.",
    "199": "Transaction timed out. Please try again.",
    "200": "Invalid transaction reference. Contact IESCO support.",
    "210": "Amount mismatch. Contact IESCO support.",
    "400": "Transaction processing error. Please try again.",
    "500": "JazzCash service temporarily unavailable. Try EasyPaisa or bank transfer.",
}
