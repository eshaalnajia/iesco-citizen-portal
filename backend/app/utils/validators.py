import re
from typing import Optional


def normalize_pakistan_mobile(phone: str) -> str:
    """
    Canonical Pakistani mobile normalisation.
    Accepts: 03XXXXXXXXX, 3XXXXXXXXX, 923XXXXXXXXX, +923XXXXXXXXX
    Returns: 03XXXXXXXXX
    Raises ValueError on invalid input.
    """
    digits = re.sub(r"[-\s+()]", "", phone.strip())
    if digits.startswith("92") and len(digits) == 12:
        digits = "0" + digits[2:]
    elif digits.startswith("3") and len(digits) == 10:
        digits = "0" + digits
    if not (digits.startswith("03") and len(digits) == 11 and digits.isdigit()):
        raise ValueError(
            f"Invalid Pakistani mobile number: {phone}. "
            "Expected format: 03XXXXXXXXX"
        )
    return digits


def normalize_pakistan_mobile_e164(phone: str) -> Optional[str]:
    """
    E.164 format for Twilio/SMS use only.
    Accepts same formats as normalize_pakistan_mobile.
    Returns: +92XXXXXXXXX or None if invalid.
    """
    try:
        normalized = normalize_pakistan_mobile(phone)
        return "+92" + normalized[1:]
    except ValueError:
        return None