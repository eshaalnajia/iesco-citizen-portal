from fastapi import APIRouter, Depends, HTTPException, Request, Form
from fastapi.responses import HTMLResponse, RedirectResponse
from pydantic import BaseModel, field_validator
from typing import Optional
import re
from datetime import datetime
import pytz

from app.config    import get_supabase, get_redis, EASYPAISA_BASE_URL, EASYPAISA_STORE_ID
from app.cache     import cache_get, cache_set, cache_delete_pattern
from app.utils.easypaisa import (
    build_redirect_payload,
    build_ma_payload,
    verify_callback_hash,
    parse_response_code,
    generate_order_ref,
    clean_mobile_number,
    send_ma_payment_request,
    build_hash,
    get_auth_header,
    EASYPAISA_ERROR_CODES,
)
import redis as redis_lib
from supabase import Client

router = APIRouter(prefix="/payments/easypaisa", tags=["EasyPaisa Payments"])
PKT    = pytz.timezone("Asia/Karachi")


class EasypaisaInitiateRequest(BaseModel):
    reference_number: str
    amount:           float
    mobile_number:    Optional[str] = None
    email:            Optional[str] = None
    payment_method:   str = "redirect"

    @field_validator("reference_number")
    @classmethod
    def validate_ref(cls, v):
        if not re.match(r"^\d{14}$", v.strip()):
            raise ValueError("Reference number must be 14 digits")
        return v.strip()

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError("Amount must be greater than zero")
        if v > 500000:
            raise ValueError("Amount exceeds PKR 500,000 limit")
        return round(v, 2)

    @field_validator("payment_method")
    @classmethod
    def validate_method(cls, v):
        if v not in ("redirect", "ma_direct"):
            raise ValueError("payment_method must be 'redirect' or 'ma_direct'")
        return v


