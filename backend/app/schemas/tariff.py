from pydantic import BaseModel, field_validator, model_validator
from typing import Optional
from datetime import date


VALID_CONSUMER_TYPES = {
    "residential", "commercial", "industrial", "agricultural"
}


class TariffSlabCreate(BaseModel):
    slab_name:      str
    consumer_type:  str
    units_from:     int
    units_to:       Optional[int] = None
    peak_rate:      float
    offpeak_rate:   float
    fixed_charge:   float = 0.0
    fc_surcharge:   float = 0.0
    tr_surcharge:   float = 0.0
    effective_from: date

    @field_validator("consumer_type")
    @classmethod
    def validate_consumer_type(cls, v):
        if v not in VALID_CONSUMER_TYPES:
            raise ValueError(
                f"consumer_type must be one of: {sorted(VALID_CONSUMER_TYPES)}"
            )
        return v

    @field_validator("units_from")
    @classmethod
    def validate_units_from(cls, v):
        if v < 0:
            raise ValueError("units_from cannot be negative")
        return v

    @field_validator("peak_rate", "offpeak_rate")
    @classmethod
    def validate_rates(cls, v):
        if v < 0:
            raise ValueError("Rates cannot be negative")
        return round(v, 4)

    @field_validator("fixed_charge", "fc_surcharge", "tr_surcharge")
    @classmethod
    def validate_charges(cls, v):
        if v < 0:
            raise ValueError("Charges cannot be negative")
        return round(v, 4)

    @model_validator(mode="after")
    def validate_slab_range(self):
        if self.units_to is not None:
            if self.units_to <= self.units_from:
                raise ValueError(
                    "units_to must be greater than units_from. "
                    "Set units_to=null for the highest (unlimited) slab."
                )
        return self


class TariffRevisionCreate(BaseModel):
    slabs: list[TariffSlabCreate]

    @field_validator("slabs")
    @classmethod
    def validate_slabs(cls, v):
        if not v:
            raise ValueError("At least one slab is required")
        if len(v) > 20:
            raise ValueError("Cannot submit more than 20 slabs at once")

        types = {s.consumer_type for s in v}
        if len(types) > 1:
            raise ValueError(
                f"All slabs must have the same consumer_type. Found: {types}"
            )

        sorted_slabs = sorted(v, key=lambda s: s.units_from)
        for i, slab in enumerate(sorted_slabs[:-1]):
            next_slab = sorted_slabs[i + 1]
            if slab.units_to is None:
                raise ValueError(
                    f"Only the last slab can have units_to=null (unlimited). "
                    f"Slab starting at {slab.units_from} is not the last."
                )
            if slab.units_to + 1 != next_slab.units_from:
                raise ValueError(
                    f"Slabs are not contiguous: slab ending at {slab.units_to} "
                    f"is followed by slab starting at {next_slab.units_from}. "
                    f"Expected next slab to start at {slab.units_to + 1}."
                )

        return v


class BillCalculationRequest(BaseModel):
    units_consumed: int
    consumer_type:  str = "residential"
    peak_hours_pct: float = 0.3

    @field_validator("units_consumed")
    @classmethod
    def validate_units(cls, v):
        if v < 0:
            raise ValueError("units_consumed cannot be negative")
        if v > 100000:
            raise ValueError("units_consumed seems unreasonably high (>100,000)")
        return v

    @field_validator("peak_hours_pct")
    @classmethod
    def validate_pct(cls, v):
        if not 0 <= v <= 1:
            raise ValueError("peak_hours_pct must be between 0 and 1")
        return v

    @field_validator("consumer_type")
    @classmethod
    def validate_type(cls, v):
        if v not in VALID_CONSUMER_TYPES:
            raise ValueError(f"consumer_type must be one of: {sorted(VALID_CONSUMER_TYPES)}")
        return v


class TariffSlabUpdate(BaseModel):
    slab_name:    Optional[str]   = None
    peak_rate:    Optional[float] = None
    offpeak_rate: Optional[float] = None
    fixed_charge: Optional[float] = None
    fc_surcharge: Optional[float] = None
    tr_surcharge: Optional[float] = None


class SlabCostBreakdown(BaseModel):
    slab_label:    str
    units_in_slab: int
    peak_units:    float
    offpeak_units: float
    peak_cost:     float
    offpeak_cost:  float
    slab_total:    float


class BillCalculationResult(BaseModel):
    units_consumed:  int
    consumer_type:   str
    effective_from:  str
    slab_breakdown:  list[SlabCostBreakdown]
    energy_charges:  float
    fixed_charge:    float
    fc_surcharge:    float
    tr_surcharge:    float
    subtotal:        float
    gst_rate:        float = 0.17
    gst_amount:      float
    total_payable:   float
    average_rate:    float
