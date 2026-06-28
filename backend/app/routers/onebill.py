from fastapi import APIRouter, Depends, HTTPException, Header, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import pytz

from app.config    import get_supabase, get_redis, ONEBILL_BILLER_ID
from app.cache     import cache_get, cache_set, cache_delete_pattern
from app.utils.onebill import (
    verify_request_token,
    build_response_hash,
    build_payment_acknowledgement_hash,
    format_amount,
    get_bill_status_code,
    BANK_CODES,
)
from app.utils.bill_utils import compute_total_payable, is_overdue
import redis as redis_lib
from supabase import Client

router = APIRouter(prefix="/1bill", tags=["1Bill Bank Integration"])
PKT    = pytz.timezone("Asia/Karachi")


@router.get(
    "/inquiry",
    summary="Bill inquiry -- called by banks/1Bill to look up a bill",
)
async def bill_inquiry(
    consumer_number:  str    = None,
    ConsumerNumber:   str    = None,
    consumer_id:      str    = None,
    authorization:    str    = Header(default=None),
    db:               Client = Depends(get_supabase),
    cache:            redis_lib.Redis = Depends(get_redis),
):
    ref = consumer_number or ConsumerNumber or consumer_id
    if not ref:
        return _error_response("01", "Consumer number is required")

    ref = ref.strip()
    if len(ref) != 14 or not ref.isdigit():
        return _error_response("02", f"Invalid consumer number format: {ref}")

    cache_key = f"1bill:inquiry:{ref}"
    cached    = cache_get(cache, cache_key)
    if cached:
        return cached

    result = (
        db.table("bills")
        .select("*")
        .eq("reference_number", ref)
        .order("due_date", desc=True)
        .limit(1)
        .execute()
    )

    if not result.data:
        return _error_response("03", f"No bill found for consumer number {ref}")

    bill = result.data[0]

    total = float(bill.get("total_payable") or compute_total_payable(
        bill.get("bill_amount", 0),
        bill.get("arrears", 0),
        bill.get("taxes", 0),
    ))

    overdue      = is_overdue(bill.get("due_date")) and bill["payment_status"] != "paid"
    status_code  = get_bill_status_code(bill["payment_status"], overdue)
    due_date_str = str(bill.get("due_date", ""))
    amount_str   = format_amount(total)

    response = {
        "ResponseCode":    "00",
        "ResponseMessage": "Bill found",
        "BillerID":        ONEBILL_BILLER_ID,
        "ConsumerNumber":  ref,
        "BillStatus":      status_code,
        "DueDate":         due_date_str,
        "AmountDue":       amount_str,
        "AmountAfterDue":  format_amount(total * 1.02),
        "BillingMonth":    bill.get("billing_month", ""),
        "ConsumerName":    bill.get("consumer_name", ""),
        "ConsumerAddress": bill.get("consumer_address", ""),
        "UnitsConsumed":   str(bill.get("units_consumed", "")),
        "BillAmount":      format_amount(bill.get("bill_amount", 0)),
        "Arrears":         format_amount(bill.get("arrears", 0)),
        "Taxes":           format_amount(bill.get("taxes", 0)),
        "ResponseHash":    build_response_hash(
                               ref, status_code, amount_str, due_date_str
                           ),
    }

    cache_set(cache, cache_key, response, 120)
    return response


