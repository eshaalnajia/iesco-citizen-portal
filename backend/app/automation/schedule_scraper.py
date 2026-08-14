# app/automation/schedule_scraper.py
"""
Downloads IESCO's published load shedding schedule from iesco.com.pk,
parses the Excel file, and inserts entries into the schedules table.

VERIFIED AGAINST THE LIVE SITE (2026-08-07):
  https://iesco.com.pk/load-shedding renders a plain HTML table (not JS-rendered),
  columns: Circle/Office Name | Date | Detail. The "Detail" link text is
  literally "Click to View" for every row -- it carries no identifying info.
  The circle name must be read from the row itself, not the link text.

  Real Islamabad row observed:
    Circle/Office Name: "Islamabad"
    Detail link: https://iesco.com.pk/storage/loadshedding-management-schedules/
                 January2026/VWlc7yFxpvi1PL5uA10S.xlsx

  Filenames are randomized; folder date does not reliably match the schedule's
  actual coverage month. NEVER hardcode a URL -- always re-scrape the link.

SCHEMA NOTE: this project's `schedules` table uses start_time/end_time as
HH:MM strings (see app/schemas/schedule.py's ^\\d{2}:\\d{2}$ validator),
NOT HH:MM:SS. There is also a Postgres exclusion constraint preventing
overlapping schedules per feeder (same one app/routers/schedules.py's
create_schedule() catches). We insert one row at a time and treat overlap
conflicts as "skipped", not errors -- the constraint is doing its job.
"""

import io
import logging
import re
from datetime import date
from typing import Optional

import httpx
import openpyxl
from bs4 import BeautifulSoup

log = logging.getLogger(__name__)

IESCO_LOADSHEDDING_URL = "https://iesco.com.pk/load-shedding"
ISLAMABAD_ROW_KEYWORDS = ["islamabad", "islambad", "isb"]
REQUEST_TIMEOUT = 30
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/120.0.0.0 Safari/537.36"
)


# ── Step 1: Find the current Islamabad XLSX URL ────────────────────────────

async def find_islamabad_xlsx_url() -> Optional[str]:
    async with httpx.AsyncClient(
        timeout=REQUEST_TIMEOUT,
        headers={"User-Agent": USER_AGENT},
        follow_redirects=True,
    ) as client:
        try:
            resp = await client.get(IESCO_LOADSHEDDING_URL)
            resp.raise_for_status()
        except httpx.HTTPError as e:
            log.error(f"[ScheduleScraper] Failed to fetch iesco.com.pk: {e}")
            return None

    soup = BeautifulSoup(resp.text, "html.parser")

    for row in soup.find_all("tr"):
        row_text = row.get_text(" ", strip=True).lower()
        if not any(kw in row_text for kw in ISLAMABAD_ROW_KEYWORDS):
            continue
        link = row.find("a", href=True)
        if not link:
            continue
        href = link["href"]
        if ".xlsx" in href.lower() or ".xls" in href.lower():
            return href if href.startswith("http") else "https://iesco.com.pk" + href

    xlsx_links = [
        a for a in soup.find_all("a", href=True)
        if ".xlsx" in a["href"].lower() or ".xls" in a["href"].lower()
    ]
    if not xlsx_links:
        log.error("[ScheduleScraper] No Excel links found -- page structure may have changed.")
        return None

    for a in xlsx_links:
        container = a
        combined_text = ""
        for _ in range(3):
            if container.parent is None:
                break
            container = container.parent
            combined_text += " " + container.get_text(" ", strip=True).lower()
        if any(kw in combined_text for kw in ISLAMABAD_ROW_KEYWORDS):
            href = a["href"]
            return href if href.startswith("http") else "https://iesco.com.pk" + href

    if len(xlsx_links) == 1:
        href = xlsx_links[0]["href"]
        log.warning(f"[ScheduleScraper] Could not confirm Islamabad -- using only link: {href}")
        return href if href.startswith("http") else "https://iesco.com.pk" + href

    log.error(f"[ScheduleScraper] Multiple Excel files, none identified as Islamabad: "
              f"{[a['href'] for a in xlsx_links]}")
    return None


# ── Step 2: Download the Excel file ─────────────────────────────────────────

