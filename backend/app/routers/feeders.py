from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
from app.config import get_supabase, get_redis
from app.dependencies import require_admin
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
def update_feeder_status(
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

    update_data = {
        "status": body.status,
        "last_updated": datetime.now(timezone.utc).isoformat(),
    }

    result = db.table("feeders").update(update_data).eq("id", feeder_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Feeder not found")

    cache_delete_pattern(cache, "feeders:*")

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
