import hmac
import hashlib
from datetime import datetime
import pytz
from app.config import ONEBILL_SECRET_KEY, ONEBILL_BILLER_ID

PKT = pytz.timezone("Asia/Karachi")


def verify_request_token(token: str) -> bool:
    if not token or not ONEBILL_SECRET_KEY:
        return False
    expected = build_auth_token()
    return hmac.compare_digest(token.strip(), expected)


def build_auth_token() -> str:
    timestamp = datetime.now(PKT).strftime("%Y%m%d%H")
    message   = f"{ONEBILL_BILLER_ID}{timestamp}"
    return hmac.new(
        ONEBILL_SECRET_KEY.encode(),
        message.encode(),
        hashlib.sha256,
    ).hexdigest().upper()


def build_response_hash(
    consumer_number: str,
    bill_status:     str,
    due_amount:      str,
    due_date:        str,
) -> str:
    message = "&".join([
        ONEBILL_BILLER_ID,
        consumer_number,
        bill_status,
        due_amount,
        due_date,
        ONEBILL_SECRET_KEY,
    ])
    return hashlib.sha256(message.encode()).hexdigest().upper()


def build_payment_acknowledgement_hash(
    consumer_number: str,
    transaction_id:  str,
    amount_paid:     str,
) -> str:
    message = "&".join([
        ONEBILL_BILLER_ID,
        consumer_number,
        transaction_id,
        amount_paid,
        ONEBILL_SECRET_KEY,
    ])
    return hashlib.sha256(message.encode()).hexdigest().upper()


def format_amount(amount: float) -> str:
    return f"{amount:.2f}"


def get_bill_status_code(payment_status: str, is_overdue: bool) -> str:
    if payment_status == "paid":
        return "01"
    if is_overdue:
        return "02"
    if payment_status == "partial":
        return "03"
    return "00"


BANK_CODES = {
    "HBL":   "Habib Bank Limited",
    "MCB":   "MCB Bank",
    "UBL":   "United Bank Limited",
    "ABL":   "Allied Bank Limited",
    "MEZAN": "Meezan Bank",
    "BAHL":  "Bank Alfalah",
    "FABL":  "Faysal Bank",
    "NBP":   "National Bank of Pakistan",
    "SCB":   "Standard Chartered Bank",
    "SILK":  "Silkbank",
    "ATM":   "ATM / CDM",
    "IB":    "Internet Banking",
    "MB":    "Mobile Banking",
    "AGENT": "Agent / Retailer",
}
