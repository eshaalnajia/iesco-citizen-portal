from pydantic import BaseModel, field_validator
from app.utils.sanitize import sanitize_text
from typing import Optional


VALID_AREA_TYPES = {"sector", "satellite_town", "cantonment", "rural"}


class LocationCreate(BaseModel):
    name:           str
    area_type:      str = "sector"
    feeder_id:      Optional[str] = None   # nullable - link later once GeoJSON is ready
    lat:            float
    lng:            float
    office_name:    Optional[str] = None
    office_address: Optional[str] = None
    office_phone:   Optional[str] = None
    complaint_phone: Optional[str] = None
    office_hours:   str = "9:00 AM - 4:00 PM (Mon-Fri)"

    @field_validator("area_type")
    @classmethod
    def validate_area_type(cls, v):
        if v not in VALID_AREA_TYPES:
            raise ValueError(
                f"area_type must be one of: {sorted(VALID_AREA_TYPES)}"
            )
        return v

    @field_validator("office_address")
    @classmethod
    def validate_office_address(cls, v):
        return sanitize_text(v)

    @field_validator("lat")
    @classmethod
    def validate_lat(cls, v):
        if not -90 <= v <= 90:
            raise ValueError("lat must be between -90 and 90")
        return v

    @field_validator("lng")
    @classmethod
    def validate_lng(cls, v):
        if not -180 <= v <= 180:
            raise ValueError("lng must be between -180 and 180")
        return v


class LocationUpdate(BaseModel):
    name:            Optional[str]   = None
    area_type:       Optional[str]   = None
    feeder_id:       Optional[str]   = None
    lat:             Optional[float] = None
    lng:             Optional[float] = None
    office_name:     Optional[str]   = None
    office_address:  Optional[str]   = None
    office_phone:    Optional[str]   = None
    complaint_phone: Optional[str]   = None
    office_hours:    Optional[str]   = None
