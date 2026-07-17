from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
from app.config import get_supabase, get_redis
from app.dependencies import require_admin
from app.utils.sms import (
    build_status_change_message,
    send_sms,
    should_send_sms,
)
from app.cache import cache_get, cache_set, cache_delete_pattern, TTL_FEEDERS
import redis as redis_lib
from supabase import Client

router = APIRouter(prefix="/feeders", tags=["Feeders"])

VALID_STATUSES = {
    "on", "shedding_soon", "load_shedding",
    "fault", "maintenance", "no_data"
}


class StatusUpdate(BaseModel):
    status: str
    reliability: Optional[int] = None


@router.get("/")
def list_feeders(
    sector: Optional[str] = None,
    db: Client = Depends(get_supabase),
    cache: redis_lib.Redis = Depends(get_redis),
):
    cache_key = f"feeders:{sector or 'all'}"
    cached = cache_get(cache, cache_key)
    if cached:
        return {"data": cached, "source": "cache"}

    query = db.table("feeders").select(
        "id, feeder_code, name, sector, status, reliability, last_updated"
    )
    if sector:
        query = query.eq("sector", sector)

    result = query.order("sector").execute()
    cache_set(cache, cache_key, result.data, TTL_FEEDERS)
    return {"data": result.data, "source": "database"}


@router.get("/{feeder_id}")
def get_feeder(
    feeder_id: str,
    db: Client = Depends(get_supabase),
    cache: redis_lib.Redis = Depends(get_redis),
):
    cache_key = f"feeders:single:{feeder_id}"
    cached = cache_get(cache, cache_key)
    if cached:
        return cached

    result = db.table("feeders").select("*").eq("id", feeder_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Feeder not found")

    feeder = result.data[0]
    cache_set(cache, cache_key, feeder, TTL_FEEDERS)
    return feeder


@router.patch("/{feeder_id}/status")
async def update_feeder_status(
    feeder_id: str,
    body: StatusUpdate,
    admin: dict = Depends(require_admin),
    db: Client = Depends(get_supabase),
    cache: redis_lib.Redis = Depends(get_redis),
):
    if body.status not in VALID_STATUSES:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid status. Must be one of: {VALID_STATUSES}"
        )

    if body.reliability is not None and not (0 <= body.reliability <= 100):
        raise HTTPException(
            status_code=422,
            detail="Reliability must be between 0 and 100"
        )

    update_data = {
        "status": body.status,
        "last_updated": datetime.now(timezone.utc).isoformat(),
    }
    if body.reliability is not None:
        update_data["reliability"] = body.reliability

    result = db.table("feeders").update(update_data).eq("id", feeder_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Feeder not found")

    cache_delete_pattern(cache, "feeders:*")

    SMS_TRIGGER_STATUSES = {"fault", "load_shedding", "maintenance", "on"}
    if body.status in SMS_TRIGGER_STATUSES:
        try:
            await _send_feeder_sms_alerts(
                db         = db,
                feeder     = result.data[0],
                new_status = body.status,
            )
        except Exception as e:
            print(f"SMS alert error for feeder {feeder_id}: {e}")

    return {
        "updated": True,
        "feeder_id": feeder_id,
        "new_status": body.status,
        "updated_by": admin["email"],
    }
@router.get("/map/geojson")
def get_feeders_map(
    db: Client = Depends(get_supabase),
    cache: redis_lib.Redis = Depends(get_redis),
):
    cache_key = "feeders:geojson"
    cached = cache_get(cache, cache_key)
    if cached:
        return cached

    result = db.rpc("get_feeders_geojson", {}).execute()
    geojson = result.data

    cache_set(cache, cache_key, geojson, TTL_FEEDERS)
    return geojson

async def _send_feeder_sms_alerts(db, feeder: dict, new_status: str):
    feeder_id = feeder["id"]

    from app.utils.timezone import today_pkt
    schedule_result = (
        db.table("schedules")
        .select("end_time, type")
        .eq("feeder_id", feeder_id)
        .eq("schedule_date", str(today_pkt()))
        .eq("type", "scheduled")
        .order("start_time")
        .limit(1)
        .execute()
    )
    end_time = schedule_result.data[0]["end_time"] if schedule_result.data else None

    message = build_status_change_message(
        feeder_name = feeder.get("name", ""),
        feeder_code = feeder.get("feeder_code", ""),
        new_status  = new_status,
        sector      = feeder.get("sector", ""),
        end_time    = end_time,
    )

    subs = (
        db.table("sms_subscriptions")
        .select("phone, last_sms_at")
        .eq("feeder_id", feeder_id)
        .eq("is_active", True)
        .execute()
    )

    sent = 0
    for sub in (subs.data or []):
        if not should_send_sms(sub.get("last_sms_at")):
            continue
        result = await send_sms(
            to_number = sub["phone"],
            message   = message,
            feeder_id = feeder_id,
            trigger   = f"status_change:{new_status}",
            db        = db,
        )
        if result["success"]:
            db.table("sms_subscriptions").update(
                {"last_sms_at": "now()"}
            ).eq("phone", sub["phone"]).eq("feeder_id", feeder_id).execute()
            sent += 1

    print(f"SMS alerts sent for feeder {feeder_id} status={new_status}: {sent}/{len(subs.data or [])}")
