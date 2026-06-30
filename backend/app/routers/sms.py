from fastapi import APIRouter, Depends, HTTPException, Query, Request
from app.rate_limit import limiter
from fastapi.responses import Response
from pydantic import BaseModel, field_validator
from typing   import Optional

from app.config       import get_supabase
from app.dependencies import require_admin
from app.utils.sms    import clean_pakistan_number, send_sms
from supabase         import Client

router = APIRouter(prefix="/sms", tags=["SMS Alerts"])


class SubscribeRequest(BaseModel):
    phone:     str
    feeder_id: Optional[str] = None
    sector:    Optional[str] = None

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v):
        if not clean_pakistan_number(v):
            raise ValueError(
                "Please enter a valid Pakistani mobile number (03XXXXXXXXX)"
            )
        return v.strip()

    def model_post_init(self, __context):
        if not self.feeder_id and not self.sector:
            raise ValueError("Either feeder_id or sector must be provided")


@router.post(
    "/subscribe",
    status_code=201,
    summary="Subscribe a mobile number to outage alerts for an area",
)
@limiter.limit("5/hour")
async def subscribe(
    request: Request,
    body: SubscribeRequest,
    db:   Client = Depends(get_supabase),
):
    q = db.table("sms_subscriptions").select("id, is_active").eq("phone", body.phone)
    if body.feeder_id:
        q = q.eq("feeder_id", body.feeder_id)
    else:
        q = q.is_("feeder_id", "null")
    existing = q.limit(1).execute()



    if existing.data and existing.data[0]["is_active"]:
        return {
            "subscribed":      True,
            "already_existed": True,
            "message":         "You are already subscribed to alerts for this area.",
        }

    if existing.data and not existing.data[0]["is_active"]:
        db.table("sms_subscriptions").update(
            {"is_active": True}
        ).eq("id", existing.data[0]["id"]).execute()
    else:
        db.table("sms_subscriptions").insert({
            "phone":     body.phone,
            "feeder_id": body.feeder_id,
            "sector":    body.sector,
            "is_active": True,
        }).execute()

    await send_sms(
        to_number = body.phone,
        message   = (
            "IESCO Alerts: You are now subscribed to power outage alerts. "
            "Reply STOP at any time to unsubscribe."
        ),
        db=db,
        trigger="subscription_confirmation",
    )

    return {
        "subscribed": True,
        "message":    "Subscribed successfully. You will receive an SMS when power goes out in your area.",
    }


@router.delete(
    "/unsubscribe",
    summary="Unsubscribe a number from alerts",
)
def unsubscribe(
    phone:     str = Query(...),
    feeder_id: Optional[str] = Query(None),
    db:        Client = Depends(get_supabase),
):
    query = (
        db.table("sms_subscriptions")
        .update({"is_active": False})
        .eq("phone", phone)
    )
    if feeder_id:
        query = query.eq("feeder_id", feeder_id)

    query.execute()

    return {
        "unsubscribed": True,
        "message":      "You have been unsubscribed from IESCO SMS alerts.",
    }


@router.post(
    "/twilio-webhook",
    summary="Receives incoming SMS from citizens (for STOP processing)",
    include_in_schema=False,
)
async def twilio_webhook(
    request: Request,
    db:      Client = Depends(get_supabase),
):
    form  = await request.form()
    body  = (form.get("Body") or "").strip().upper()
    phone = form.get("From") or ""

    if phone.startswith("+92"):
        phone = "0" + phone[3:]

    if body in ("STOP", "UNSUBSCRIBE", "CANCEL", "END", "QUIT"):
        db.table("sms_subscriptions").update(
            {"is_active": False}
        ).eq("phone", phone).execute()
        twiml = '<?xml version="1.0" encoding="UTF-8"?><Response><Message>You have been unsubscribed from IESCO alerts. Reply START to resubscribe.</Message></Response>'

    elif body in ("START", "SUBSCRIBE", "YES"):
        db.table("sms_subscriptions").update(
            {"is_active": True}
        ).eq("phone", phone).execute()
        twiml = '<?xml version="1.0" encoding="UTF-8"?><Response><Message>You have been resubscribed to IESCO outage alerts.</Message></Response>'

    elif body in ("HELP", "INFO"):
        twiml = '<?xml version="1.0" encoding="UTF-8"?><Response><Message>IESCO Alerts: Reply STOP to unsubscribe, START to resubscribe. Visit iesco-portal.pk for live status.</Message></Response>'

    else:
        twiml = '<?xml version="1.0" encoding="UTF-8"?><Response></Response>'

    return Response(content=twiml, media_type="application/xml")


@router.post(
    "/send-alert",
    summary="Manually send an alert to all subscribers of a feeder (admin only)",
)
async def send_alert_to_feeder(
    feeder_id: str,
    message:   str,
    admin:     dict = Depends(require_admin),
    db:        Client = Depends(get_supabase),
):
    subscribers = (
        db.table("sms_subscriptions")
        .select("phone")
        .eq("feeder_id", feeder_id)
        .eq("is_active", True)
        .execute()
    )

    if not subscribers.data:
        return {"sent": 0, "message": "No active subscribers for this feeder."}

    sent   = 0
    failed = 0
    for sub in subscribers.data:
        result = await send_sms(
            to_number = sub["phone"],
            message   = message,
            feeder_id = feeder_id,
            trigger   = "manual_admin",
            db        = db,
        )
        if result["success"]:
            sent += 1
        else:
            failed += 1

    return {
        "sent":   sent,
        "failed": failed,
        "total":  len(subscribers.data),
    }


@router.get(
    "/log",
    summary="View SMS send history (admin only)",
)
def get_sms_log(
    feeder_id: Optional[str] = Query(None),
    page:      int           = Query(1, ge=1),
    page_size: int           = Query(50, ge=1, le=200),
    admin:     dict          = Depends(require_admin),
    db:        Client        = Depends(get_supabase),
):
    offset = (page - 1) * page_size
    query  = db.table("sms_log").select("*", count="exact")
    if feeder_id:
        query = query.eq("feeder_id", feeder_id)

    result = (
        query
        .order("sent_at", desc=True)
        .range(offset, offset + page_size - 1)
        .execute()
    )
    return {
        "data":  result.data,
        "total": result.count,
        "page":  page,
    }

