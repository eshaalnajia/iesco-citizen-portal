from pydantic import BaseModel, field_validator, EmailStr
from app.utils.sanitize import sanitize_text
from typing   import Optional
from datetime import date
import re

VALID_REQUEST_TYPES = {
    "new_connection",
    "meter_change",
    "energy_audit",
    "safety_inspection",
}

VALID_STATUSES = {
    "pending", "in_review", "approved",
    "rejected", "completed", "cancelled",
}


def validate_cnic(v: str) -> str:
    digits = re.sub(r"[-\s]", "", v.strip())
    if not re.match(r"^\d{13}$", digits):
        raise ValueError(
            "CNIC must be 13 digits. Enter it as printed on your card: XXXXX-XXXXXXX-X"
        )
    return f"{digits[:5]}-{digits[5:12]}-{digits[12]}"


def validate_phone(v: str) -> str:
    digits = re.sub(r"[-\s+()]", "", v.strip())
    if digits.startswith("92") and len(digits) == 12:
        digits = "0" + digits[2:]
    if not (digits.startswith("0") and len(digits) == 11 and digits.isdigit()):
        raise ValueError(
            "Please enter a valid Pakistani mobile number: 03XXXXXXXXX"
        )
    return digits


class NewConnectionDetails(BaseModel):
    property_type:    str
    load_required_kw: float
    plot_number:      str
    document_type:    str

    @field_validator("load_required_kw")
    @classmethod
    def validate_load(cls, v):
        if v <= 0 or v > 500:
            raise ValueError("Load must be between 0 and 500 kW")
        return v

    @field_validator("property_type")
    @classmethod
    def validate_property(cls, v):
        allowed = {"residential", "commercial", "industrial"}
        if v not in allowed:
            raise ValueError(f"property_type must be one of: {allowed}")
        return v


class MeterChangeDetails(BaseModel):
    meter_number:     str
    issue_type:       str
    current_reading:  Optional[int] = None

    @field_validator("issue_type")
    @classmethod
    def validate_issue(cls, v):
        allowed = {"burnt", "faulty_reading", "damaged", "theft", "upgrade"}
        if v not in allowed:
            raise ValueError(f"issue_type must be one of: {allowed}")
        return v


class EnergyAuditDetails(BaseModel):
    avg_monthly_bill:   float
    property_size_sqft: Optional[int] = None
    major_appliances:   list[str] = []
    concern:            str


class SafetyInspectionDetails(BaseModel):
    hazard_type:  str
    urgency:      str
    description:  str

    @field_validator("urgency")
    @classmethod
    def validate_urgency(cls, v):
        allowed = {"critical", "high", "medium", "low"}
        if v not in allowed:
            raise ValueError(f"urgency must be one of: {allowed}")
        return v

    @field_validator("description")
    @classmethod
    def validate_desc(cls, v):
        cleaned = sanitize_text(v)
        if len(cleaned.strip()) < 20:
            raise ValueError("Please describe the hazard in at least 20 characters")
        return cleaned


class ServiceRequestCreate(BaseModel):
    request_type:     str
    full_name:        str
    cnic:             str
    phone:            str
    email:            Optional[EmailStr] = None
    address:          str
    sector:           Optional[str] = None
    reference_number: Optional[str] = None
    details:          dict = {}

    @field_validator("request_type")
    @classmethod
    def validate_type(cls, v):
        if v not in VALID_REQUEST_TYPES:
            raise ValueError(f"request_type must be one of: {VALID_REQUEST_TYPES}")
        return v

    @field_validator("cnic")
    @classmethod
    def validate_cnic_field(cls, v):
        return validate_cnic(v)

    @field_validator("phone")
    @classmethod
    def validate_phone_field(cls, v):
        return validate_phone(v)

    @field_validator("full_name")
    @classmethod
    def validate_name(cls, v):
        cleaned = sanitize_text(v)
        if len(cleaned.strip()) < 3:
            raise ValueError("Full name must be at least 3 characters")
        return cleaned

    @field_validator("address")
    @classmethod
    def validate_address(cls, v):
        cleaned = sanitize_text(v)
        if len(cleaned.strip()) < 10:
            raise ValueError("Please provide a complete address (at least 10 characters)")
        return cleaned


class StatusUpdate(BaseModel):
    status:         str
    admin_notes:    Optional[str] = None
    assigned_to:    Optional[str] = None
    scheduled_date: Optional[date] = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v):
        if v not in VALID_STATUSES:
            raise ValueError(f"status must be one of: {VALID_STATUSES}")
        return v

