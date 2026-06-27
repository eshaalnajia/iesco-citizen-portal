from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import date, datetime
import re

VALID_PAYMENT_METHODS = {"jazzcash", "easypaisa", "1bill", "bank", "cash"}
VALID_STATUSES = {"unpaid", "paid", "partial", "overdue"}


def validate_reference_number(v: str) -> str:
    cleaned = v.strip()
    if not re.match(r"^\d{14}$", cleaned):
        raise ValueError(
            "Reference number must be exactly 14 digits. "
            "Find it printed on your paper electricity bill."
        )
    if cleaned == "0" * 14:
        raise ValueError("Invalid reference number.")
    return cleaned


class PaymentCallbackRequest(BaseModel):
    reference_number: str
    payment_method:   str
    transaction_ref:  str
    amount_paid:      float

    @field_validator("reference_number")
    @classmethod
    def validate_ref(cls, v):
        return validate_reference_number(v)

    @field_validator("payment_method")
    @classmethod
    def validate_method(cls, v):
        if v not in VALID_PAYMENT_METHODS:
            raise ValueError(f"payment_method must be one of: {VALID_PAYMENT_METHODS}")
        return v

    @field_validator("amount_paid")
    @classmethod
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError("amount_paid must be greater than zero")
        return round(v, 2)

    @field_validator("transaction_ref")
    @classmethod
    def validate_txn_ref(cls, v):
        if not v or len(v.strip()) < 4:
            raise ValueError("transaction_ref must be a non-empty string from the gateway")
        return v.strip()


class BillSimulateRequest(BaseModel):
    reference_number:  str
    consumer_name:     str
    consumer_address:  str
    units_consumed:    int
    bill_amount:       float
    arrears:           float = 0.0
    taxes:             float = 0.0
    due_date:          date
    billing_month:     str
    payment_status:    str = "unpaid"

    @field_validator("reference_number")
    @classmethod
    def validate_ref(cls, v):
        return validate_reference_number(v)

    @field_validator("units_consumed")
    @classmethod
    def validate_units(cls, v):
        if v < 0 or v > 50000:
            raise ValueError("units_consumed must be between 0 and 50,000")
        return v

    @field_validator("payment_status")
    @classmethod
    def validate_status(cls, v):
        if v not in VALID_STATUSES:
            raise ValueError(f"payment_status must be one of: {VALID_STATUSES}")
        return v


class BillResponse(BaseModel):
    id:               str
    reference_number: str
    consumer_name:    Optional[str]
    consumer_address: Optional[str]
    units_consumed:   Optional[int]
    bill_amount:      Optional[float]
    arrears:          Optional[float]
    taxes:            Optional[float]
    total_payable:    Optional[float]
    due_date:         Optional[str]
    billing_month:    Optional[str]
    payment_status:   str
    payment_method:   Optional[str]
    payment_date:     Optional[str]
    transaction_ref:  Optional[str]
    fetched_at:       Optional[str]
    is_overdue:       bool = False
