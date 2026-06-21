from fastapi import APIRouter, Depends, HTTPException, Query, Path
from typing import Optional

from app.config       import get_supabase, get_redis
from app.dependencies import require_admin
from app.cache        import cache_get, cache_set, cache_delete_pattern, TTL_TARIFFS
from app.schemas.tariff import (
    TariffRevisionCreate, TariffSlabUpdate, BillCalculationRequest
)
from app.utils.tariff_calculator import calculate_bill
import redis as redis_lib
from supabase import Client

router = APIRouter(prefix="/tariffs", tags=["Tariffs"])


@router.get("/consumer-types", summary="List all available consumer types")
def get_consumer_types():
    return {
        "types": [
            {"value": "residential",   "label": "Residential (domestic)", "description": "Households and apartments"},
            {"value": "commercial",    "label": "Commercial",             "description": "Shops, offices, restaurants"},
            {"value": "industrial",    "label": "Industrial",             "description": "Factories and manufacturing"},
            {"value": "agricultural",  "label": "Agricultural",           "description": "Tube wells and farming"},
        ]
    }


@router.get("/current", summary="Current tariff slabs for a consumer type")
def get_current_tariffs(
    consumer_type: str = Query("residential"),
    db: Client = Depends(get_supabase),
    cache: redis_lib.Redis = Depends(get_redis),
):
    cache_key = f"tariffs:current:{consumer_type}"
    cached = cache_get(cache, cache_key)
    if cached:
        return {"data": cached, "consumer_type": consumer_type, "source": "cache"}

    result = (
        db.table("tariffs")
        .select("*")
        .eq("consumer_type", consumer_type)
        .eq("is_current", True)
        .order("units_from")
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=404,
            detail=f"No current tariff slabs found for consumer type '{consumer_type}'."
        )

    cache_set(cache, cache_key, result.data, TTL_TARIFFS)
    return {
        "data": result.data,
        "consumer_type": consumer_type,
        "effective_from": result.data[0].get("effective_from"),
        "source": "database",
    }


@router.get("/", summary="List tariff slabs with optional filters")
def list_tariffs(
    consumer_type: Optional[str] = Query(None),
    is_current: Optional[bool] = Query(None),
    db: Client = Depends(get_supabase),
    cache: redis_lib.Redis = Depends(get_redis),
):
    cache_key = f"tariffs:list:{consumer_type}:{is_current}"
    cached = cache_get(cache, cache_key)
    if cached:
        return {"data": cached, "source": "cache"}

    query = db.table("tariffs").select("*")

    if consumer_type:
        query = query.eq("consumer_type", consumer_type)

    if is_current is not None:
        query = query.eq("is_current", is_current)

    result = (
        query
        .order("consumer_type")
        .order("effective_from", desc=True)
        .order("units_from")
        .execute()
    )

    cache_set(cache, cache_key, result.data, TTL_TARIFFS)
    return {"data": result.data, "source": "database"}


@router.get("/history", summary="Rate revision history for a consumer type")
def get_rate_history(
    consumer_type: str = Query("residential"),
    db: Client = Depends(get_supabase),
    cache: redis_lib.Redis = Depends(get_redis),
):
    cache_key = f"tariffs:history:{consumer_type}"
    cached = cache_get(cache, cache_key)
    if cached:
        return cached

    result = (
        db.table("tariffs")
        .select("*")
        .eq("consumer_type", consumer_type)
        .order("effective_from", desc=True)
        .order("units_from")
        .execute()
    )

    revisions = {}
    for slab in result.data:
        key = str(slab["effective_from"])
        if key not in revisions:
            revisions[key] = {
                "effective_from": key,
                "is_current": slab["is_current"],
                "slabs": [],
            }
        revisions[key]["slabs"].append(slab)

    response = {
        "consumer_type": consumer_type,
        "revisions": list(revisions.values()),
        "total_revisions": len(revisions),
    }
    cache_set(cache, cache_key, response, TTL_TARIFFS)
    return response


