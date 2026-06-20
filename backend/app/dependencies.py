from fastapi import Depends, HTTPException, Header
from typing import Optional
from app.config import supabase, get_redis
from app.cache import cache_get, cache_set
import redis as redis_lib


async def require_admin(authorization: str = Header(...)) -> dict:
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Authorization header must start with Bearer "
        )

    token = authorization.replace("Bearer ", "").strip()

    try:
        user_response = supabase.auth.get_user(token)
        user = user_response.user
    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail=f"Invalid or expired token: {str(e)}"
        )

    role = (user.app_metadata or {}).get("role")
    if role != "admin":
        raise HTTPException(
            status_code=403,
            detail="This endpoint requires admin access"
        )

    return {"user_id": user.id, "email": user.email, "role": role}


async def optional_admin(
    authorization: str = Header(default=None)
) -> Optional[dict]:
    if not authorization:
        return None
    try:
        return await require_admin(authorization)
    except HTTPException:
        return None
