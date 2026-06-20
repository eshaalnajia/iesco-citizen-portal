from fastapi import APIRouter, Depends, Query, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.config import get_supabase, get_redis
from app.dependencies import require_admin
from app.cache import cache_get, cache_set, cache_delete_pattern, TTL_SERVICES
import redis as redis_lib
from supabase import Client

router = APIRouter(prefix="/services", tags=["Services"])


@router.get("/")
def list_providers(
    provider_type: Optional[str] = Query(None),
    area: Optional[str] = Query(None),
    db: Client = Depends(get_supabase),
    cache: redis_lib.Redis = Depends(get_redis),
):
    cache_key = f"services:{provider_type}:{area}"
    cached = cache_get(cache, cache_key)
    if cached:
        return {"data": cached, "source": "cache"}

    query = db.table("service_providers").select("*").eq("is_verified", True)

    if provider_type:
        query = query.eq("provider_type", provider_type)

    if area:
        query = query.ilike("area", f"%{area}%")

    result = query.order("rating", desc=True).execute()
    cache_set(cache, cache_key, result.data, TTL_SERVICES)
    return {"data": result.data, "source": "cache"}


class ProviderCreate(BaseModel):
    name: str
    provider_type: str
    area: str
    phone: str
    whatsapp: Optional[str] = None
    license_number: Optional[str] = None


@router.post("/")
def create_provider(
    body: ProviderCreate,
    admin: dict = Depends(require_admin),
    db: Client = Depends(get_supabase),
    cache: redis_lib.Redis = Depends(get_redis),
):
    result = db.table("service_providers").insert({
        "name": body.name,
        "provider_type": body.provider_type,
        "area": body.area,
        "phone": body.phone,
        "whatsapp": body.whatsapp,
        "license_number": body.license_number,
        "is_verified": False,
    }).execute()
    cache_delete_pattern(cache, "services:*")
    return result.data[0]


@router.patch("/{provider_id}/verify")
def verify_provider(
    provider_id: str,
    admin: dict = Depends(require_admin),
    db: Client = Depends(get_supabase),
    cache: redis_lib.Redis = Depends(get_redis),
):
    result = db.table("service_providers").update(
        {"is_verified": True}
    ).eq("id", provider_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Provider not found")
    cache_delete_pattern(cache, "services:*")
    return {"verified": True, "id": provider_id}
