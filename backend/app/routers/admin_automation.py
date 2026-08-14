# app/routers/admin_automation.py
"""
Admin-only endpoints to manually trigger automation jobs on demand, and
check their scheduled status -- useful for testing and live demos without
waiting for the actual scheduled time.
"""
from fastapi import APIRouter, Depends

from app.config       import get_supabase, get_redis
from app.dependencies import require_admin
from app.automation.schedule_scraper   import run_schedule_scraper
from app.automation.request_reminders  import send_stale_request_reminders
import redis as redis_lib
from supabase import Client

router = APIRouter(prefix="/admin/automation", tags=["Admin Automation"])


@router.post("/run-schedule-scraper", summary="Manually trigger the IESCO schedule scraper")
async def trigger_scraper(
    admin: dict            = Depends(require_admin),
    db:    Client          = Depends(get_supabase),
    cache: redis_lib.Redis = Depends(get_redis),
):
    result = await run_schedule_scraper(db, cache)
    return result


@router.post("/run-stale-reminders", summary="Manually trigger stale request reminders")
async def trigger_reminders(
    admin: dict   = Depends(require_admin),
    db:    Client = Depends(get_supabase),
):
    result = await send_stale_request_reminders(db)
    return result


@router.get("/status", summary="Check automation job scheduler status")
def automation_status(admin: dict = Depends(require_admin)):
    # Must read through the module at request time, not via a name copied
    # out with `from ... import _scheduler` at import time -- that would
    # bind to whatever _scheduler equalled when this file was first
    # imported (almost certainly None, since the scheduler starts later
    # during app startup), and this endpoint would report running=False
    # forever even after the scheduler actually starts.
    from app.automation import scheduler as scheduler_module

    sched = scheduler_module.get_scheduler()
    if not sched:
        return {"running": False}

    return {
        "running": sched.running,
        "jobs": [
            {
                "id":       j.id,
                "name":     j.name,
                "next_run": str(j.next_run_time) if j.next_run_time else None,
            }
            for j in sched.get_jobs()
        ],
    }