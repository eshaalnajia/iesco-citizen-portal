from fastapi import APIRouter, Depends, HTTPException, Request
from app.rate_limit import limiter
from pydantic import BaseModel, field_validator
from typing import Optional
import re

from app.config    import get_supabase, get_redis, JAZZCASH_MERCHANT_ID
from app.cache     import cache_get, cache_set, cache_delete_pattern
from app.utils.jazzcash import (
    build_payment_payload,
    send_payment_request,
    verify_response_hash,
    parse_response_code,
    generate_transaction_ref,
    clean_mobile_number,
    build_secure_hash,
)
from datetime import datetime
import pytz
import redis as redis_lib
from supabase import Client

router = APIRouter(prefix="/payments/jazzcash", tags=["JazzCash Payments"])
PKT    = pytz.timezone("Asia/Karachi")


class JazzCashInitiateRequest(BaseModel):
    reference_number: str
    mobile_number:    str
    amount:           float

    @field_validator("reference_number")
    @classmethod
    def validate_ref(cls, v):
        if not re.match(r"^\d{14}$", v.strip()):
            raise ValueError("Reference number must be 14 digits")
        return v.strip()

    @field_validator("mobile_number")
    @classmethod
    def validate_mobile(cls, v):
        try:
            return clean_mobile_number(v)
        except ValueError as e:
            raise ValueError(str(e))

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError("Amount must be greater than zero")
        if v > 500000:
            raise ValueError("Amount exceeds maximum transaction limit of PKR 500,000")
        return round(v, 2)


@router.post(
    "/initiate",
    summary="Initiate a JazzCash MWALLET payment",
)
@limiter.limit("3/minute")
async def initiate_payment(
    request: Request,
    body:  JazzCashInitiateRequest,
    db:    Client          = Depends(get_supabase),
    cache: redis_lib.Redis = Depends(get_redis),
):
    bill_result = (
        db.table("bills")
        .select("id, payment_status, total_payable, bill_amount, billing_month")
        .eq("reference_number", body.reference_number)
        .order("fetched_at", desc=True)
        .limit(1)
        .execute()
    )

    if not bill_result.data:
        raise HTTPException(status_code=404, detail="No bill found for this reference number")

    bill = bill_result.data[0]

    if bill["payment_status"] == "paid":
        raise HTTPException(status_code=409, detail="This bill has already been paid")

    expected = float(bill.get("total_payable") or bill.get("bill_amount") or 0)
    if expected > 0 and abs(body.amount - expected) > 1.0:
        raise HTTPException(
            status_code=422,
            detail=f"Amount PKR {body.amount} does not match bill total PKR {expected}"
        )

    txn_ref = generate_transaction_ref("IESCO")

    payload = build_payment_payload(
        mobile_number  = body.mobile_number,
        amount_pkr     = body.amount,
        txn_ref        = txn_ref,
        bill_reference = body.reference_number,
        description    = f"IESCO bill {bill.get('billing_month', body.reference_number)}",
    )

    try:
        response = await send_payment_request(payload)
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"Could not reach JazzCash. Please try again or use a different payment method. Error: {str(e)}"
        )

    success, message = parse_response_code(response)
    response_code    = response.get("pp_ResponseCode", "")

    cache_set(cache, f"jc:pending:{txn_ref}", {
        "reference_number": body.reference_number,
        "mobile_number":    body.mobile_number,
        "amount":           body.amount,
        "txn_ref":          txn_ref,
        "bill_id":          bill["id"],
        "initiated_at":     datetime.now(PKT).isoformat(),
    }, ttl=1800)

    if success is False:
        raise HTTPException(status_code=422, detail=message)

    return {
        "txn_ref":       txn_ref,
        "status":        "otp_sent" if success is None else "initiated",
        "message":       message,
        "response_code": response_code,
        "mobile_number": body.mobile_number[-4:].rjust(11, "*"),
    }


@router.post(
    "/confirm",
    summary="Confirm payment after citizen enters OTP",
)
@limiter.limit("5/minute")
async def confirm_payment(
    request: Request,
    txn_ref: str,
    otp:     str,
    db:      Client          = Depends(get_supabase),
    cache:   redis_lib.Redis = Depends(get_redis),
):
    pending = cache_get(cache, f"jc:pending:{txn_ref}")
    if not pending:
        raise HTTPException(
            status_code=404,
            detail="Transaction not found or expired. Please start the payment again."
        )

    if not re.match(r"^\d{6}$", otp.strip()):
        raise HTTPException(status_code=422, detail="OTP must be 6 digits")

    confirm_payload = build_payment_payload(
        mobile_number  = pending["mobile_number"],
        amount_pkr     = pending["amount"],
        txn_ref        = txn_ref,
        bill_reference = pending["reference_number"],
    )
    confirm_payload["ppmpf_1"] = pending["mobile_number"]
    confirm_payload["ppmpf_2"] = otp.strip()
    confirm_payload["pp_SecureHash"] = build_secure_hash(confirm_payload)

    try:
        response = await send_payment_request(confirm_payload)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Could not reach JazzCash: {str(e)}")

    if not verify_response_hash(response):
        raise HTTPException(
            status_code=502,
            detail="Invalid response signature from JazzCash. Contact IESCO support."
        )

    success, message = parse_response_code(response)

    if not success:
        raise HTTPException(status_code=422, detail=message)

    payment_txn_ref = response.get("pp_TxnRefNo", txn_ref)

    existing_txn = (
        db.table("bills")
        .select("id")
        .eq("transaction_ref", payment_txn_ref)
        .execute()
    )
    if existing_txn.data:
        return {
            "status":  "already_recorded",
            "txn_ref": payment_txn_ref,
            "message": "This transaction was already recorded — idempotent no-op",
        }

    update_result = (
        db.table("bills")
        .update({
            "payment_status":  "paid",
            "payment_method":  "jazzcash",
            "transaction_ref": payment_txn_ref,
            "payment_date":    datetime.now(PKT).isoformat(),
        })
        .eq("id", pending["bill_id"])
        .execute()
    )

    if not update_result.data:
        print(f"CRITICAL: Payment {payment_txn_ref} processed by JazzCash but DB update failed for bill {pending['bill_id']}")
        return {
            "status":  "payment_recorded_externally",
            "txn_ref": payment_txn_ref,
            "message": "Payment processed by JazzCash. Please contact IESCO if your bill status does not update within 24 hours.",
            "warning": "Internal recording error - reference saved externally",
        }

    cache_delete_pattern(cache, f"jc:pending:{txn_ref}")
    cache_delete_pattern(cache, f"bill:{pending['reference_number']}*")

    return {
        "status":           "paid",
        "txn_ref":          payment_txn_ref,
        "reference_number": pending["reference_number"],
        "amount_pkr":       pending["amount"],
        "payment_method":   "jazzcash",
        "payment_date":     datetime.now(PKT).strftime("%d %b %Y, %I:%M %p"),
        "message":          "Payment successful. Keep your transaction reference for your records.",
    }


@router.get(
    "/status/{txn_ref}",
    summary="Check the status of a pending JazzCash transaction",
)
def get_transaction_status(
    txn_ref: str,
    cache:   redis_lib.Redis = Depends(get_redis),
):
    pending = cache_get(cache, f"jc:pending:{txn_ref}")
    if not pending:
        return {
            "txn_ref": txn_ref,
            "status":  "expired_or_completed",
            "message": "Transaction not found. It may have expired or already been completed.",
        }
    return {
        "txn_ref":      txn_ref,
        "status":       "pending_otp",
        "initiated_at": pending.get("initiated_at"),
        "expires_in":   "30 minutes from initiation",
    }
