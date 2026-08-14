# app/automation/request_confirmations.py
"""
Manages the citizen confirmation flow for service requests:

  approved/in_review  --[turnaround time passed]-->  awaiting_confirmation
  awaiting_confirmation --[citizen clicks Yes]-->     completed
  awaiting_confirmation --[citizen clicks No]-->      in_review (kicked back to admin)
  awaiting_confirmation --[7 days pass, no response]--> presumed_completed

This module runs two scheduled jobs:
  1. prompt_pending_confirmations() -- finds requests whose turnaround
     window has passed and flips them into awaiting_confirmation, setting
     confirmation_prompted_at and confirmation_deadline (+7 days).
  2. resolve_expired_confirmations() -- finds awaiting_confirmation requests
     past their confirmation_deadline and flips them to presumed_completed.

The citizen-facing Yes/No click itself is handled directly in
app/routers/service_requests.py (not here), since it's a synchronous
citizen action, not a scheduled job.
"""
import logging
from datetime import datetime, timedelta, timezone

log = logging.getLogger(__name__)

CONFIRMATION_WINDOW_DAYS = 7

# Mirrors TURNAROUND in app/routers/service_requests.py -- kept in sync
# manually since these are display strings there and day-counts here.
TURNAROUND_DAYS = {
    "new_connection":    14,  # upper bound of "7-14 working days"
    "meter_change":      5,   # upper bound of "3-5 working days"
    "energy_audit":      4,   # upper bound of "2-4 working days"
    "safety_inspection": 2,   # upper bound of "24-48 hours"
}


async def prompt_pending_confirmations(db) -> dict:
    """
    Finds requests in 'approved' or 'in_review' status whose expected
    turnaround window has passed, and flips them to awaiting_confirmation
    so the citizen sees a Yes/No prompt next time they check their ticket.
    """
    now = datetime.now(timezone.utc)
    prompted = []

    for request_type, days in TURNAROUND_DAYS.items():
        cutoff = now - timedelta(days=days)
        try:
            result = (
                db.table("service_requests")
                .select("id, ticket_number")
                .in_("status", ["approved", "in_review"])
                .eq("request_type", request_type)
                .lt("created_at", cutoff.isoformat())
                .execute()
            )
        except Exception as e:
            log.error(f"[Confirmations] Query failed for {request_type}: {e}")
            continue

        if not result.data:
            continue

        deadline = (now + timedelta(days=CONFIRMATION_WINDOW_DAYS)).isoformat()
        ids = [r["id"] for r in result.data]

        try:
            db.table("service_requests").update({
                "status": "awaiting_confirmation",
                "confirmation_prompted_at": now.isoformat(),
                "confirmation_deadline": deadline,
            }).in_("id", ids).execute()
            prompted.extend(ids)
        except Exception as e:
            log.error(f"[Confirmations] Failed to flip status for {request_type}: {e}")

    log.info(f"[Confirmations] Prompted {len(prompted)} request(s) for confirmation.")
    return {"success": True, "prompted_count": len(prompted), "request_ids": prompted}


async def resolve_expired_confirmations(db) -> dict:
    """
    Finds requests stuck in awaiting_confirmation past their deadline
    (7 days with no citizen response) and marks them presumed_completed --
    NOT 'completed', since nobody actually confirmed the work was done.
    This keeps 'completed' meaning "a citizen actively confirmed it."
    """
    now = datetime.now(timezone.utc)

    try:
        result = (
            db.table("service_requests")
            .select("id, ticket_number")
            .eq("status", "awaiting_confirmation")
            .lt("confirmation_deadline", now.isoformat())
            .execute()
        )
        expired = result.data or []
    except Exception as e:
        log.error(f"[Confirmations] Query for expired confirmations failed: {e}")
        return {"success": False, "reason": "query_failed", "count": 0}

    if not expired:
        return {"success": True, "count": 0}

    ids = [r["id"] for r in expired]
    try:
        db.table("service_requests").update({
            "status": "presumed_completed",
            "resolved_at": now.isoformat(),
        }).in_("id", ids).execute()
    except Exception as e:
        log.error(f"[Confirmations] Failed to mark presumed_completed: {e}")
        return {"success": False, "reason": "update_failed", "count": len(expired)}

    log.info(f"[Confirmations] Marked {len(expired)} request(s) as presumed_completed.")
    return {"success": True, "count": len(expired), "request_ids": ids}