from fastapi import APIRouter, Depends, HTTPException, Query, Path
from typing import Optional
from datetime import date, timedelta

from app.config    import get_supabase, get_redis
from app.dependencies import require_admin
from app.cache     import (
    cache_get, cache_set, cache_delete_pattern, TTL_SCHEDULES
)
from app.schemas.schedule import (
    ScheduleCreate, ScheduleUpdate, ScheduleBulkCreate
)
from app.utils.timezone import (
    today_pkt, date_range_pkt, is_currently_active
)
import redis as redis_lib
from supabase import Client

router = APIRouter(prefix="/schedules", tags=["Schedules"])

def _enrich_with_active_flag(schedules: list[dict]) -> list[dict]:
    for s in schedules:
        s["is_active"] = is_currently_active(
            date.fromisoformat(str(s["schedule_date"])),
            s["start_time"],
            s["end_time"],
        )
    return schedules


@router.get("/today", summary="Today's load shedding schedule across all of Islamabad")
def get_todays_schedules(
    sector: Optional[str] = Query(None),
    type:   Optional[str] = Query(None),
    db:     Client          = Depends(get_supabase),
    cache:  redis_lib.Redis = Depends(get_redis),
):
    today     = today_pkt()
    cache_key = f"schedules:today:{sector}:{type}"
    cached    = cache_get(cache, cache_key)
    if cached:
        return {"data": _enrich_with_active_flag(cached), "date": str(today), "source": "cache"}

    query = (
        db.table("schedules")
        .select("*, feeders(feeder_code, name, sector)")
        .eq("schedule_date", str(today))
    )
    if type:
        query = query.eq("type", type)

    result = query.order("start_time").execute()
    data = [r for r in result.data if r.get("feeders")]
    if sector:
        data = [r for r in data if r["feeders"]["sector"] == sector]

    cache_set(cache, cache_key, data, 60)
    return {"data": _enrich_with_active_flag(data), "date": str(today), "source": "database"}


@router.get("/active", summary="Outages happening right now in Pakistan time")
def get_active_outages(
    db:    Client          = Depends(get_supabase),
    cache: redis_lib.Redis = Depends(get_redis),
):
    cache_key = "schedules:active"
    cached    = cache_get(cache, cache_key)
    if cached:
        return {"data": cached, "count": len(cached)}

    today  = today_pkt()
    result = (
        db.table("schedules")
        .select("*, feeders(feeder_code, name, sector, id)")
        .eq("schedule_date", str(today))
        .order("start_time")
        .execute()
    )

    active = [
        r for r in result.data
        if r.get("feeders") and is_currently_active(
            date.fromisoformat(str(r["schedule_date"])),
            r["start_time"],
            r["end_time"],
        )
    ]

    cache_set(cache, cache_key, active, 30)
    return {"data": active, "count": len(active)}


@router.get("/feeder/{feeder_id}", summary="Upcoming schedule for a specific feeder")
def get_feeder_schedule(
    feeder_id:  str = Path(...),
    days_ahead: int = Query(7, ge=1, le=30),
    db:         Client          = Depends(get_supabase),
    cache:      redis_lib.Redis = Depends(get_redis),
):
    cache_key = f"schedules:feeder:{feeder_id}:{days_ahead}"
    cached    = cache_get(cache, cache_key)
    if cached:
        return {"data": _enrich_with_active_flag(cached), "source": "cache"}

    start, end = date_range_pkt(days_ahead)
    result = (
        db.table("schedules")
        .select("*, feeders(feeder_code, name, sector)")
        .eq("feeder_id", feeder_id)
        .gte("schedule_date", str(start))
        .lte("schedule_date", str(end))
        .order("schedule_date")
        .order("start_time")
        .execute()
    )

    cache_set(cache, cache_key, result.data, TTL_SCHEDULES)
    return {"data": _enrich_with_active_flag(result.data), "feeder_id": feeder_id, "from": str(start), "to": str(end), "source": "database"}


