from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from datetime import datetime, timezone
from app.config import get_supabase
from supabase import Client

router = APIRouter(prefix="/bills", tags=["Bills"])


@router.get("/{reference_no}")
def get_bill(
    reference_no: str,
    db: Client = Depends(get_supabase),
):
    result = db.table("bills").select("*").eq(
        "reference_no", reference_no
    ).order("created_at", desc=True).limit(1).execute()

    if not result.data:
        raise HTTPException(
            status_code=404,
            detail="No bill found for this reference number"
        )

    return result.data[0]


class PaymentRecord(BaseModel):
    reference_no: str
    transaction_ref: str


@router.post("/payment-callback")
def record_payment(
    body: PaymentRecord,
    db: Client = Depends(get_supabase),
):
    result = db.table("bills").update({
        "status": "paid",
        "transaction_ref": body.transaction_ref,
        "paid_at": datetime.now(timezone.utc).isoformat(),
    }).eq("reference_no", body.reference_no).execute()

    if not result.data:
        raise HTTPException(
            status_code=404,
            detail="Bill not found for this reference number"
        )

    return {
        "recorded": True,
        "reference_no": body.reference_no,
        "transaction_ref": body.transaction_ref,
    }
