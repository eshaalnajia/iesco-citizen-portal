# app/automation/request_reminders.py
"""
Checks the service_requests table for anything sitting in 'pending' status
for more than STALE_REQUEST_HOURS, and:
  1. Sends a single digest email to the admin (via Resend, see email_utils.py)
  2. Sets stale_flagged_at on each newly-flagged request, so the admin
     dashboard can show a visible "stale" badge AND so we never re-email
     about the same request on the next 6-hourly run.

Runs every 6 hours via the scheduler (app/automation/scheduler.py).
"""
import logging
from datetime import datetime, timedelta, timezone

from app.config import STALE_REQUEST_HOURS
from app.automation.email_utils import send_admin_email, build_stale_requests_digest_html

log = logging.getLogger(__name__)


async def send_stale_request_reminders(db) -> dict:
    """
    Finds pending requests older than STALE_REQUEST_HOURS that have NOT
    already been flagged (stale_flagged_at IS NULL), emails the admin a
    digest, and marks them as flagged so this run is idempotent.

    Never raises -- returns a result dict describing what happened.
    """
    cutoff = datetime.now(timezone.utc) - timedelta(hours=STALE_REQUEST_HOURS)

    try:
        result = (
            db.table("service_requests")
            .select("id, ticket_number, request_type, full_name, created_at, cnic")
            .eq("status", "pending")
            .is_("stale_flagged_at", "null")
            .lt("created_at", cutoff.isoformat())
            .execute()
        )
        newly_stale = result.data or []
    except Exception as e:
        log.error(f"[StaleReminders] Failed to query stale requests: {e}")
        return {"success": False, "reason": "query_failed", "count": 0}

    if not newly_stale:
        log.info("[StaleReminders] No newly-stale requests found.")
        return {"success": True, "count": 0, "email_sent": False}

    # Mark them as flagged FIRST, so if the email send fails we don't
    # end up in a retry loop that could double-flag on a partial failure --
    # better to occasionally miss an email than to spam the admin on every
    # scheduler run if Resend happens to be down.
    flagged_at = datetime.now(timezone.utc).isoformat()
    request_ids = [r["id"] for r in newly_stale]

    try:
        db.table("service_requests").update(
            {"stale_flagged_at": flagged_at}
        ).in_("id", request_ids).execute()
    except Exception as e:
        log.error(f"[StaleReminders] Failed to set stale_flagged_at: {e}")
        return {"success": False, "reason": "flag_update_failed", "count": len(newly_stale)}

    html = build_stale_requests_digest_html(newly_stale)
    email_result = await send_admin_email(
        subject=f"IESCO Portal: {len(newly_stale)} Stale Request(s) Need Review",
        html_body=html,
    )

    log.info(
        f"[StaleReminders] Flagged {len(newly_stale)} newly-stale request(s). "
        f"Email sent: {email_result['success']}"
    )

    return {
        "success": True,
        "count": len(newly_stale),
        "email_sent": email_result["success"],
        "request_ids": request_ids,
    }