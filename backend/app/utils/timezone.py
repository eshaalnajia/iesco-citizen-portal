from datetime import datetime, date, timedelta
import pytz

PKT = pytz.timezone("Asia/Karachi")


def now_pkt() -> datetime:
    return datetime.now(PKT)


def today_pkt() -> date:
    return now_pkt().date()


def date_range_pkt(days_ahead: int = 7) -> tuple[date, date]:
    start = today_pkt()
    end   = start + timedelta(days=days_ahead)
    return start, end


def is_currently_active(
    schedule_date: date,
    start_time: str,
    end_time: str
) -> bool:
    now   = now_pkt()
    today = now.date()

    if schedule_date != today:
        return False

    start_parts = start_time.split(":")
    end_parts   = end_time.split(":")

    start_h, start_m = int(start_parts[0]), int(start_parts[1])
    end_h,   end_m   = int(end_parts[0]),   int(end_parts[1])

    start_dt = PKT.localize(
        datetime(today.year, today.month, today.day, start_h, start_m)
    )
    end_dt = PKT.localize(
        datetime(today.year, today.month, today.day, end_h, end_m)
    )

    return start_dt <= now <= end_dt
