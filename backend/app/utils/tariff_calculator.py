from app.schemas.tariff import SlabCostBreakdown, BillCalculationResult


def calculate_bill(
    units_consumed: int,
    slabs: list[dict],
    consumer_type: str,
    peak_hours_pct: float = 0.3,
) -> BillCalculationResult:
    """
    Calculates the electricity bill for a given number of consumed units
    against the provided tariff slabs.

    Pakistan uses a progressive tiered tariff - the more you consume,
    the higher your per-unit rate for ALL units in that slab.
    Units are apportioned to slabs in order (lowest first).
    """

    if not slabs:
        raise ValueError("No tariff slabs available for this consumer type")

    sorted_slabs = sorted(slabs, key=lambda s: s["units_from"])

    slab_breakdown = []
    remaining_units = units_consumed
    total_energy = 0.0
    total_fc = 0.0
    total_tr = 0.0
    fixed_charge = sorted_slabs[-1]["fixed_charge"] or 0.0

    for slab in sorted_slabs:
        if remaining_units <= 0:
            break

        units_from = slab["units_from"]
        units_to = slab["units_to"]

        if units_to is None:
            units_in_slab = remaining_units
        else:
            slab_capacity = units_to - units_from + 1
            units_in_slab = min(remaining_units, slab_capacity)

        if units_in_slab <= 0:
            continue

        peak_units = round(units_in_slab * peak_hours_pct, 2)
        offpeak_units = round(units_in_slab * (1 - peak_hours_pct), 2)

        peak_rate = float(slab["peak_rate"])
        offpeak_rate = float(slab["offpeak_rate"])
        fc_rate = float(slab.get("fc_surcharge") or 0)
        tr_rate = float(slab.get("tr_surcharge") or 0)

        peak_cost = round(peak_units * peak_rate, 2)
        offpeak_cost = round(offpeak_units * offpeak_rate, 2)
        slab_total = round(peak_cost + offpeak_cost, 2)

        total_energy += slab_total
        total_fc += round(units_in_slab * fc_rate, 2)
        total_tr += round(units_in_slab * tr_rate, 2)

        if units_to is None:
            slab_label = f"{units_from}+ units"
        else:
            slab_label = f"{units_from}-{units_to} units"

        slab_breakdown.append(SlabCostBreakdown(
            slab_label=slab_label,
            units_in_slab=units_in_slab,
            peak_units=peak_units,
            offpeak_units=offpeak_units,
            peak_cost=peak_cost,
            offpeak_cost=offpeak_cost,
            slab_total=slab_total,
        ))

        remaining_units -= units_in_slab

    energy_charges = round(total_energy, 2)
    fc_surcharge = round(total_fc, 2)
    tr_surcharge = round(total_tr, 2)
    subtotal = round(energy_charges + fixed_charge + fc_surcharge + tr_surcharge, 2)
    gst_rate = 0.17
    gst_amount = round(subtotal * gst_rate, 2)
    total_payable = round(subtotal + gst_amount, 2)
    average_rate = (
        round(total_payable / units_consumed, 4)
        if units_consumed > 0 else 0
    )

    effective_from = str(sorted_slabs[0].get("effective_from", ""))

    return BillCalculationResult(
        units_consumed=units_consumed,
        consumer_type=consumer_type,
        effective_from=effective_from,
        slab_breakdown=slab_breakdown,
        energy_charges=energy_charges,
        fixed_charge=fixed_charge,
        fc_surcharge=fc_surcharge,
        tr_surcharge=tr_surcharge,
        subtotal=subtotal,
        gst_rate=gst_rate,
        gst_amount=gst_amount,
        total_payable=total_payable,
        average_rate=average_rate,
    )
