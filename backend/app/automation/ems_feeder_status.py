# app/automation/ems_feeder_status.py
"""
STUB ONLY. IESCO's EMS (Energy Management System) at ems.iesco.com.pk
requires an internal employee login (SAP ID + CNIC) -- verified 2026-08-07.
There is no public API. This module does nothing until IESCO grants
API/webhook access and provides EMS_API_URL + EMS_API_KEY.
"""
import logging
from app.config import EMS_API_URL, EMS_API_KEY

log = logging.getLogger(__name__)


def sync_ems_feeder_status(db) -> dict:
    if not EMS_API_URL or not EMS_API_KEY:
        log.debug("[EMS Stub] Skipping sync -- not configured.")
        return {"synced": False, "reason": "not_configured"}

    # Real implementation goes here once IESCO grants access.
    log.warning("[EMS Stub] Credentials set but sync_ems_feeder_status() has no real implementation yet.")
    return {"synced": False, "reason": "stub_not_implemented"}