from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta, timezone
from app.config import get_supabase
from supabase import Client

router = APIRouter(prefix="/outage-reports", tags=["Outage Reports"])


class OutageReportCreate(BaseModel):
    feeder_id: str
    lat: Optional[float] = None
    lng: Optional[float] = None


@router.post("/")
def submit_report(
    body: OutageReportCreate,
    request: Request,
    db: Client = Depends(get_supabase),
):
    # Anonymous citizens can submit outage reports, no login required.
    # reporter_ip is used only for same-IP dedup within a 30-minute window.
    reporter_ip = request.client.host if request.client else "unknown"
    cutoff = (datetime.now(timezone.utc) - timedelta(minutes=30)).isoformat()

    existing = db.table("outage_reports").select("id").eq(
        "feeder_id", body.feeder_id
    ).eq("reporter_ip", reporter_ip).gte("created_at", cutoff).execute()

    if existing.data:
        raise HTTPException(
            status_code=429,
            detail="You have already reported this feeder recently"
        )

    result = db.table("outage_reports").insert({
        "feeder_id": body.feeder_id,
        "lat": body.lat,
        "lng": body.lng,
        "reporter_ip": reporter_ip,
    }).execute()

    recent = db.table("outage_reports").select("id").eq(
        "feeder_id", body.feeder_id
    ).gte("created_at", cutoff).execute()

    if len(recent.data) >= 3:
        db.table("outage_reports").update({"confirmed": True}).eq(
            "feeder_id", body.feeder_id
        ).gte("created_at", cutoff).execute()

    return {"submitted": True, "report_id": result.data[0]["id"]}


@router.get("/{feeder_id}")
def get_feeder_reports(
    feeder_id: str,
    db: Client = Depends(get_supabase),
):
    # Public endpoint - returns recent reports for a feeder (last 24h)
    cutoff = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
    result = db.table("outage_reports").select(
        "id, lat, lng, confirmed, created_at"
    ).eq("feeder_id", feeder_id).gte("created_at", cutoff).order(
        "created_at", desc=True
    ).execute()
    return {"data": result.data}