@router.get("/sector/{sector}", summary="Weekly schedule for an entire sector")
def get_sector_schedule(
    sector:     str = Path(...),
    days_ahead: int = Query(7, ge=1, le=30),
    db:         Client          = Depends(get_supabase),
    cache:      redis_lib.Redis = Depends(get_redis),
):
    cache_key = f"schedules:sector:{sector}:{days_ahead}"
    cached    = cache_get(cache, cache_key)
    if cached:
        return {"data": _enrich_with_active_flag(cached), "source": "cache"}

    start, end = date_range_pkt(days_ahead)
    feeder_result = (
        db.table("feeders")
        .select("id, feeder_code, name, sector")
        .eq("sector", sector)
        .execute()
    )

    if not feeder_result.data:
        raise HTTPException(status_code=404, detail=f"No feeders found for sector '{sector}'")

    feeder_ids = [f["id"] for f in feeder_result.data]
    result = (
        db.table("schedules")
        .select("*, feeders(feeder_code, name, sector)")
        .in_("feeder_id", feeder_ids)
        .gte("schedule_date", str(start))
        .lte("schedule_date", str(end))
        .order("schedule_date")
        .order("start_time")
        .execute()
    )

    grouped: dict[str, list] = {}
    for entry in result.data:
        day = str(entry["schedule_date"])
        grouped.setdefault(day, []).append(entry)

    cache_set(cache, cache_key, result.data, TTL_SCHEDULES)
    return {"sector": sector, "feeders": feeder_result.data, "from": str(start), "to": str(end), "by_date": grouped, "data": _enrich_with_active_flag(result.data), "source": "database"}


