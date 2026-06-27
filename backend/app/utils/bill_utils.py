from datetime import date, datetime
import pytz

PKT = pytz.timezone("Asia/Karachi")


def compute_total_payable(
    bill_amount: float,
    arrears: float = 0.0,
    taxes: float = 0.0,
) -> float:
    return round(bill_amount + arrears + taxes, 2)


def is_overdue(due_date_str: str) -> bool:
    if not due_date_str:
        return False
    try:
        due = date.fromisoformat(str(due_date_str))
        today = datetime.now(PKT).date()
        return due < today
    except (ValueError, TypeError):
        return False


def mask_consumer_name(name: str) -> str:
    if not name:
        return name
    parts = name.strip().split()
    masked = []
    for i, part in enumerate(parts):
        if i == 0:
            masked.append(part)
        elif len(part) <= 2:
            masked.append(part + "***")
        else:
            masked.append(part[0] + "***")
    return " ".join(masked)
