from fastapi import APIRouter, Depends, HTTPException, Query, Path
from typing import Optional

from app.config       import get_supabase, get_redis
from app.dependencies import require_admin
from app.cache        import cache_get, cache_set, cache_delete_pattern, TTL_LOCATIONS
from app.schemas.location import LocationCreate, LocationUpdate
import redis as redis_lib
from supabase import Client

router = APIRouter(prefix="/locations", tags=["Locations"])


# -- Public endpoints ----------------------------------------------------------

@router.get(
    "/sectors",
    summary="List all unique sectors in the directory",
)
def list_sectors(
    db:    Client          = Depends(get_supabase),
    cache: redis_lib.Redis = Depends(get_redis),
):
    cache_key = "locations:sectors"
    cached    = cache_get(cache, cache_key)
    if cached:
        return cached

    result = (
        db.table("locations")
        .select("area_type, name")
        .order("area_type")
        .order("name")
        .execute()
    )

    grouped: dict[str, list[str]] = {}
    for row in result.data:
        area_type = row["area_type"]
        grouped.setdefault(area_type, []).append(row["name"])

    area_type_labels = {
        "sector":         "Islamabad Sectors",
        "satellite_town": "Satellite Towns",
        "cantonment":     "Cantonments",
        "rural":          "Rural Areas",
    }

    response = {
        "groups": [
            {
                "area_type": k,
                "label":     area_type_labels.get(k, k),
                "locations": v,
            }
            for k, v in grouped.items()
        ],
        "total": len(result.data),
    }

    cache_set(cache, cache_key, response, TTL_LOCATIONS)
    return response


@router.get(
    "/nearest",
    summary="Find the nearest IESCO office to a GPS coordinate",
)
def find_nearest(
    lat:   float = Query(..., ge=-90,  le=90,  description="Latitude"),
    lng:   float = Query(..., ge=-180, le=180, description="Longitude"),
    limit: int   = Query(3,   ge=1,    le=10,  description="Number of results"),
    db:    Client = Depends(get_supabase),
):
    try:
        result = db.rpc("nearest_locations", {
            "user_lat":     lat,
            "user_lng":     lng,
            "result_limit": limit,
        }).execute()
    except Exception:
        all_locations = (
            db.table("locations")
            .select("*, feeders(feeder_code, name, status)")
            .execute()
        )

        def haversine_km(lat1, lon1, lat2, lon2):
            from math import radians, sin, cos, sqrt, atan2
            R = 6371
            dlat = radians(lat2 - lat1)
            dlon = radians(lon2 - lon1)
            a = (sin(dlat/2)**2 +
                 cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2)**2)
            return R * 2 * atan2(sqrt(a), sqrt(1 - a))

        locations_with_dist = [
            {
                **loc,
                "distance_km": round(
                    haversine_km(lat, lng, float(loc["lat"]), float(loc["lng"])), 2
                ),
            }
            for loc in all_locations.data
            if loc.get("lat") and loc.get("lng")
        ]

        sorted_locs = sorted(
            locations_with_dist, key=lambda x: x["distance_km"]
        )[:limit]

        return {
            "data":        sorted_locs,
            "query_point": {"lat": lat, "lng": lng},
            "count":       len(sorted_locs),
        }

    return {
        "data":        result.data[:limit] if result.data else [],
        "query_point": {"lat": lat, "lng": lng},
        "count":       len(result.data[:limit] if result.data else []),
    }


