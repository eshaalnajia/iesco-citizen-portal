# app/automation/email_utils.py
"""
Sends admin notification emails via Resend's HTTP API -- reusing the same
service already powering the notify-service-request Supabase Edge Function
(see backend/HANDOVER_STEP29_v3.md Part 4), rather than standing up a
separate SMTP pipeline.

Follows the same dev-mode-safe pattern as app/utils/sms.py's send_sms():
if RESEND_ENABLED is False (missing key/admin email), logs to console
instead of failing, so local dev never breaks on a missing secret.
"""
import logging
import httpx

from app.config import RESEND_API_KEY, ADMIN_ALERT_EMAIL, RESEND_ENABLED

log = logging.getLogger(__name__)

RESEND_URL = "https://api.resend.com/emails"
FROM_ADDRESS = "IESCO Portal <onboarding@resend.dev>"  # matches the Edge Function's sender


async def send_admin_email(subject: str, html_body: str) -> dict:
    """
    Sends an HTML email to ADMIN_ALERT_EMAIL via Resend.
    Never raises -- returns a result dict describing what happened.
    """
    if not RESEND_ENABLED:
        print(f"[EMAIL DEV MODE] To: (admin alert email not configured)")
        print(f"[EMAIL DEV MODE] Subject: {subject}")
        print(f"[EMAIL DEV MODE] Body (truncated): {html_body[:200]}...")
        return {"success": True, "dev_mode": True}

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                RESEND_URL,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {RESEND_API_KEY}",
                },
                json={
                    "from": FROM_ADDRESS,
                    "to": [ADMIN_ALERT_EMAIL],
                    "subject": subject,
                    "html": html_body,
                },
            )
            if resp.status_code >= 400:
                log.error(f"[Email] Resend API error {resp.status_code}: {resp.text}")
                return {"success": False, "error": f"HTTP {resp.status_code}: {resp.text}"}

            return {"success": True, "response": resp.json()}

    except httpx.HTTPError as e:
        log.error(f"[Email] Failed to send admin email: {e}")
        return {"success": False, "error": str(e)}


def build_stale_requests_digest_html(stale_requests: list[dict]) -> str:
    """
    Builds an HTML digest email listing all newly-stale requests,
    styled to match the existing notify-service-request Edge Function's
    visual language (same navy/teal palette).
    """
    rows = ""
    for r in stale_requests:
        rows += f"""
          <tr>
            <td style="padding:8px 0;color:#94a3b8;">{r.get('ticket_number', 'N/A')}</td>
            <td style="padding:8px 0;color:#334155;">{r.get('request_type', '')}</td>
            <td style="padding:8px 0;color:#334155;">{r.get('full_name', '')}</td>
            <td style="padding:8px 0;color:#334155;">{r.get('created_at', '')}</td>
          </tr>
        """

    return f"""
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#0D1B3E;padding:24px;border-radius:12px 12px 0 0;">
          <h1 style="color:#00C2A8;margin:0;font-size:20px;">IESCO Citizen Portal</h1>
        </div>
        <div style="background:#ffffff;padding:24px;border:1px solid #e2e8f0;border-top:0;border-radius:0 0 12px 12px;">
          <h2 style="color:#0D1B3E;margin-top:0;">Stale Request Alert</h2>
          <p style="color:#64748b;">
            The following {len(stale_requests)} request(s) have been sitting in
            <strong>pending</strong> status for over 48 hours and need review:
          </p>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr style="border-bottom:2px solid #e2e8f0;">
              <th style="text-align:left;padding:8px 0;color:#94a3b8;">Ticket</th>
              <th style="text-align:left;padding:8px 0;color:#94a3b8;">Type</th>
              <th style="text-align:left;padding:8px 0;color:#94a3b8;">Name</th>
              <th style="text-align:left;padding:8px 0;color:#94a3b8;">Submitted</th>
            </tr>
            {rows}
          </table>
        </div>
      </div>
    """
