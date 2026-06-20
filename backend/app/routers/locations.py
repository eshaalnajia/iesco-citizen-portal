from fastapi import APIRouter, Depends, Query
from typing import Optional
from app.config import get_supabase, get_redis
from app.cache import cache_get, cache_set, TTL_LOCATIONS
import redis as redis_lib
from supabase import Client

router = APIRouter(prefix="/locations", tags=["Locations"])


@router.get("/")
def list_locations(
    search: Optional[str] = Query(None, min_length=2),
    sector: Optional[str] = Query(None),
    db: Client = Depends(get_supabase),
    cache: redis_lib.Redis = Depends(get_redis),
):
    cache_key = f"locations:{search}:{sector}"
    cached = cache_get(cache, cache_key)
    if cached:
        return {"data": cached, "source": "cache"}

    query = db.table("locations").select(
        "*, feeders(feeder_code, name, status)"
    )

    if search:
        query = query.text_search("search_vector", search, config="english")

    if sector:
        query = query.eq("sector", sector)

    result = query.order("name").execute()
    cache_set(cache, cache_key, result.data, TTL_LOCATIONS)
    return {"data": result.data, "source": "database"}