async def download_xlsx(url: str) -> Optional[bytes]:
    async with httpx.AsyncClient(
        timeout=60,
        headers={"User-Agent": USER_AGENT},
        follow_redirects=True,
    ) as client:
        try:
            resp = await client.get(url)
            resp.raise_for_status()
            content_type = resp.headers.get("content-type", "")
            if "html" in content_type:
                log.error(f"[ScheduleScraper] URL returned HTML instead of Excel: {url}")
                return None
            return resp.content
        except httpx.HTTPError as e:
            log.error(f"[ScheduleScraper] Failed to download XLSX from {url}: {e}")
            return None


# ── Step 3: Parse the Excel into schedule entries ───────────────────────────

def _match_feeder(feeder_name: str, feeder_map: dict[str, str]) -> Optional[str]:
    """feeder_map is {feeder_code_or_name: feeder_id}, built from your feeders table."""
    if not feeder_name:
        return None
    cleaned = feeder_name.strip()

    if cleaned in feeder_map:
        return feeder_map[cleaned]

    norm = re.sub(r"[^A-Z0-9]", "", cleaned.upper())
    for code, fid in feeder_map.items():
        if norm == re.sub(r"[^A-Z0-9]", "", code.upper()):
            return fid

    for code, fid in feeder_map.items():
        code_norm = re.sub(r"[^A-Z0-9]", "", code.upper())
        if code_norm and code_norm in norm:
            return fid

    return None


_TIME_RANGE_RE = re.compile(
    r"(\d{1,2}[:.]\d{2})\s*(?:AM|PM|am|pm)?\s*[-–to]{1,3}\s*(\d{1,2}[:.]\d{2})\s*(?:AM|PM|am|pm)?"
)
_HOUR_ONLY_RANGE_RE = re.compile(
    r"\b(\d{1,2})\s*(?:AM|PM|am|pm)?\s*[-–to]{1,3}\s*(\d{1,2})\s*(?:AM|PM|am|pm)?\b"
)


def _normalize_time(raw: str) -> Optional[str]:
    """Converts a loosely-formatted time string to HH:MM (matches this project's schema)."""
    raw = raw.strip().replace(".", ":")
    try:
        if ":" in raw:
            parts = raw.split(":")
            hour = int(parts[0])
            minute = int(parts[1]) if len(parts) > 1 else 0
        else:
            hour = int(raw)
            minute = 0
        if 0 <= hour <= 23 and 0 <= minute <= 59:
            return f"{hour:02d}:{minute:02d}"
    except (ValueError, IndexError):
        pass
    return None


def _extract_time_windows(row: tuple) -> list[dict]:
    windows = []
    for cell in row:
        if not cell or not isinstance(cell, str):
            continue
        for match in _TIME_RANGE_RE.finditer(cell):
            start = _normalize_time(match.group(1))
            end = _normalize_time(match.group(2))
            if start and end:
                windows.append({"start": start, "end": end})
        if not windows:
            for match in _HOUR_ONLY_RANGE_RE.finditer(cell):
                start = _normalize_time(match.group(1))
                end = _normalize_time(match.group(2))
                if start and end:
                    windows.append({"start": start, "end": end})
    return windows


def parse_xlsx_to_schedules(
    xlsx_bytes: bytes,
    feeder_map: dict[str, str],
    target_month: date | None = None,
) -> list[dict]:
    """
    Format-agnostic parser: scans every row for a plausible feeder name plus
    time-range patterns, rather than assuming a fixed column layout. Resilient
    to IESCO changing column order.
    """
    try:
        wb = openpyxl.load_workbook(io.BytesIO(xlsx_bytes), data_only=True)
        ws = wb.active
    except Exception as e:
        log.error(f"[ScheduleScraper] Failed to open Excel file: {e}")
        return []

    rows = list(ws.iter_rows(values_only=True))
    if not rows:
        log.error("[ScheduleScraper] Excel file is empty")
        return []

    header_row = None
    for i, row in enumerate(rows[:10]):
        row_text = " ".join(str(c).lower() for c in row if c)
        if any(kw in row_text for kw in ["feeder", "division", "sub-division", "circle"]):
            header_row = i
            break
    if header_row is None:
        header_row = 0

    schedules = []
    skipped = 0
    start_date = target_month or date.today()

    for row_num, row in enumerate(rows[header_row + 1:], start=header_row + 2):
        if not any(row):
            continue

        feeder_name = None
        for cell in row:
            if cell and isinstance(cell, str) and len(str(cell).strip()) > 2:
                feeder_name = str(cell).strip()
                break
        if not feeder_name:
            skipped += 1
            continue

        feeder_id = _match_feeder(feeder_name, feeder_map)
        if not feeder_id:
            skipped += 1
            continue

        time_windows = _extract_time_windows(row)
        if not time_windows:
            skipped += 1
            continue

        for window in time_windows:
            schedules.append({
                "feeder_id":     feeder_id,
                "schedule_date": str(start_date),
                "start_time":    window["start"],
                "end_time":      window["end"],
                "type":          "scheduled",
                "notes":         "Auto-imported from IESCO schedule XLSX",
            })

    log.info(f"[ScheduleScraper] Parsed {len(schedules)} schedule entries ({skipped} skipped)")
    return schedules


