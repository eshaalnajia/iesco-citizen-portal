from fastapi import APIRouter, Depends, HTTPException, Query, Path
from typing import Optional
from datetime import datetime
import pytz

from app.config       import get_supabase, get_redis
from app.dependencies import require_admin
from app.cache        import cache_get, cache_set, cache_delete_pattern
from app.schemas.bill import (
    PaymentCallbackRequest, BillSimulateRequest,
    validate_reference_number, VALID_STATUSES
)
from app.utils.bill_utils import compute_total_payable, is_overdue, mask_consumer_name
import redis as redis_lib
from supabase import Client

router = APIRouter(prefix="/bills", tags=["Bills"])
PKT    = pytz.timezone("Asia/Karachi")

BILL_CACHE_TTL = 120


@router.get(
    "/{reference_number}",
    summary="Look up a bill by IESCO reference number",
)
def get_bill(
    reference_number: str = Path(
        ...,
        description="14-digit IESCO reference number printed on your bill"
    ),
    db:    Client          = Depends(get_supabase),
    cache: redis_lib.Redis = Depends(get_redis),
):
    try:
        ref = validate_reference_number(reference_number)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    cache_key = f"bill:{ref}"
    cached    = cache_get(cache, cache_key)
    if cached:
        return {**cached, "source": "cache"}

    result = (
        db.table("bills")
        .select("*")
        .eq("reference_number", ref)
        .order("due_date", desc=True)
        .limit(1)
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=404,
            detail=(
                f"No bill found for reference number {ref}. "
                "Check the number printed on your paper bill and try again. "
                "Bills may take up to 24 hours to appear after the billing cycle closes."
            )
        )

    bill = result.data[0]

    if not bill.get("total_payable"):
        bill["total_payable"] = compute_total_payable(
            bill.get("bill_amount", 0),
            bill.get("arrears", 0),
            bill.get("taxes", 0),
        )

    bill["is_overdue"] = (
        is_overdue(bill.get("due_date")) and
        bill.get("payment_status") != "paid"
    )

    if bill.get("consumer_name"):
        bill["consumer_name"] = mask_consumer_name(bill["consumer_name"])

    cache_set(cache, cache_key, bill, BILL_CACHE_TTL)
    return {**bill, "source": "database"}


@router.get(
    "/{reference_number}/history",
    summary="12-month payment history for a reference number",
)
def get_bill_history(
    reference_number: str = Path(...),
    db:    Client          = Depends(get_supabase),
    cache: redis_lib.Redis = Depends(get_redis),
):
    try:
        ref = validate_reference_number(reference_number)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    cache_key = f"bill:history:{ref}"
    cached    = cache_get(cache, cache_key)
    if cached:
        return {**cached, "source": "cache"}

    result = (
        db.table("bills")
        .select("*")
        .eq("reference_number", ref)
        .order("due_date", desc=True)
        .limit(12)
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=404,
            detail=f"No billing history found for reference number {ref}."
        )

    bills = result.data
    for b in bills:
        if not b.get("total_payable"):
            b["total_payable"] = compute_total_payable(
                b.get("bill_amount", 0),
                b.get("arrears", 0),
                b.get("taxes", 0),
            )
        b["is_overdue"] = (
            is_overdue(b.get("due_date")) and
            b.get("payment_status") != "paid"
        )
        if b.get("consumer_name"):
            b["consumer_name"] = mask_consumer_name(b["consumer_name"])

    paid_count   = sum(1 for b in bills if b.get("payment_status") == "paid")
    total_spent  = sum(b.get("total_payable", 0) or 0 for b in bills)
    avg_units    = (
        sum(b.get("units_consumed", 0) or 0 for b in bills) / len(bills)
        if bills else 0
    )

    response = {
        "reference_number": ref,
        "total_bills":      len(bills),
        "paid_count":       paid_count,
        "unpaid_count":     len(bills) - paid_count,
        "total_spent_pkr":  round(total_spent, 2),
        "avg_units":        round(avg_units, 1),
        "bills":            bills,
    }
    cache_set(cache, cache_key, response, BILL_CACHE_TTL)
    return {**response, "source": "database"}


