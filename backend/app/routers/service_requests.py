from fastapi import APIRouter, Depends, HTTPException, Query, Path, Request
from app.rate_limit import limiter
from typing  import Optional
from datetime import datetime
import pytz

from app.config       import get_supabase, get_redis
from app.dependencies import require_admin
from app.cache        import cache_delete_pattern
from app.utils.sanitize import sanitize_text
from app.schemas.service_request import (
    ServiceRequestCreate, StatusUpdate, VALID_REQUEST_TYPES
)
import redis as redis_lib
from supabase import Client

router = APIRouter(prefix="/service-requests", tags=["Service Requests"])
PKT    = pytz.timezone("Asia/Karachi")

STATUS_LABELS = {
    "pending":    "Submitted - awaiting review",
    "in_review":  "Under review by IESCO",
    "approved":   "Approved - team will contact you",
    "rejected":   "Not approved - see admin notes",
    "completed":  "Work completed",
    "cancelled":  "Cancelled",
}

TURNAROUND = {
    "new_connection":    "7-14 working days",
    "meter_change":      "3-5 working days",
    "energy_audit":      "2-4 working days",
    "safety_inspection": "24-48 hours",
}


@router.post(
    "/",
    status_code=201,
    summary="Submit a new service request",
)
@limiter.limit("5/hour")
def submit_request(
    request: Request,
    body: ServiceRequestCreate,
    db:   Client = Depends(get_supabase),
):
    result = db.table("service_requests").insert({
        "request_type":     body.request_type,
        "full_name":        body.full_name,
        "cnic":             body.cnic,
        "phone":            body.phone,
        "email":            body.email,
        "address":          body.address,
        "sector":           body.sector,
        "reference_number": body.reference_number,
        "details":          {k: sanitize_text(v) if isinstance(v, str) else v for k, v in (body.details or {}).items()},
        "status":           "pending",
    }).execute()

    if not result.data:
        raise HTTPException(
            status_code=500,
            detail="Failed to submit request. Please try again."
        )

    req = result.data[0]
    return {
        "submitted":       True,
        "ticket_number":   req["ticket_number"],
        "request_type":    req["request_type"],
        "status":          req["status"],
        "status_label":    STATUS_LABELS["pending"],
        "estimated_time":  TURNAROUND.get(body.request_type, ""),
        "message": (
            f"Your request has been submitted. "
            f"Your ticket number is {req['ticket_number']}. "
            f"Save this number to track your request status."
        ),
    }


@router.get(
    "/track/{ticket_number}",
    summary="Track the status of a request by ticket number",
)
def track_request(
    ticket_number: str = Path(
        ...,
        description="Ticket number in format SR-YYYYMMDD-XXXX"
    ),
    db: Client = Depends(get_supabase),
):
    result = (
        db.table("service_requests")
        .select(
            "ticket_number, request_type, status, full_name, "
            "address, sector, created_at, updated_at, "
            "admin_notes, scheduled_date, resolved_at"
        )
        .eq("ticket_number", ticket_number.upper().strip())
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=404,
            detail=(
                f"No request found for ticket number {ticket_number}. "
                "Check the ticket number from your submission confirmation."
            )
        )

    req = result.data[0]

    return {
        **req,
        "status_label":   STATUS_LABELS.get(req["status"], req["status"]),
        "estimated_time": TURNAROUND.get(req["request_type"], "")
                          if req["status"] == "pending" else None,
    }


@router.get(
    "/types",
    summary="List all service request types with descriptions",
)
def get_request_types():
    return {
        "types": [
            {
                "value":            "new_connection",
                "label":            "New Connection",
                "description":      "Apply for electricity at a new property",
                "turnaround":       TURNAROUND["new_connection"],
                "required_docs":    ["Ownership deed or lease agreement", "CNIC copy", "Plot map"],
            },
            {
                "value":            "meter_change",
                "label":            "Meter Change",
                "description":      "Request replacement of a faulty or damaged meter",
                "turnaround":       TURNAROUND["meter_change"],
                "required_docs":    ["CNIC copy", "Latest IESCO bill"],
            },
            {
                "value":            "energy_audit",
                "label":            "Energy Audit",
                "description":      "Request an assessment to reduce your electricity bill",
                "turnaround":       TURNAROUND["energy_audit"],
                "required_docs":    ["CNIC copy"],
            },
            {
                "value":            "safety_inspection",
                "label":            "Safety Inspection",
                "description":      "Report a dangerous electrical hazard in your area",
                "turnaround":       TURNAROUND["safety_inspection"],
                "required_docs":    ["CNIC copy"],
                "urgent":           True,
            },
        ]
    }


@router.get(
    "/",
    summary="List all service requests (admin only)",
)
def list_requests(
    request_type: Optional[str] = Query(None),
    status:       Optional[str] = Query(None),
    search:       Optional[str] = Query(None, description="Search by name, CNIC, or ticket"),
    page:         int           = Query(1,  ge=1),
    page_size:    int           = Query(30, ge=1, le=100),
    admin:        dict          = Depends(require_admin),
    db:           Client        = Depends(get_supabase),
):
    offset = (page - 1) * page_size
    query  = db.table("service_requests").select("*", count="exact")

    if request_type:
        query = query.eq("request_type", request_type)
    if status:
        query = query.eq("status", status)
    if search:
        query = query.or_(
            f"full_name.ilike.%{search}%,"
            f"cnic.ilike.%{search}%,"
            f"ticket_number.ilike.%{search}%"
        )

    result = (
        query
        .order("created_at", desc=True)
        .range(offset, offset + page_size - 1)
        .execute()
    )

    requests = [
        {**r, "status_label": STATUS_LABELS.get(r["status"], r["status"])}
        for r in result.data
    ]

    return {
        "data":      requests,
        "total":     result.count,
        "page":      page,
        "page_size": page_size,
        "pages":     -(-result.count // page_size) if result.count else 0,
    }


@router.patch(
    "/{request_id}/status",
    summary="Update request status (admin only)",
)
def update_status(
    request_id: str = Path(...),
    body:       StatusUpdate = ...,
    admin:      dict = Depends(require_admin),
    db:         Client = Depends(get_supabase),
):
    updates = {
        "status":     body.status,
        "updated_at": datetime.now(PKT).isoformat(),
    }
    if body.admin_notes:    updates["admin_notes"]    = body.admin_notes
    if body.assigned_to:    updates["assigned_to"]    = body.assigned_to
    if body.scheduled_date: updates["scheduled_date"] = str(body.scheduled_date)

    if body.status in ("completed", "rejected", "cancelled"):
        updates["resolved_at"] = datetime.now(PKT).isoformat()

    result = (
        db.table("service_requests")
        .update(updates)
        .eq("id", request_id)
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Request not found")

    return {
        **result.data[0],
        "status_label": STATUS_LABELS.get(body.status, body.status),
    }
