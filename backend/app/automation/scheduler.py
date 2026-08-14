# app/automation/scheduler.py
"""
Wires up background automation jobs using APScheduler, running inside the
FastAPI process. Started on app startup, stopped cleanly on shutdown.

Jobs:
  - schedule_scraper              : daily at 06:00 PKT
  - stale reminders                : every 6 hours
  - EMS sync (stub)                : every 60 seconds (safe no-op until IESCO grants access)
  - prompt_pending_confirmations   : daily at 07:00 PKT
  - resolve_expired_confirmations  : daily at 08:00 PKT (staggered after prompting)
"""
import asyncio
import logging

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

log = logging.getLogger(__name__)

_scheduler: BackgroundScheduler | None = None


def create_scheduler(db, cache=None) -> BackgroundScheduler:
    scheduler = BackgroundScheduler(timezone="Asia/Karachi")

    def job_schedule_scraper():
        from app.automation.schedule_scraper import run_schedule_scraper
        log.info("[Scheduler] Running schedule scraper job...")
        try:
            result = asyncio.run(run_schedule_scraper(db, cache))
            log.info(f"[Scheduler] Schedule scraper result: {result}")
        except Exception as e:
            log.error(f"[Scheduler] Schedule scraper job crashed: {e}")

    def job_stale_reminders():
        from app.automation.request_reminders import send_stale_request_reminders
        log.info("[Scheduler] Running stale request reminders job...")
        try:
            result = asyncio.run(send_stale_request_reminders(db))
            log.info(f"[Scheduler] Stale reminders result: {result}")
        except Exception as e:
            log.error(f"[Scheduler] Stale reminders job crashed: {e}")

    def job_ems_sync():
        from app.automation.ems_feeder_status import sync_ems_feeder_status
        try:
            sync_ems_feeder_status(db)
        except Exception as e:
            log.debug(f"[Scheduler] EMS sync stub raised (expected until IESCO access granted): {e}")

    def job_prompt_confirmations():
        from app.automation.request_confirmations import prompt_pending_confirmations
        log.info("[Scheduler] Running prompt-pending-confirmations job...")
        try:
            result = asyncio.run(prompt_pending_confirmations(db))
            log.info(f"[Scheduler] Prompt confirmations result: {result}")
        except Exception as e:
            log.error(f"[Scheduler] Prompt confirmations job crashed: {e}")

    def job_resolve_expired_confirmations():
        from app.automation.request_confirmations import resolve_expired_confirmations
        log.info("[Scheduler] Running resolve-expired-confirmations job...")
        try:
            result = asyncio.run(resolve_expired_confirmations(db))
            log.info(f"[Scheduler] Resolve expired confirmations result: {result}")
        except Exception as e:
            log.error(f"[Scheduler] Resolve expired confirmations job crashed: {e}")

    scheduler.add_job(
        job_schedule_scraper,
        trigger=CronTrigger(hour=6, minute=0),
        id="schedule_scraper",
        name="Daily IESCO schedule import",
        replace_existing=True,
        misfire_grace_time=3600,
    )

    scheduler.add_job(
        job_stale_reminders,
        trigger=IntervalTrigger(hours=6),
        id="stale_request_reminders",
        name="Stale request reminders",
        replace_existing=True,
    )

    scheduler.add_job(
        job_ems_sync,
        trigger=IntervalTrigger(seconds=60),
        id="ems_feeder_sync",
        name="EMS feeder status sync",
        replace_existing=True,
    )

    scheduler.add_job(
        job_prompt_confirmations,
        trigger=CronTrigger(hour=7, minute=0),
        id="prompt_pending_confirmations",
        name="Prompt pending request confirmations",
        replace_existing=True,
        misfire_grace_time=3600,
    )

    scheduler.add_job(
        job_resolve_expired_confirmations,
        trigger=CronTrigger(hour=8, minute=0),
        id="resolve_expired_confirmations",
        name="Resolve expired request confirmations",
        replace_existing=True,
        misfire_grace_time=3600,
    )

    return scheduler


def start_scheduler(db, cache=None):
    global _scheduler
    if _scheduler and _scheduler.running:
        log.info("[Scheduler] Already running, skipping start.")
        return
    _scheduler = create_scheduler(db, cache)
    _scheduler.start()
    log.info("[Scheduler] Started. Jobs: " + ", ".join(j.name for j in _scheduler.get_jobs()))


def stop_scheduler():
    global _scheduler
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
        log.info("[Scheduler] Stopped.")


def get_scheduler() -> BackgroundScheduler | None:
    return _scheduler