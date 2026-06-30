from fastapi import APIRouter, Depends, HTTPException, Query, Path, Request
from app.rate_limit import limiter
from typing import Optional

from app.config       import get_supabase, get_redis
from app.dependencies import require_admin
from app.cache        import (
    cache_get, cache_set, cache_delete_pattern, TTL_SERVICES
)
from app.schemas.service import (
    ServiceProviderCreate, ServiceProviderUpdate,
    RatingSubmit, VALID_PROVIDER_TYPES, PROVIDER_TYPE_LABELS,
)
from app.utils.rating import compute_new_average, rating_label
import redis as redis_lib
from supabase import Client

router = APIRouter(prefix="/services", tags=["Services"])


@router.get(
    "/types",
    summary="List all service provider types",
)
def get_provider_types():
    return {
        "types": [
            {"value": k, "label": v}
            for k, v in PROVIDER_TYPE_LABELS.items()
        ]
    }


@router.get(
    "/",
    summary="List service providers with filters and search",
)
def list_providers(
    provider_type:  Optional[str]  = Query(None),
    area:           Optional[str]  = Query(None, description="Filter by area, partial match"),
    search:         Optional[str]  = Query(None, min_length=2, description="Search by name or area"),
    verified_only:  bool           = Query(True,  description="Only show IESCO-verified providers"),
    available_only: bool           = Query(True,  description="Only show currently available providers"),
    min_rating:     Optional[float]= Query(None, ge=0, le=5),
    page:           int            = Query(1,    ge=1),
    page_size:      int            = Query(20,   ge=1, le=100),
    db:             Client          = Depends(get_supabase),
    cache:          redis_lib.Redis = Depends(get_redis),
):
    cache_key = (
        f"services:list:{provider_type}:{area}:{search}:"
        f"{verified_only}:{available_only}:{min_rating}:{page}"
    )
    cached = cache_get(cache, cache_key)
    if cached:
        return {"source": "cache", **cached}

    offset = (page - 1) * page_size
    query  = (
        db.table("service_providers")
        .select("*", count="exact")
    )

    if provider_type:
        if provider_type not in VALID_PROVIDER_TYPES:
            raise HTTPException(
                status_code=422,
                detail=f"Invalid provider_type. Must be one of: {sorted(VALID_PROVIDER_TYPES)}"
            )
        query = query.eq("provider_type", provider_type)

    if verified_only:
        query = query.eq("is_verified", True)

    if available_only:
        query = query.eq("is_available", True)

    if area:
        query = query.ilike("area", f"%{area}%")

    if search:
        query = query.or_(
            f"name.ilike.%{search}%,area.ilike.%{search}%"
        )

    if min_rating is not None:
        query = query.gte("rating", min_rating)

    result = (
        query
        .order("rating", desc=True)
        .order("total_reviews", desc=True)
        .order("name")
        .range(offset, offset + page_size - 1)
        .execute()
    )

    providers = []
    for p in result.data:
        providers.append({
            **p,
            "rating_label": rating_label(float(p.get("rating") or 0)),
            "type_label":   PROVIDER_TYPE_LABELS.get(p.get("provider_type"), ""),
        })

    response = {
        "data":      providers,
        "total":     result.count,
        "page":      page,
        "page_size": page_size,
        "pages":     -(-result.count // page_size) if result.count else 0,
    }

    cache_set(cache, cache_key, response, TTL_SERVICES)
    return {"source": "database", **response}


@router.get(
    "/areas",
    summary="List all unique areas with provider counts",
)
def list_areas(
    db:    Client          = Depends(get_supabase),
    cache: redis_lib.Redis = Depends(get_redis),
):
    cache_key = "services:areas"
    cached    = cache_get(cache, cache_key)
    if cached:
        return cached

    result = (
        db.table("service_providers")
        .select("area")
        .eq("is_verified", True)
        .eq("is_available", True)
        .execute()
    )

    area_counts: dict[str, int] = {}
    for row in result.data:
        area = row.get("area", "").strip()
        if area:
            area_counts[area] = area_counts.get(area, 0) + 1

    areas = sorted(
        [{"area": k, "count": v} for k, v in area_counts.items()],
        key=lambda x: x["area"]
    )

    response = {"areas": areas, "total": len(areas)}
    cache_set(cache, cache_key, response, TTL_SERVICES)
    return response


@router.get(
    "/{provider_id}",
    summary="Get a single provider with full details",
)
def get_provider(
    provider_id: str = Path(...),
    db:          Client          = Depends(get_supabase),
    cache:       redis_lib.Redis = Depends(get_redis),
):
    cache_key = f"services:single:{provider_id}"
    cached    = cache_get(cache, cache_key)
    if cached:
        return cached

    result = (
        db.table("service_providers")
        .select("*")
        .eq("id", provider_id)
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Provider not found")

    provider = {
        **result.data[0],
        "rating_label": rating_label(float(result.data[0].get("rating") or 0)),
        "type_label":   PROVIDER_TYPE_LABELS.get(
            result.data[0].get("provider_type"), ""
        ),
    }

    cache_set(cache, cache_key, provider, TTL_SERVICES)
    return provider


@router.post(
    "/{provider_id}/rating",
    summary="Submit a rating for a provider",
    status_code=201,
)
@limiter.limit("3/day")
def submit_rating(
    request: Request,
    provider_id: str = Path(...),
    body:        RatingSubmit = ...,
    db:          Client          = Depends(get_supabase),
    cache:       redis_lib.Redis = Depends(get_redis),
):
    existing = (
        db.table("service_providers")
        .select("id, rating, total_reviews, is_verified")
        .eq("id", provider_id)
        .execute()
    )

    if not existing.data:
        raise HTTPException(status_code=404, detail="Provider not found")

    provider = existing.data[0]

    if not provider["is_verified"]:
        raise HTTPException(
            status_code=422,
            detail="Ratings can only be submitted for IESCO-verified providers"
        )

    current_avg     = float(provider.get("rating") or 0.0)
    current_reviews = int(provider.get("total_reviews") or 0)

    new_avg, new_total = compute_new_average(
        current_avg, current_reviews, body.rating
    )

    update_result = (
        db.table("service_providers")
        .update({"rating": new_avg, "total_reviews": new_total})
        .eq("id", provider_id)
        .execute()
    )

    cache_delete_pattern(cache, f"services:single:{provider_id}")
    cache_delete_pattern(cache, "services:list:*")

    return {
        "recorded":      True,
        "provider_id":   provider_id,
        "submitted":     body.rating,
        "new_average":   new_avg,
        "new_total":     new_total,
        "rating_label":  rating_label(new_avg),
    }


@router.post(
    "/",
    status_code=201,
    summary="Create a new service provider listing (admin only)",
)
def create_provider(
    body:  ServiceProviderCreate,
    admin: dict            = Depends(require_admin),
    db:    Client          = Depends(get_supabase),
    cache: redis_lib.Redis = Depends(get_redis),
):
    result = db.table("service_providers").insert({
        "name":           body.name,
        "provider_type":  body.provider_type,
        "area":           body.area,
        "address":        body.address,
        "phone":          body.phone,
        "whatsapp":       body.whatsapp,
        "license_number": body.license_number,
        "is_verified":    False,
        "is_available":   True,
        "rating":         0.0,
        "total_reviews":  0,
    }).execute()

    cache_delete_pattern(cache, "services:*")
    return {
        **result.data[0],
        "message": (
            "Provider created. Use PATCH /services/{id}/verify to "
            "verify them and make them visible in the public directory."
        ),
    }


@router.patch(
    "/{provider_id}",
    summary="Update provider details (admin only)",
)
def update_provider(
    provider_id: str = Path(...),
    body:        ServiceProviderUpdate = ...,
    admin:       dict            = Depends(require_admin),
    db:          Client          = Depends(get_supabase),
    cache:       redis_lib.Redis = Depends(get_redis),
):
    updates = body.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=422, detail="No fields provided to update")

    result = (
        db.table("service_providers")
        .update(updates)
        .eq("id", provider_id)
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Provider not found")

    cache_delete_pattern(cache, "services:*")
    return result.data[0]


@router.patch(
    "/{provider_id}/verify",
    summary="Verify or un-verify a provider (admin only)",
)
def toggle_verification(
    provider_id: str,
    verify:      bool = Query(True, description="True to verify, False to remove verification"),
    admin:       dict            = Depends(require_admin),
    db:          Client          = Depends(get_supabase),
    cache:       redis_lib.Redis = Depends(get_redis),
):
    existing = (
        db.table("service_providers")
        .select("id, name, license_number, is_verified")
        .eq("id", provider_id)
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Provider not found")

    provider = existing.data[0]

    if verify and not provider.get("license_number"):
        pass

    result = (
        db.table("service_providers")
        .update({"is_verified": verify})
        .eq("id", provider_id)
        .execute()
    )

    cache_delete_pattern(cache, "services:*")
    return {
        "provider_id":  provider_id,
        "name":         provider["name"],
        "is_verified":  verify,
        "message":      (
            f"Provider is now IESCO-verified and visible in the public directory"
            if verify else
            f"Provider verification removed - hidden from public directory"
        ),
    }


@router.patch(
    "/{provider_id}/availability",
    summary="Toggle provider availability (admin or provider)",
)
def toggle_availability(
    provider_id:   str,
    is_available:  bool = Query(..., description="True = taking new jobs, False = not available"),
    admin:         dict            = Depends(require_admin),
    db:            Client          = Depends(get_supabase),
    cache:         redis_lib.Redis = Depends(get_redis),
):
    result = (
        db.table("service_providers")
        .update({"is_available": is_available})
        .eq("id", provider_id)
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Provider not found")

    cache_delete_pattern(cache, "services:*")
    return {
        "provider_id":  provider_id,
        "is_available": is_available,
        "message":      (
            "Provider is now marked as available"
            if is_available else
            "Provider marked as unavailable - hidden from citizen search"
        ),
    }


@router.delete(
    "/{provider_id}",
    summary="Delete a provider listing (admin only)",
)
def delete_provider(
    provider_id: str = Path(...),
    admin:       dict            = Depends(require_admin),
    db:          Client          = Depends(get_supabase),
    cache:       redis_lib.Redis = Depends(get_redis),
):
    result = (
        db.table("service_providers")
        .delete()
        .eq("id", provider_id)
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Provider not found")

    cache_delete_pattern(cache, "services:*")
    return {"deleted": True, "id": provider_id}