@router.get("/calculate", summary="Calculate a bill for given units consumed")
def calculate_tariff(
    units_consumed: int = Query(..., ge=0),
    consumer_type: str = Query("residential"),
    peak_hours_pct: float = Query(0.3, ge=0, le=1),
    db: Client = Depends(get_supabase),
    cache: redis_lib.Redis = Depends(get_redis),
):
    cache_key = f"tariffs:calc:{consumer_type}:{units_consumed}:{peak_hours_pct}"
    cached = cache_get(cache, cache_key)
    if cached:
        return cached

    slabs_result = (
        db.table("tariffs")
        .select("*")
        .eq("consumer_type", consumer_type)
        .eq("is_current", True)
        .order("units_from")
        .execute()
    )

    if not slabs_result.data:
        raise HTTPException(
            status_code=404,
            detail=f"No current tariff slabs found for '{consumer_type}'"
        )

    try:
        result = calculate_bill(
            units_consumed=units_consumed,
            slabs=slabs_result.data,
            consumer_type=consumer_type,
            peak_hours_pct=peak_hours_pct,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    response = result.model_dump()
    cache_set(cache, cache_key, response, TTL_TARIFFS)
    return response


@router.post("/revision", status_code=201, summary="Submit a new NEPRA rate revision (admin only)")
def create_revision(
    body: TariffRevisionCreate,
    admin: dict = Depends(require_admin),
    db: Client = Depends(get_supabase),
    cache: redis_lib.Redis = Depends(get_redis),
):
    consumer_type = body.slabs[0].consumer_type
    effective_from = str(body.slabs[0].effective_from)

    existing_revision = (
        db.table("tariffs")
        .select("id")
        .eq("consumer_type", consumer_type)
        .eq("effective_from", effective_from)
        .limit(1)
        .execute()
    )
    if existing_revision.data:
        raise HTTPException(
            status_code=409,
            detail=f"A revision for '{consumer_type}' effective {effective_from} already exists."
        )

    db.table("tariffs").update({
        "is_current": False,
    }).eq("consumer_type", consumer_type).eq("is_current", True).execute()

    new_rows = [
        {
            "slab_name":      s.slab_name,
            "consumer_type":  s.consumer_type,
            "units_from":     s.units_from,
            "units_to":       s.units_to,
            "peak_rate":      s.peak_rate,
            "offpeak_rate":   s.offpeak_rate,
            "fixed_charge":   s.fixed_charge,
            "fc_surcharge":   s.fc_surcharge,
            "tr_surcharge":   s.tr_surcharge,
            "effective_from": str(s.effective_from),
            "is_current":     True,
            "updated_by":     admin["user_id"],
        }
        for s in body.slabs
    ]

    result = db.table("tariffs").insert(new_rows).execute()

    cache_delete_pattern(cache, "tariffs:*")
    return {
        "message": f"Rate revision for '{consumer_type}' created successfully",
        "effective_from": effective_from,
        "slabs_created": len(result.data),
        "consumer_type": consumer_type,
        "slabs": result.data,
    }


@router.patch("/{tariff_id}", summary="Update a single tariff slab (admin only)")
def update_tariff_slab(
    tariff_id: str,
    body: TariffSlabUpdate,
    admin: dict = Depends(require_admin),
    db: Client = Depends(get_supabase),
    cache: redis_lib.Redis = Depends(get_redis),
):
    updates = body.model_dump(exclude_none=True)

    if not updates:
        raise HTTPException(status_code=422, detail="No fields provided to update")

    updates["updated_by"] = admin["user_id"]

    result = (
        db.table("tariffs")
        .update(updates)
        .eq("id", tariff_id)
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Tariff slab not found")

    cache_delete_pattern(cache, "tariffs:*")
    return result.data[0]


@router.delete("/{tariff_id}", summary="Delete a tariff slab (admin only)")
def delete_tariff_slab(
    tariff_id: str,
    admin: dict = Depends(require_admin),
    db: Client = Depends(get_supabase),
    cache: redis_lib.Redis = Depends(get_redis),
):
    existing = db.table("tariffs").select("is_current, consumer_type").eq(
        "id", tariff_id
    ).execute()

    if not existing.data:
        raise HTTPException(status_code=404, detail="Tariff slab not found")

    slab = existing.data[0]
    if slab["is_current"]:
        raise HTTPException(
            status_code=409,
            detail="Cannot delete a current tariff slab. Submit a new revision instead."
        )

    db.table("tariffs").delete().eq("id", tariff_id).execute()
    cache_delete_pattern(cache, "tariffs:*")
    return {"deleted": True, "id": tariff_id}
