from fastapi import APIRouter, Depends, HTTPException, Path
from pydantic import BaseModel
from typing import Optional
from app.config import get_supabase, get_redis
from app.cache  import cache_get, cache_set, cache_delete_pattern
from app.dependencies import require_admin
import redis as redis_lib
from supabase import Client

router = APIRouter(prefix="/announcements", tags=["Announcements"])

TTL_ANNOUNCEMENTS = 60

VALID_TYPES = {"info", "warning", "alert"}


class AnnouncementCreate(BaseModel):
    type:       str
    text:       str
    link:       Optional[str] = None
    link_text:  Optional[str] = None
    is_active:  bool = True
    sort_order: int  = 0


class AnnouncementUpdate(BaseModel):
    type:       Optional[str]  = None
    text:       Optional[str]  = None
    link:       Optional[str]  = None
    link_text:  Optional[str]  = None
    is_active:  Optional[bool] = None
    sort_order: Optional[int]  = None


@router.get("/active", summary="List active announcements for the public banner")
def get_active_announcements(
    db: Client = Depends(get_supabase),
    cache: redis_lib.Redis = Depends(get_redis),
):
    cache_key = "announcements:active"
    cached = cache_get(cache, cache_key)
    if cached:
        return {"data": cached, "source": "cache"}

    result = (
        db.table("announcements")
        .select("*")
        .eq("is_active", True)
        .order("sort_order")
        .execute()
    )

    cache_set(cache, cache_key, result.data, TTL_ANNOUNCEMENTS)
    return {"data": result.data, "source": "database"}


@router.get("/", summary="List all announcements, active or not (admin only)")
def list_all_announcements(
    admin: dict = Depends(require_admin),
    db: Client = Depends(get_supabase),
):
    result = (
        db.table("announcements")
        .select("*")
        .order("sort_order")
        .execute()
    )
    return {"data": result.data}


@router.post("/", status_code=201, summary="Create a new announcement (admin only)")
def create_announcement(
    body: AnnouncementCreate,
    admin: dict = Depends(require_admin),
    db: Client = Depends(get_supabase),
    cache: redis_lib.Redis = Depends(get_redis),
):
    if body.type not in VALID_TYPES:
        raise HTTPException(status_code=422, detail=f"type must be one of {VALID_TYPES}")

    result = db.table("announcements").insert(body.model_dump()).execute()
    cache_delete_pattern(cache, "announcements:*")
    return result.data[0]


@router.patch("/{announcement_id}", summary="Update an announcement (admin only)")
def update_announcement(
    announcement_id: str = Path(...),
    body: AnnouncementUpdate = ...,
    admin: dict = Depends(require_admin),
    db: Client = Depends(get_supabase),
    cache: redis_lib.Redis = Depends(get_redis),
):
    updates = body.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=422, detail="No fields provided to update")
    if "type" in updates and updates["type"] not in VALID_TYPES:
        raise HTTPException(status_code=422, detail=f"type must be one of {VALID_TYPES}")

    result = (
        db.table("announcements")
        .update(updates)
        .eq("id", announcement_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Announcement not found")

    cache_delete_pattern(cache, "announcements:*")
    return result.data[0]


@router.delete("/{announcement_id}", summary="Delete an announcement (admin only)")
def delete_announcement(
    announcement_id: str = Path(...),
    admin: dict = Depends(require_admin),
    db: Client = Depends(get_supabase),
    cache: redis_lib.Redis = Depends(get_redis),
):
    result = db.table("announcements").delete().eq("id", announcement_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Announcement not found")

    cache_delete_pattern(cache, "announcements:*")
    return {"deleted": True, "id": announcement_id}