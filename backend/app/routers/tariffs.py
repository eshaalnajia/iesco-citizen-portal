from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import date
from app.config import get_supabase, get_redis
from app.dependencies import require_admin
from app.cache import cache_get, cache_set, cache_delete_pattern, TTL_TARIFFS
import redis as redis_lib
from supabase import Client

router = APIRouter(prefix="/tariffs", tags=["Tariffs"])


@router.get("/")
def get_tariffs(
    consumer_type: str = "residential",
    db: Client = Depends(get_supabase),
    cache: redis_lib.Redis = Depends(get_redis),
):
    cache_key = f"tariffs:{consumer_type}"
    cached = cache_get(cache, cache_key)
    if cached:
        return {"data": cached, "source": "cache"}

    result = db.table("tariffs").select("*").eq(
        "consumer_type", consumer_type
    ).eq("is_current", True).order("units_from").execute()

    cache_set(cache, cache_key, result.data, TTL_TARIFFS)
    return {"data": result.data, "source": "database"}


class TariffSlabCreate(BaseModel):
    consumer_type: str
    units_from: int
    units_to: Optional[int] = None
    rate_per_unit: float
    fixed_charge: float = 0.0
    effective_from: date


@router.post("/")
def create_tariff_revision(
    slabs: List[TariffSlabCreate],
    admin: dict = Depends(require_admin),
    db: Client = Depends(get_supabase),
    cache: redis_lib.Redis = Depends(get_redis),
):
    if not slabs:
        raise HTTPException(status_code=422, detail="At least one slab is required")

    consumer_type = slabs[0].consumer_type

    db.table("tariffs").update({
        "is_current": False,
        "effective_to": str(date.today())
    }).eq("consumer_type", consumer_type).eq("is_current", True).execute()

    new_rows = [
        {
            "consumer_type": s.consumer_type,
            "units_from": s.units_from,
            "units_to": s.units_to,
            "rate_per_unit": s.rate_per_unit,
            "fixed_charge": s.fixed_charge,
            "effective_from": str(s.effective_from),
            "is_current": True,
        }
        for s in slabs
    ]
    result = db.table("tariffs").insert(new_rows).execute()

    cache_delete_pattern(cache, "tariffs:*")
    return {"created": len(result.data), "slabs": result.data}
