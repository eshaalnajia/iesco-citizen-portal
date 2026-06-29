import re
from datetime import datetime, timedelta
from typing   import Optional
import pytz

from app.config import (
    TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN,
    TWILIO_FROM_NUMBER,
    TWILIO_ENABLED,
)

PKT = pytz.timezone("Asia/Karachi")
SMS_COOLDOWN_MINUTES = 60


def clean_pakistan_number(phone: str) -> Optional[str]:
    digits = re.sub(r"[-\s+()]", "", phone.strip())
    if digits.startswith("92") and len(digits) == 12:
        return "+" + digits
    if digits.startswith("0") and len(digits) == 11 and digits[1] == "3":
        return "+92" + digits[1:]
    if digits.startswith("3") and len(digits) == 10:
        return "+92" + digits
    return None


def build_status_change_message(
    feeder_name:    str,
    feeder_code:    str,
    new_status:     str,
    sector:         str,
    end_time:       Optional[str] = None,
    portal_url:     str = "https://iesco-portal.pk",
) -> str:
    status_phrases = {
        "load_shedding": "Load shedding has started",
        "fault":         "An unplanned power outage has occurred",
        "maintenance":   "Maintenance work has started",
        "shedding_soon": "Load shedding will start soon",
        "on":            "Power has been restored",
    }

    phrase = status_phrases.get(new_status, f"Status changed to {new_status}")

    if new_status == "on":
        msg = (
            f"IESCO: Power restored in {sector} ({feeder_name}). "
            f"Reply STOP to unsubscribe."
        )
    elif end_time and new_status in ("load_shedding", "maintenance"):
        msg = (
            f"IESCO Alert: {phrase} in {sector}. "
            f"Expected end: {_format_time(end_time)}. "
            f"Track: {portal_url}/map?feeder={feeder_code} "
            f"Reply STOP to unsubscribe."
        )
    else:
        msg = (
            f"IESCO Alert: {phrase} in {sector} ({feeder_name}). "
            f"Track: {portal_url}/map?feeder={feeder_code} "
            f"Reply STOP to unsubscribe."
        )

    return msg


def _format_time(time_str: str) -> str:
    try:
        h, m = map(int, time_str.split(":"))
        suffix = "AM" if h < 12 else "PM"
        h12    = h % 12 or 12
        return f"{h12}:{m:02d} {suffix}"
    except Exception:
        return time_str


def should_send_sms(last_sms_at: Optional[str]) -> bool:
    if not last_sms_at:
        return True
    try:
        last = datetime.fromisoformat(last_sms_at.replace("Z", "+00:00"))
        cooldown = timedelta(minutes=SMS_COOLDOWN_MINUTES)
        return datetime.now(pytz.utc) - last > cooldown
    except Exception:
        return True


async def send_sms(
    to_number: str,
    message:   str,
    feeder_id: Optional[str] = None,
    trigger:   str = "manual",
    db=None,
) -> dict:
    e164_number = clean_pakistan_number(to_number)
    if not e164_number:
        return {"success": False, "error": f"Invalid phone number: {to_number}"}

    log_entry = {
        "phone":        to_number,
        "feeder_id":    feeder_id,
        "message":      message,
        "triggered_by": trigger,
        "status":       "sent",
    }

    if not TWILIO_ENABLED:
        print(f"[SMS DEV MODE] To: {e164_number}")
        print(f"[SMS DEV MODE] Message: {message}")
        if db:
            db.table("sms_log").insert({
                **log_entry,
                "twilio_sid": "DEV_MODE",
                "status":     "dev_logged",
            }).execute()
        return {"success": True, "sid": "DEV_MODE", "dev_mode": True}

    try:
        from twilio.rest import Client as TwilioClient
        client      = TwilioClient(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        message_obj = client.messages.create(
            body  = message,
            from_ = TWILIO_FROM_NUMBER,
            to    = e164_number,
        )

        if db:
            db.table("sms_log").insert({
                **log_entry,
                "twilio_sid": message_obj.sid,
                "status":     "sent",
            }).execute()

        return {"success": True, "sid": message_obj.sid}

    except Exception as e:
        error_msg = str(e)
        if db:
            db.table("sms_log").insert({
                **log_entry,
                "status":     "failed",
                "twilio_sid": f"ERROR: {error_msg}",
            }).execute()
        return {"success": False, "error": error_msg}