@router.post(
    "/initiate",
    summary="Initiate EasyPaisa payment - returns checkout URL or OTP flow",
)
async def initiate_payment(
    body:  EasypaisaInitiateRequest,
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
        raise HTTPException(status_code=404, detail="Bill not found")

    bill = bill_result.data[0]
    if bill["payment_status"] == "paid":
        raise HTTPException(status_code=409, detail="This bill has already been paid")

    expected = float(bill.get("total_payable") or bill.get("bill_amount") or 0)
    if expected > 0 and abs(body.amount - expected) > 1.0:
        raise HTTPException(
            status_code=422,
            detail=f"Amount PKR {body.amount} does not match bill total PKR {expected}"
        )

    order_ref = generate_order_ref()

    cache_set(cache, f"ep:pending:{order_ref}", {
        "reference_number": body.reference_number,
        "amount":           body.amount,
        "order_ref":        order_ref,
        "bill_id":          bill["id"],
        "payment_method":   body.payment_method,
        "initiated_at":     datetime.now(PKT).isoformat(),
    }, ttl=1800)

    if body.payment_method == "redirect":
        payload = build_redirect_payload(
            amount         = body.amount,
            order_ref      = order_ref,
            bill_reference = body.reference_number,
            mobile_number  = body.mobile_number or "",
            email          = body.email or "",
        )
        return {
            "flow":         "redirect",
            "order_ref":    order_ref,
            "checkout_url": EASYPAISA_BASE_URL + "Index.jsf",
            "payload":      payload,
            "message":      "Redirect citizen to checkout_url with this payload as a POST form",
        }

    if not body.mobile_number:
        raise HTTPException(
            status_code=422,
            detail="mobile_number is required for ma_direct payment method"
        )

    try:
        mobile = clean_mobile_number(body.mobile_number)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    ma_payload = build_ma_payload(
        mobile_number  = mobile,
        amount         = body.amount,
        order_ref      = order_ref,
        bill_reference = body.reference_number,
    )

    try:
        response = await send_ma_payment_request(ma_payload)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Could not reach EasyPaisa: {str(e)}")

    success, message = parse_response_code(response)
    if success is False:
        raise HTTPException(status_code=422, detail=message)

    return {
        "flow":      "ma_direct",
        "order_ref": order_ref,
        "status":    "otp_sent",
        "message":   message,
        "mobile":    mobile[-4:].rjust(11, "*"),
    }


@router.post(
    "/callback",
    summary="EasyPaisa posts payment result here after redirect flow",
    include_in_schema=False,
)
async def payment_callback(
    request: Request,
    db:      Client          = Depends(get_supabase),
    cache:   redis_lib.Redis = Depends(get_redis),
):
    form_data = await request.form()
    params    = dict(form_data)

    order_ref = params.get("orderRefNumber") or params.get("orderRefNum", "")
    if not order_ref:
        return HTMLResponse(
            "<p>Invalid callback - missing order reference. Contact IESCO support.</p>",
            status_code=400,
        )

    pending = cache_get(cache, f"ep:pending:{order_ref}")
    if not pending:
        return RedirectResponse(
            url="/billing/payment-complete?status=expired&order_ref=" + order_ref,
            status_code=303,
        )

    if not verify_callback_hash(params):
        return RedirectResponse(
            url="/billing/payment-complete?status=error&message=invalid_signature",
            status_code=303,
        )

    response_code = params.get("responseCode", "")
    txn_ref       = params.get("transactionId") or params.get("paymentToken", order_ref)

    if response_code == "0010":
        cache_delete_pattern(cache, f"ep:pending:{order_ref}")
        return RedirectResponse(
            url=f"/billing/payment-complete?status=cancelled&order_ref={order_ref}",
            status_code=303,
        )

    if response_code != "0000":
        error_msg = EASYPAISA_ERROR_CODES.get(response_code, "Payment failed")
        cache_delete_pattern(cache, f"ep:pending:{order_ref}")
        return RedirectResponse(
            url=f"/billing/payment-complete?status=failed&message={error_msg}",
            status_code=303,
        )

    update_result = (
        db.table("bills")
        .update({
            "payment_status":  "paid",
            "payment_method":  "easypaisa",
            "transaction_ref": txn_ref,
            "payment_date":    datetime.now(PKT).isoformat(),
        })
        .eq("id", pending["bill_id"])
        .execute()
    )

    if not update_result.data:
        print(f"CRITICAL: EasyPaisa payment {txn_ref} confirmed but DB update failed for bill {pending['bill_id']}")
        return RedirectResponse(
            url=f"/billing/payment-complete?status=warning&txn_ref={txn_ref}&message=Payment+processed+but+not+recorded",
            status_code=303,
        )

    cache_delete_pattern(cache, f"ep:pending:{order_ref}")
    cache_delete_pattern(cache, f"bill:{pending['reference_number']}*")

    return RedirectResponse(
        url=(
            f"/billing/payment-complete"
            f"?status=paid"
            f"&txn_ref={txn_ref}"
            f"&order_ref={order_ref}"
            f"&amount={pending['amount']}"
            f"&reference_number={pending['reference_number']}"
        ),
        status_code=303,
    )


@router.post(
    "/confirm-otp",
    summary="Confirm EasyPaisa MA direct payment with OTP",
)
async def confirm_otp(
    order_ref: str,
    otp:       str,
    db:        Client          = Depends(get_supabase),
    cache:     redis_lib.Redis = Depends(get_redis),
):
    pending = cache_get(cache, f"ep:pending:{order_ref}")
    if not pending:
        raise HTTPException(
            status_code=404,
            detail="Transaction not found or expired. Please restart the payment."
        )

    if not re.match(r"^\d{6}$", otp.strip()):
        raise HTTPException(status_code=422, detail="OTP must be 6 digits")

    import httpx
    otp_payload = {
        "storeId":      EASYPAISA_STORE_ID,
        "orderRefNum":  order_ref,
        "otp":          otp.strip(),
    }
    otp_payload["hashValue"] = build_hash(otp_payload)

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                EASYPAISA_BASE_URL + "ConfirmPayment",
                json=otp_payload,
                headers={
                    "Content-Type":  "application/json",
                    "Authorization": get_auth_header(),
                },
            )
        result = response.json()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Could not reach EasyPaisa: {str(e)}")

    success, message = parse_response_code(result)
    if not success:
        raise HTTPException(status_code=422, detail=message)

    txn_ref = result.get("transactionId", order_ref)

    update_result = (
        db.table("bills")
        .update({
            "payment_status":  "paid",
            "payment_method":  "easypaisa",
            "transaction_ref": txn_ref,
            "payment_date":    datetime.now(PKT).isoformat(),
        })
        .eq("id", pending["bill_id"])
        .execute()
    )

    cache_delete_pattern(cache, f"ep:pending:{order_ref}")
    cache_delete_pattern(cache, f"bill:{pending['reference_number']}*")

    return {
        "status":           "paid",
        "txn_ref":          txn_ref,
        "order_ref":        order_ref,
        "reference_number": pending["reference_number"],
        "amount_pkr":       pending["amount"],
        "payment_method":   "easypaisa",
        "payment_date":     datetime.now(PKT).strftime("%d %b %Y, %I:%M %p"),
        "message":          "Payment successful. Keep your transaction reference for your records.",
    }


@router.get(
    "/status/{order_ref}",
    summary="Check status of a pending EasyPaisa transaction",
)
def get_status(
    order_ref: str,
    cache:     redis_lib.Redis = Depends(get_redis),
):
    pending = cache_get(cache, f"ep:pending:{order_ref}")
    if not pending:
        return {
            "order_ref": order_ref,
            "status":    "expired_or_completed",
        }
    return {
        "order_ref":    order_ref,
        "status":       "pending",
        "initiated_at": pending.get("initiated_at"),
        "flow":         pending.get("payment_method"),
    }
