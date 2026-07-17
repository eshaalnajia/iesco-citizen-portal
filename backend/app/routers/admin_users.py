from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from app.config import supabase
from app.dependencies import require_admin

router = APIRouter(prefix="/admin/users", tags=["Admin Users"])


class AdminUserCreate(BaseModel):
    email: EmailStr
    password: str


@router.post("/", status_code=201, summary="Create a new admin user (admin only)")
def create_admin_user(
    body: AdminUserCreate,
    admin: dict = Depends(require_admin),
):
    if len(body.password) < 8:
        raise HTTPException(
            status_code=422,
            detail="Password must be at least 8 characters"
        )

    try:
        result = supabase.auth.admin.create_user({
            "email": body.email,
            "password": body.password,
            "email_confirm": True,
            "app_metadata": {"role": "admin"},
        })
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to create admin user: {str(e)}"
        )

    return {
        "created": True,
        "email": result.user.email,
        "user_id": result.user.id,
        "created_by": admin["email"],
    }


@router.get("/", summary="List all admin users (admin only)")
def list_admin_users(
    admin: dict = Depends(require_admin),
):
    try:
        result = supabase.auth.admin.list_users()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list users: {str(e)}")

    admins = [
        {"id": u.id, "email": u.email, "created_at": u.created_at}
        for u in result
        if (u.app_metadata or {}).get("role") == "admin"
    ]
    return {"data": admins}