@router.get(
    "/",
    summary="List all locations with optional search and filter",
)
def list_locations(
    search:    Optional[str] = Query(None, min_length=2,
                                     description="Full-text search by area name"),
    area_type: Optional[str] = Query(None,
                                     description="sector | satellite_town | cantonment | rural"),
    page:      int           = Query(1,  ge=1),
    page_size: int           = Query(30, ge=1, le=100),
    db:        Client          = Depends(get_supabase),
    cache:     redis_lib.Redis = Depends(get_redis),
):
    cache_key = f"locations:list:{search}:{area_type}:{page}"
    cached    = cache_get(cache, cache_key)
    if cached:
        return {"source": "cache", **cached}

    offset = (page - 1) * page_size
    query  = (
        db.table("locations")
        .select(
            "id, name, area_type, lat, lng, office_name, "
            "office_address, office_phone, complaint_phone, "
            "office_hours, feeder_id, "
            "feeders(feeder_code, name, status, reliability)",
            count="exact",
        )
    )

    if area_type:
        query = query.eq("area_type", area_type)

    query = query.order("area_type").order("name")

    all_results = query.execute()

    if search:
        search_lower = search.lower()
        filtered = [r for r in all_results.data if search_lower in r["name"].lower()]
    else:
        filtered = all_results.data

    total = len(filtered)
    paged = filtered[offset:offset + page_size]

    response = {
        "data":      paged,
        "total":     total,
        "page":      page,
        "page_size": page_size,
        "pages":     -(-total // page_size) if total else 0,
    }

    cache_set(cache, cache_key, response, TTL_LOCATIONS)
    return {"source": "database", **response}


@router.get(
    "/{location_id}",
    summary="Get a single location with full feeder and schedule details",
)
def get_location(
    location_id: str = Path(...),
    db:          Client          = Depends(get_supabase),
    cache:       redis_lib.Redis = Depends(get_redis),
):
    cache_key = f"locations:single:{location_id}"
    cached    = cache_get(cache, cache_key)
    if cached:
        return cached

    result = (
        db.table("locations")
        .select(
            "*, feeders(feeder_code, name, status, reliability, last_updated)"
        )
        .eq("id", location_id)
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Location not found")

    location = result.data[0]

    if location.get("feeder_id"):
        from app.utils.timezone import today_pkt
        schedule_result = (
            db.table("schedules")
            .select("start_time, end_time, duration_hours, type")
            .eq("feeder_id", location["feeder_id"])
            .eq("schedule_date", str(today_pkt()))
            .order("start_time")
            .execute()
        )
        location["todays_schedule"] = schedule_result.data
    else:
        location["todays_schedule"] = []

    cache_set(cache, cache_key, location, 300)
    return location


# -- Admin endpoints -----------------------------------------------------------

@router.post(
    "/",
    status_code=201,
    summary="Create a new location entry (admin only)",
)
def create_location(
    body:  LocationCreate,
    admin: dict            = Depends(require_admin),
    db:    Client          = Depends(get_supabase),
    cache: redis_lib.Redis = Depends(get_redis),
):
    if body.feeder_id:
        feeder = db.table("feeders").select("id").eq(
            "id", body.feeder_id
        ).execute()
        if not feeder.data:
            raise HTTPException(
                status_code=404,
                detail=f"Feeder with id '{body.feeder_id}' not found"
            )

    result = db.table("locations").insert(body.model_dump()).execute()
    cache_delete_pattern(cache, "locations:*")
    return result.data[0]


@router.patch(
    "/{location_id}",
    summary="Update a location entry (admin only)",
)
def update_location(
    location_id: str = Path(...),
    body:        LocationUpdate = ...,
    admin:       dict            = Depends(require_admin),
    db:          Client          = Depends(get_supabase),
    cache:       redis_lib.Redis = Depends(get_redis),
):
    updates = body.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=422, detail="No fields provided to update")

    if "feeder_id" in updates and updates["feeder_id"]:
        feeder = db.table("feeders").select("id").eq(
            "id", updates["feeder_id"]
        ).execute()
        if not feeder.data:
            raise HTTPException(
                status_code=404,
                detail=f"Feeder '{updates['feeder_id']}' not found"
            )

    result = (
        db.table("locations")
        .update(updates)
        .eq("id", location_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Location not found")

    cache_delete_pattern(cache, "locations:*")
    return result.data[0]


@router.delete(
    "/{location_id}",
    summary="Delete a location entry (admin only)",
)
def delete_location(
    location_id: str = Path(...),
    admin:       dict            = Depends(require_admin),
    db:          Client          = Depends(get_supabase),
    cache:       redis_lib.Redis = Depends(get_redis),
):
    result = db.table("locations").delete().eq("id", location_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Location not found")
    cache_delete_pattern(cache, "locations:*")
    return {"deleted": True, "id": location_id}


