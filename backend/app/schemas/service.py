from pydantic import BaseModel, field_validator
from typing import Optional


VALID_PROVIDER_TYPES = {
    "electrician",
    "repair_centre",
    "meter_agent",
    "new_connection_agent",
}

PROVIDER_TYPE_LABELS = {
    "electrician":          "Licensed Electrician",
    "repair_centre":        "Repair Centre",
    "meter_agent":          "Meter Agent",
    "new_connection_agent": "New Connection Agent",
}


class ServiceProviderCreate(BaseModel):
    name:           str
    provider_type:  str
    area:           str
    address:        Optional[str] = None
    phone:          str
    whatsapp:       Optional[str] = None
    license_number: Optional[str] = None

    @field_validator("provider_type")
    @classmethod
    def validate_type(cls, v):
        if v not in VALID_PROVIDER_TYPES:
            raise ValueError(
                f"provider_type must be one of: {sorted(VALID_PROVIDER_TYPES)}"
            )
        return v

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v):
        digits = "".join(filter(str.isdigit, v))
        if len(digits) < 10:
            raise ValueError("Phone number must have at least 10 digits")
        return v.strip()

    @field_validator("name")
    @classmethod
    def validate_name(cls, v):
        if len(v.strip()) < 2:
            raise ValueError("Name must be at least 2 characters")
        return v.strip()


class ServiceProviderUpdate(BaseModel):
    name:           Optional[str]   = None
    area:           Optional[str]   = None
    address:        Optional[str]   = None
    phone:          Optional[str]   = None
    whatsapp:       Optional[str]   = None
    license_number: Optional[str]   = None
    is_available:   Optional[bool]  = None


class RatingSubmit(BaseModel):
    rating:  int
    comment: Optional[str] = None

    @field_validator("rating")
    @classmethod
    def validate_rating(cls, v):
        if not 1 <= v <= 5:
            raise ValueError("Rating must be between 1 and 5")
        return v

    @field_validator("comment")
    @classmethod
    def validate_comment(cls, v):
        if v and len(v) > 500:
            raise ValueError("Comment cannot exceed 500 characters")
        return v
