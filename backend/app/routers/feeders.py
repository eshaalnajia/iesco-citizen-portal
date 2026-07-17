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
from app.utils.timezone import today_pkt, is_currently_active
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


def _apply_live_schedule_status(feeders: list[dict], db: Client) -> list[dict]:
    """
    Overlays live schedule-derived status onto feeders. A feeder with an
    active 'scheduled' outage right now is shown as load_shedding even if
    its stored status column says otherwise - unless it's already in a
    higher-priority manual state (fault, maintenance), which always wins.
    """
    MANUAL_OVERRIDE_STATUSES = {"fault", "maintenance"}
    feeder_ids = [f["id"] for f in feeders]
    if not feeder_ids:
        return feeders

    today = today_pkt()
    schedules = (
        db.table("schedules")
        .select("feeder_id, schedule_date, start_time, end_time, type")
        .in_("feeder_id", feeder_ids)
        .eq("schedule_date", str(today))
        .eq("type", "scheduled")
        .execute()
    )

    active_feeder_ids = set()
    for s in (schedules.data or []):
        if is_currently_active(today, s["start_time"], s["end_time"]):
            active_feeder_ids.add(s["feeder_id"])

    for f in feeders:
        if f["id"] in active_feeder_ids and f["status"] not in MANUAL_OVERRIDE_STATUSES:
            f["status"] = "load_shedding"

    return feeders


@router.get("/")
def list_feeders(
    sector: Optional[str] = None,
    db: Client = Depends(get_supabase),
    cache: redis_lib.Redis = Depends(get_redis),
):
    cache_key = f"feeders:{sector or 'all'}"
    cached = cache_get(cache, cache_key)
    if cached:
        cached = _apply_live_schedule_status(cached, db)
        return {"data": cached, "source": "cache"}

    query = db.table("feeders").select(
        "id, feeder_code, name, sector, status, reliability, last_updated"
    )
    if sector:
        query = query.eq("sector", sector)

    result = query.order("sector").execute()
    cache_set(cache, cache_key, result.data, TTL_FEEDERS)
    data = _apply_live_schedule_status(result.data, db)
    return {"data": data, "source": "database"}


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
def _apply_live_status_to_geojson(geojson: dict, db: Client) -> dict:
    """
    Overlays live schedule-derived status onto each feature's status property,
    same logic as _apply_live_schedule_status but for GeoJSON feature shape.
    """
    if not geojson or not geojson.get("features"):
        return geojson

    MANUAL_OVERRIDE_STATUSES = {"fault", "maintenance"}
    feeder_ids = [
        feat["properties"]["id"]
        for feat in geojson["features"]
        if feat.get("properties", {}).get("id")
    ]
    if not feeder_ids:
        return geojson

    today = today_pkt()
    schedules = (
        db.table("schedules")
        .select("feeder_id, schedule_date, start_time, end_time, type")
        .in_("feeder_id", feeder_ids)
        .eq("schedule_date", str(today))
        .eq("type", "scheduled")
        .execute()
    )

    active_feeder_ids = set()
    for s in (schedules.data or []):
        if is_currently_active(today, s["start_time"], s["end_time"]):
            active_feeder_ids.add(s["feeder_id"])

    for feat in geojson["features"]:
        props = feat.get("properties", {})
        fid = props.get("id")
        if fid in active_feeder_ids and props.get("status") not in MANUAL_OVERRIDE_STATUSES:
            props["status"] = "load_shedding"

    return geojson


@router.get("/map/geojson")
def get_feeders_map(
    db: Client = Depends(get_supabase),
    cache: redis_lib.Redis = Depends(get_redis),
):
    cache_key = "feeders:geojson"
    cached = cache_get(cache, cache_key)
    if cached:
        cached = _apply_live_status_to_geojson(cached, db)
        return cached

    result = db.rpc("get_feeders_geojson", {}).execute()
    geojson = result.data

    cache_set(cache, cache_key, geojson, TTL_FEEDERS)
    geojson = _apply_live_status_to_geojson(geojson, db)
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
