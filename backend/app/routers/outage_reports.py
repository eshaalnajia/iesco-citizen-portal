from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta, timezone
from app.config import get_supabase
from supabase import Client

router = APIRouter(prefix="/outage-reports", tags=["Outage Reports"])

class OutageReportCreate(BaseModel):
    feeder_id: Optional[str] = None
    lat:       Optional[float] = None
    lng:       Optional[float] = None

@router.post("/", status_code=201)
def submit_outage_report(
    body: OutageReportCreate,
    db:   Client = Depends(get_supabase),
):
    """
    Any citizen can submit an outage report.
    When 3+ reports arrive for the same feeder within 30 minutes,
    this updates the feeder status automatically.
    """
    db.table("outage_reports").insert({
        "feeder_id": body.feeder_id,
        "lat":       body.lat,
        "lng":       body.lng,
        "confirmed": False,
    }).execute()

    if body.feeder_id:
        cutoff = (datetime.now(timezone.utc) - timedelta(minutes=30)).isoformat()

        recent = db.table("outage_reports").select(
            "id", count="exact"
        ).eq("feeder_id", body.feeder_id).eq(
            "confirmed", False
        ).gte(
            "created_at", cutoff
        ).execute()

        if (recent.count or 0) >= 3:
            db.table("feeders").update({
                "status":       "fault",
                "last_updated": datetime.now(timezone.utc).isoformat(),
            }).eq("id", body.feeder_id).execute()

            db.table("outage_reports").update({
                "confirmed": True
            }).eq("feeder_id", body.feeder_id).eq(
                "confirmed", False
            ).execute()

            return {
                "recorded": True,
                "confirmed": True,
                "message": "Outage confirmed - feeder status updated on the map",
            }

    return {
        "recorded":  True,
        "confirmed": False,
        "message":   "Report received. 2 more reports needed to update the map.",
    }