@router.get("/", summary="List schedules with optional filters")
def list_schedules(
    feeder_id:     Optional[str]  = Query(None),
    schedule_date: Optional[date] = Query(None),
    days_ahead:    int            = Query(7, ge=1, le=30),
    type:          Optional[str]  = Query(None),
    page:          int            = Query(1, ge=1),
    page_size:     int            = Query(50, ge=1, le=200),
    db:            Client          = Depends(get_supabase),
    cache:         redis_lib.Redis = Depends(get_redis),
):
    cache_key = f"schedules:list:{feeder_id}:{schedule_date}:{days_ahead}:{type}:{page}"
    cached    = cache_get(cache, cache_key)
    if cached:
        return cached

    offset = (page - 1) * page_size
    query  = db.table("schedules").select("*, feeders(feeder_code, name, sector)", count="exact")

    if feeder_id:
        query = query.eq("feeder_id", feeder_id)
    if schedule_date:
        query = query.eq("schedule_date", str(schedule_date))
    else:
        start, end = date_range_pkt(days_ahead)
        query = query.gte("schedule_date", str(start)).lte("schedule_date", str(end))
    if type:
        query = query.eq("type", type)

    result = query.order("schedule_date").order("start_time").range(offset, offset + page_size - 1).execute()

    response = {
        "data":      _enrich_with_active_flag(result.data),
        "total":     result.count,
        "page":      page,
        "page_size": page_size,
        "pages":     -(-result.count // page_size) if result.count else 0,
        "source":    "database",
    }
    cache_set(cache, cache_key, response, TTL_SCHEDULES)
    return response


@router.get("/{schedule_id}", summary="Get a single schedule entry by ID")
def get_schedule(
    schedule_id: str,
    db:          Client = Depends(get_supabase),
):
    result = db.table("schedules").select("*, feeders(feeder_code, name, sector)").eq("id", schedule_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Schedule not found")
    entry = result.data[0]
    entry["is_active"] = is_currently_active(
        date.fromisoformat(str(entry["schedule_date"])),
        entry["start_time"],
        entry["end_time"],
    )
    return entry


@router.post("/", status_code=201, summary="Create a schedule entry (admin only)")
def create_schedule(
    body:  ScheduleCreate,
    admin: dict            = Depends(require_admin),
    db:    Client          = Depends(get_supabase),
    cache: redis_lib.Redis = Depends(get_redis),
):
    feeder = db.table("feeders").select("id, name").eq("id", body.feeder_id).execute()
    if not feeder.data:
        raise HTTPException(status_code=404, detail=f"Feeder '{body.feeder_id}' not found")
    if body.start_time >= body.end_time:
        raise HTTPException(status_code=422, detail="end_time must be after start_time")

    try:
        result = db.table("schedules").insert({
            "feeder_id":     body.feeder_id,
            "schedule_date": str(body.schedule_date),
            "start_time":    body.start_time,
            "end_time":      body.end_time,
            "type":          body.type,
            "notes":         body.notes,
            "created_by":    admin["user_id"],
        }).execute()
    except Exception as e:
        err = str(e)
        if "no_overlap" in err or "exclusion constraint" in err.lower():
            raise HTTPException(status_code=409, detail=f"Overlaps with existing schedule for '{feeder.data[0]['name']}' on {body.schedule_date}")
        raise HTTPException(status_code=500, detail=f"Database error: {err}")

    cache_delete_pattern(cache, "schedules:*")
    return result.data[0]


@router.post("/bulk", status_code=201, summary="Bulk import schedules (admin only)")
def bulk_create_schedules(
    body:  ScheduleBulkCreate,
    admin: dict            = Depends(require_admin),
    db:    Client          = Depends(get_supabase),
    cache: redis_lib.Redis = Depends(get_redis),
):
    created = []
    skipped = []
    errors  = []

    for i, s in enumerate(body.schedules):
        if s.start_time >= s.end_time:
            errors.append({"index": i, "entry": s.model_dump(), "reason": "end_time must be after start_time"})
            continue
        try:
            result = db.table("schedules").insert({
                "feeder_id":     s.feeder_id,
                "schedule_date": str(s.schedule_date),
                "start_time":    s.start_time,
                "end_time":      s.end_time,
                "type":          s.type,
                "notes":         s.notes,
                "created_by":    admin["user_id"],
            }).execute()
            created.append(result.data[0])
        except Exception as e:
            err = str(e)
            if "no_overlap" in err or "exclusion constraint" in err.lower():
                skipped.append({"index": i, "entry": s.model_dump(), "reason": "Overlaps with existing schedule"})
            else:
                errors.append({"index": i, "entry": s.model_dump(), "reason": err})

    cache_delete_pattern(cache, "schedules:*")
    return {"created": len(created), "skipped": len(skipped), "errors": len(errors), "skipped_items": skipped, "error_items": errors}


@router.patch("/{schedule_id}", summary="Update a schedule entry (admin only)")
def update_schedule(
    schedule_id: str,
    body:        ScheduleUpdate,
    admin:       dict            = Depends(require_admin),
    db:          Client          = Depends(get_supabase),
    cache:       redis_lib.Redis = Depends(get_redis),
):
    existing = db.table("schedules").select("*").eq("id", schedule_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Schedule not found")

    current = existing.data[0]
    updates = body.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=422, detail="No fields provided to update")

    final_start = updates.get("start_time", current["start_time"])
    final_end   = updates.get("end_time",   current["end_time"])
    if final_start >= final_end:
        raise HTTPException(status_code=422, detail="end_time must be after start_time")

    if "schedule_date" in updates:
        updates["schedule_date"] = str(updates["schedule_date"])

    try:
        result = db.table("schedules").update(updates).eq("id", schedule_id).execute()
    except Exception as e:
        if "no_overlap" in str(e) or "exclusion constraint" in str(e).lower():
            raise HTTPException(status_code=409, detail="Updated time window overlaps with another schedule entry")
        raise HTTPException(status_code=500, detail=str(e))

    cache_delete_pattern(cache, "schedules:*")
    return result.data[0]


@router.delete("/{schedule_id}", summary="Delete a schedule entry (admin only)")
def delete_schedule(
    schedule_id: str,
    admin:       dict            = Depends(require_admin),
    db:          Client          = Depends(get_supabase),
    cache:       redis_lib.Redis = Depends(get_redis),
):
    result = db.table("schedules").delete().eq("id", schedule_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Schedule not found")
    cache_delete_pattern(cache, "schedules:*")
    return {"deleted": True, "id": schedule_id}
