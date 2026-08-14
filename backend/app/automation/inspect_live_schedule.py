"""
RUN THIS TO VALIDATE THE SCRAPER AGAINST THE REAL LIVE FILE.

Usage:
    python -m app.automation.inspect_live_schedule
"""
import asyncio
import io

import openpyxl

from app.automation.schedule_scraper import (
    find_islamabad_xlsx_url,
    download_xlsx,
    parse_xlsx_to_schedules,
    get_feeder_map,
)
from app.config import supabase


async def main():
    print("Step 1: Finding Islamabad XLSX link on iesco.com.pk/load-shedding ...")
    url = await find_islamabad_xlsx_url()
    if not url:
        print("FAILED to find the link. The page structure may have changed.")
        return
    print(f"Found: {url}\n")

    print("Step 2: Downloading the file ...")
    xlsx_bytes = await download_xlsx(url)
    if not xlsx_bytes:
        print("FAILED to download.")
        return
    print(f"Downloaded {len(xlsx_bytes):,} bytes\n")

    print("Step 3: Opening with openpyxl and printing the first 30 rows raw ...\n")
    wb = openpyxl.load_workbook(io.BytesIO(xlsx_bytes), data_only=True)
    ws = wb.active
    print(f"Sheet name: {ws.title}")
    print(f"Dimensions: {ws.dimensions}\n")

    rows = list(ws.iter_rows(values_only=True))
    for i, row in enumerate(rows[:30]):
        print(f"Row {i}: {row}")

    if len(rows) > 30:
        print(f"... ({len(rows) - 30} more rows)")

    print("\nStep 4: Running the actual parser against this file (with real feeder_map) ...")
    feeder_map = get_feeder_map(supabase)
    print(f"Loaded {len(feeder_map)} feeder name/code entries from your DB\n")

    schedules = parse_xlsx_to_schedules(xlsx_bytes, feeder_map)
    print(f"Parsed {len(schedules)} schedule entries.")
    if schedules:
        print("\nFirst 5 parsed entries:")
        for s in schedules[:5]:
            print(f"  {s}")


if __name__ == "__main__":
    asyncio.run(main())