@router.post(
    "/payment-callback",
    summary="Record a completed payment from a gateway callback",
)
def record_payment(
    body: PaymentCallbackRequest,
    db:   Client          = Depends(get_supabase),
    cache: redis_lib.Redis = Depends(get_redis),
):
    result = (
        db.table("bills")
        .select("id, payment_status, total_payable, bill_amount, transaction_ref")
        .eq("reference_number", body.reference_number)
        .order("due_date", desc=True)
        .limit(1)
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=404,
            detail=f"No bill found for reference number {body.reference_number}"
        )

    bill = result.data[0]

    if bill["payment_status"] == "paid":
        raise HTTPException(
            status_code=409,
            detail=(
                "This bill has already been marked as paid. "
                "If you believe this is an error, contact IESCO with your "
                f"transaction reference: {bill.get('transaction_ref', 'N/A')}"
            )
        )

    expected = float(bill.get("total_payable") or bill.get("bill_amount") or 0)
    if expected > 0 and abs(body.amount_paid - expected) > 1.0:
        raise HTTPException(
            status_code=422,
            detail=(
                f"Amount paid (PKR {body.amount_paid}) does not match "
                f"the bill total (PKR {expected}). "
                "Please contact IESCO if you believe this is an error."
            )
        )

    update_result = (
        db.table("bills")
        .update({
            "payment_status":  "paid",
            "payment_method":  body.payment_method,
            "transaction_ref": body.transaction_ref,
            "payment_date":    datetime.now(PKT).isoformat(),
        })
        .eq("id", bill["id"])
        .execute()
    )

    if not update_result.data:
        raise HTTPException(
            status_code=500,
            detail="Failed to record payment. Please contact IESCO support."
        )

    cache_delete_pattern(cache, f"bill:{body.reference_number}*")

    return {
        "recorded":         True,
        "reference_number": body.reference_number,
        "transaction_ref":  body.transaction_ref,
        "payment_method":   body.payment_method,
        "amount_paid":      body.amount_paid,
        "status":           "paid",
        "message":          "Payment recorded successfully. Keep your transaction reference for your records.",
    }


@router.post(
    "/simulate",
    status_code=201,
    summary="Generate a test bill for development (admin only)",
)
def simulate_bill(
    body:  BillSimulateRequest,
    admin: dict            = Depends(require_admin),
    db:    Client          = Depends(get_supabase),
    cache: redis_lib.Redis = Depends(get_redis),
):
    total_payable = compute_total_payable(
        body.bill_amount,
        body.arrears,
        body.taxes,
    )

    result = db.table("bills").insert({
        "reference_number": body.reference_number,
        "consumer_name":    body.consumer_name,
        "consumer_address": body.consumer_address,
        "units_consumed":   body.units_consumed,
        "bill_amount":      body.bill_amount,
        "arrears":          body.arrears,
        "taxes":            body.taxes,
        "total_payable":    total_payable,
        "due_date":         str(body.due_date),
        "billing_month":    body.billing_month,
        "payment_status":   body.payment_status,
    }).execute()

    cache_delete_pattern(cache, f"bill:{body.reference_number}*")
    return {
        "created":        True,
        "bill":           result.data[0],
        "total_payable":  total_payable,
    }


@router.get(
    "/",
    summary="List all bills (admin only)",
)
def list_bills(
    payment_status: Optional[str] = Query(None),
    page:           int           = Query(1, ge=1),
    page_size:      int           = Query(50, ge=1, le=200),
    admin:          dict          = Depends(require_admin),
    db:             Client        = Depends(get_supabase),
):
    offset = (page - 1) * page_size
    query  = db.table("bills").select("*", count="exact")

    if payment_status:
        query = query.eq("payment_status", payment_status)

    result = (
        query
        .order("fetched_at", desc=True)
        .range(offset, offset + page_size - 1)
        .execute()
    )

    return {
        "data":      result.data,
        "total":     result.count,
        "page":      page,
        "page_size": page_size,
        "pages":     -(-result.count // page_size) if result.count else 0,
    }


@router.patch(
    "/{bill_id}/status",
    summary="Manually update a bill payment status (admin only)",
)
def update_bill_status(
    bill_id:        str,
    payment_status: str,
    admin:          dict            = Depends(require_admin),
    db:             Client          = Depends(get_supabase),
    cache:          redis_lib.Redis = Depends(get_redis),
):
    if payment_status not in VALID_STATUSES:
        raise HTTPException(
            status_code=422,
            detail=f"payment_status must be one of: {VALID_STATUSES}"
        )

    existing = db.table("bills").select("reference_number").eq(
        "id", bill_id
    ).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Bill not found")

    ref = existing.data[0]["reference_number"]

    result = db.table("bills").update({
        "payment_status": payment_status,
    }).eq("id", bill_id).execute()

    cache_delete_pattern(cache, f"bill:{ref}*")
    return result.data[0]



