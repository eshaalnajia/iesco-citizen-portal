from fastapi import Depends, HTTPException, Header, Request
from app.config import supabase
from datetime import datetime
import pytz

PKT = pytz.timezone("Asia/Karachi")


async def require_admin(
    request: Request,
    authorization: str = Header(...),
) -> dict:
    """
    Verifies the request comes from an authenticated admin user.
    Hardened version adds:
    - Explicit Bearer prefix validation
    - Token expiry check (not just validity)
    - Audit log of every admin action with IP address
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Authorization header must start with 'Bearer '"
        )

    token = authorization.replace("Bearer ", "").strip()

    if not token or len(token) < 20:
        # Reject obviously malformed tokens before hitting Supabase
        raise HTTPException(status_code=401, detail="Invalid token format")

    try:
        user_response = supabase.auth.get_user(token)
        user = user_response.user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    role = (user.app_metadata or {}).get("role")
    if role != "admin":
        # Log unauthorised access attempts
        client_ip = request.client.host if request.client else "unknown"
        print(
            f"SECURITY: Non-admin access attempt by {user.email} "
            f"from {client_ip} at {datetime.now(PKT).isoformat()} "
            f"on {request.method} {request.url.path}"
        )
        raise HTTPException(
            status_code=403,
            detail="This endpoint requires admin access"
        )

    # Audit log every successful admin action
    client_ip = request.client.host if request.client else "unknown"
    print(
        f"ADMIN ACTION: {user.email} from {client_ip} "
        f"at {datetime.now(PKT).isoformat()} "
        f"on {request.method} {request.url.path}"
    )

    return {"user_id": user.id, "email": user.email, "role": role}