@router.post(
    "/payment-notification",
    summary="Payment notification -- called by 1Bill after a bank payment completes",
)
async def payment_notification(
    request: Request,
    db:      Client          = Depends(get_supabase),
    cache:   redis_lib.Redis = Depends(get_redis),
):
    content_type = request.headers.get("content-type", "")
    if "json" in content_type:
        body = await request.json()
    else:
        form = await request.form()
        body = dict(form)

    consumer_number  = body.get("ConsumerNumber") or body.get("consumer_number", "")
    transaction_id   = body.get("TransactionId")  or body.get("transaction_id", "")
    amount_paid      = body.get("AmountPaid")      or body.get("amount_paid", "0")
    bank_code        = body.get("BankCode")        or body.get("bank_code", "UNKNOWN")
    payment_datetime = body.get("PaymentDateTime") or body.get("payment_datetime", "")
    stan             = body.get("STAN")            or body.get("stan", "")

    if not consumer_number or not transaction_id:
        return _notification_error(
            "01",
            "Missing required fields: ConsumerNumber and TransactionId"
        )

    consumer_number = consumer_number.strip()
    amount_float    = float(amount_paid or 0)

    if amount_float <= 0:
        return _notification_error("02", "Invalid payment amount")

    bill_result = (
        db.table("bills")
        .select("id, payment_status, total_payable, transaction_ref")
        .eq("reference_number", consumer_number)
        .order("due_date", desc=True)
        .limit(1)
        .execute()
    )

    if not bill_result.data:
        return _notification_error("03", f"Bill not found: {consumer_number}")

    bill = bill_result.data[0]

    if bill["payment_status"] == "paid":
        if bill.get("transaction_ref") == transaction_id:
            return _notification_success(consumer_number, transaction_id, amount_paid)
        return _notification_error(
            "04",
            f"Bill already paid via transaction {bill.get('transaction_ref')}"
        )

    bank_name = BANK_CODES.get(bank_code, bank_code)
    update    = (
        db.table("bills")
        .update({
            "payment_status":  "paid",
            "payment_method":  "bank",
            "transaction_ref": transaction_id,
            "payment_date":    datetime.now(PKT).isoformat(),
        })
        .eq("id", bill["id"])
        .execute()
    )

    if not update.data:
        return _notification_error("05", "Failed to record payment -- please retry")

    cache_delete_pattern(cache, f"bill:{consumer_number}*")
    cache_delete_pattern(cache, f"1bill:inquiry:{consumer_number}")

    print(
        f"1Bill payment recorded: ref={consumer_number} "
        f"txn={transaction_id} amount={amount_paid} bank={bank_name}"
    )

    return _notification_success(consumer_number, transaction_id, amount_paid)


@router.get(
    "/banks",
    summary="List of 1Bill-enabled banks and payment channels",
)
def get_bank_list():
    channels = [
        {
            "category": "Bank branches",
            "channels": [
                "HBL", "MCB", "UBL", "Allied Bank",
                "Meezan Bank", "Bank Alfalah", "Faysal Bank",
                "NBP", "Standard Chartered", "Silkbank",
            ],
            "instructions": "Visit any branch, give teller your 14-digit reference number",
        },
        {
            "category": "ATM / CDM",
            "channels": [
                "1LINK ATM network (all member banks)",
                "HBL ATM", "MCB ATM", "UBL ATM",
            ],
            "instructions": "Insert card - Bills - IESCO - Enter reference number",
        },
        {
            "category": "Internet banking",
            "channels": [
                "HBL Online", "MCB Internet Banking", "UBL Digital",
                "Meezan Internet Banking", "Bank Alfalah Internet Banking",
            ],
            "instructions": "Login - Payments - Utility Bills - IESCO",
        },
        {
            "category": "Mobile banking apps",
            "channels": [
                "HBL Mobile", "MCB Mobile", "UBL Omni",
                "Meezan Mobile", "Alfalah Mobile",
            ],
            "instructions": "Open app - Pay Bills - IESCO - Enter reference",
        },
        {
            "category": "Payment agents",
            "channels": [
                "Jazz Cash agents", "EasyPaisa agents",
                "NayaPay", "SadaPay", "Oraan",
            ],
            "instructions": "Visit any registered agent, quote reference number",
        },
    ]
    return {
        "biller_id":   ONEBILL_BILLER_ID,
        "biller_name": "IESCO (Islamabad Electric Supply Company)",
        "channels":    channels,
    }


def _error_response(code: str, message: str) -> dict:
    return {
        "ResponseCode":    code,
        "ResponseMessage": message,
        "BillerID":        ONEBILL_BILLER_ID,
    }


def _notification_error(code: str, message: str) -> dict:
    return JSONResponse(
        status_code=200,
        content={
            "ResponseCode":    code,
            "ResponseMessage": message,
        }
    )


def _notification_success(
    consumer_number: str,
    transaction_id:  str,
    amount_paid:     str,
) -> dict:
    return {
        "ResponseCode":    "00",
        "ResponseMessage": "Payment recorded successfully",
        "ConsumerNumber":  consumer_number,
        "TransactionId":   transaction_id,
        "AmountPaid":      amount_paid,
        "AckHash":         build_payment_acknowledgement_hash(
                               consumer_number, transaction_id, str(amount_paid)
                           ),
        "AcknowledgementDateTime": datetime.now(PKT).strftime("%Y%m%d%H%M%S"),
    }