# ── Step 4: Insert into Supabase, one at a time (overlap constraint aware) ──

def insert_schedules(db, schedules: list[dict]) -> dict:
    """
    Inserts one row at a time (not bulk) so a single overlap conflict
    doesn't block the rest. Mirrors the pattern in
    app/routers/schedules.py's bulk_create_schedules().
    """
    if not schedules:
        return {"created": 0, "skipped": 0, "errors": 0}

    created = 0
    skipped_overlap = 0
    errors = 0

    for entry in schedules:
        try:
            db.table("schedules").insert(entry).execute()
            created += 1
        except Exception as e:
            err = str(e)
            if "no_overlap" in err or "exclusion constraint" in err.lower():
                skipped_overlap += 1
            else:
                log.error(f"[ScheduleScraper] Failed to insert {entry}: {e}")
                errors += 1

    return {"created": created, "skipped": skipped_overlap, "errors": errors}


def get_feeder_map(db) -> dict[str, str]:
    try:
        result = db.table("feeders").select("id, feeder_code, name").execute()
        feeder_map = {}
        for row in result.data:
            if row.get("feeder_code"):
                feeder_map[row["feeder_code"]] = row["id"]
            if row.get("name"):
                feeder_map[row["name"]] = row["id"]
        return feeder_map
    except Exception as e:
        log.error(f"[ScheduleScraper] Failed to load feeder map: {e}")
        return {}


# ── Entry point: full scrape-parse-insert pipeline ─────────────────────────

async def run_schedule_scraper(db, cache=None) -> dict:
    """
    Full pipeline. Never raises -- always returns a result dict, and never
    touches existing DB data if any step fails.
    """
    xlsx_url = await find_islamabad_xlsx_url()
    if not xlsx_url:
        return {"success": False, "reason": "could_not_find_xlsx_link",
                "xlsx_url": None, "parsed": 0, "created": 0, "skipped": 0, "errors": 0}

    xlsx_bytes = await download_xlsx(xlsx_url)
    if not xlsx_bytes:
        return {"success": False, "reason": "download_failed",
                "xlsx_url": xlsx_url, "parsed": 0, "created": 0, "skipped": 0, "errors": 0}

    feeder_map = get_feeder_map(db)
    if not feeder_map:
        return {"success": False, "reason": "no_feeders_in_database",
                "xlsx_url": xlsx_url, "parsed": 0, "created": 0, "skipped": 0, "errors": 0}

    schedules = parse_xlsx_to_schedules(xlsx_bytes, feeder_map)
    if not schedules:
        log.error("[ScheduleScraper] No schedules parsed. DB left untouched.")
        return {"success": False, "reason": "no_schedules_parsed",
                "xlsx_url": xlsx_url, "parsed": 0, "created": 0, "skipped": 0, "errors": 0}

    result = insert_schedules(db, schedules)

    # Match this project's real cache invalidation pattern
    if cache is not None:
        from app.cache import cache_delete_pattern
        try:
            cache_delete_pattern(cache, "schedules:*")
        except Exception as e:
            log.warning(f"[ScheduleScraper] Failed to invalidate cache: {e}")

    return {
        "success": result["errors"] == 0,
        "xlsx_url": xlsx_url,
        "parsed": len(schedules),
        "created": result["created"],
        "skipped": result["skipped"],
        "errors": result["errors"],
    }