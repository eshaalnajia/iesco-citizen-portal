from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import date
import re

VALID_TYPES = {"scheduled", "unplanned", "maintenance"}

class ScheduleCreate(BaseModel):
    feeder_id:     str
    schedule_date: date
    start_time:    str
    end_time:      str
    type:          str = "scheduled"
    notes:         Optional[str] = None

    @field_validator("start_time", "end_time")
    @classmethod
    def validate_time_format(cls, v):
        if not re.match(r"^\d{2}:\d{2}$", v):
            raise ValueError("Time must be in HH:MM format (24-hour)")
        h, m = map(int, v.split(":"))
        if not (0 <= h <= 23 and 0 <= m <= 59):
            raise ValueError("Invalid time value")
        return v

    @field_validator("type")
    @classmethod
    def validate_type(cls, v):
        if v not in VALID_TYPES:
            raise ValueError(f"type must be one of: {VALID_TYPES}")
        return v


class ScheduleUpdate(BaseModel):
    schedule_date: Optional[date]   = None
    start_time:    Optional[str]    = None
    end_time:      Optional[str]    = None
    type:          Optional[str]    = None
    notes:         Optional[str]    = None

    @field_validator("start_time", "end_time")
    @classmethod
    def validate_time(cls, v):
        if v is None:
            return v
        if not re.match(r"^\d{2}:\d{2}$", v):
            raise ValueError("Time must be in HH:MM format")
        return v


class ScheduleBulkCreate(BaseModel):
    schedules: list[ScheduleCreate]

    @field_validator("schedules")
    @classmethod
    def validate_not_empty(cls, v):
        if not v:
            raise ValueError("schedules list cannot be empty")
        if len(v) > 200:
            raise ValueError("Cannot bulk import more than 200 schedules at once")
        return v


class FeederSummary(BaseModel):
    feeder_code: str
    name:        str
    sector:      str


class ScheduleResponse(BaseModel):
    id:             str
    feeder_id:      str
    schedule_date:  date
    start_time:     str
    end_time:       str
    duration_hours: Optional[float]
    type:           str
    notes:          Optional[str]
    is_active:      bool = False
    feeders:        Optional[FeederSummary] = None

    class Config:
        from_attributes = True
