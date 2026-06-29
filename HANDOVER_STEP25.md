# IESCO Citizen Portal — Step 25 Handover

## Project location
C:\Users\N TECH\iesco-portal
Branch: dev
Frontend: C:\Users\N TECH\iesco-portal\frontend
Backend: C:\Users\N TECH\iesco-portal\backend

## Last completed
Step 24 fully done and committed (9e0bde6 + subsequent commits).
Step 25 Parts 1-4 done. Currently mid-Part 5 (Urdu translation file).

## How to start servers
Backend:
  cd "C:\Users\N TECH\iesco-portal\backend"
  venv\Scripts\Activate.ps1
  uvicorn app.main:app --reload

Frontend (new terminal):
  cd "C:\Users\N TECH\iesco-portal\frontend"
  npm run dev

## Critical rules Claude must follow (learned the hard way)

### PowerShell
- findstr does NOT support | for alternation — always run separate findstr calls
- Never use array index arithmetic for file edits — use content-based Select-String matching
- For deduplication, use the foreach pattern with a $seen flag (not Where-Object + slicing)
- pip install silently goes to wrong venv — always use:
  & "C:\Users\N TECH\iesco-portal\backend\venv\Scripts\python.exe" -m pip install <package>
- After any App.jsx edit, verify ALL page imports still present (LoginPage was lost once)
- Em dashes in PowerShell here-strings cause encoding bugs — always swap for plain hyphens
- Ellipsis characters (...) in here-strings are fine in JSON values but swap in JSX strings

### Python
- Always verify imports after creating files:
  & "C:\Users\N TECH\iesco-portal\backend\venv\Scripts\python.exe" -c "from app.x import y; print('OK')"
- Pydantic v2.13.4 is installed
- pytz 2026.2 installed
- email-validator 2.3.0 installed (real venv path: C:\Users\N TECH\iesco-portal\backend\venv)

### React/Frontend
- Tailwind v4 — config is in src/tailwind.css under @theme, NO tailwind.config.js
- Always verify exports after creating JSX: findstr /n "export" filename.jsx
- TanStack Query v5 — no keepPreviousData, use placeholderData: (prev) => prev

### Git
- Always use explicit venv python for import checks before committing
- Commit message format: "feat: Step XX - description"

## Admin token (expires — get fresh from browser console)
Open http://localhost:5173, login as admin, then in DevTools Console:
JSON.parse(Object.values(localStorage).find(v => v?.includes?.('access_token') && v?.includes?.('"role"'))).access_token

## What Step 25 is building
Full bilingual EN/UR i18n with RTL layout, Noto Nastaliq Urdu font, and persistent language choice.

## Step 25 status

### Done
- Part 1: src/i18n/index.js updated with RTL switching, languageChanged handler, localStorage persistence
- Part 2: Google Fonts link added to index.html, RTL CSS rules added to src/index.css, --font-urdu already in src/tailwind.css
- Part 3: FlexRow component created at src/components/ui/FlexRow.jsx
- Part 4: src/i18n/locales/en.json fully replaced with complete translation set

### In progress
- Part 5: src/i18n/locales/ur.json — BEING WRITTEN NOW, not yet saved/verified

### Not started
- Part 6 onwards

## How to continue
1. Start a new chat
2. Paste this entire file as your first message
3. Then paste Part 5 of the Step 25 spec and say "verify ur.json was saved correctly then continue"
4. Claude will check the file and continue from there

## Supabase
Project URL and keys are in backend/.env — do not re-enter them.
Tables created so far: feeders, schedules, tariffs, locations, outage_reports,
  service_providers, provider_ratings, bills, sms_subscriptions, sms_log, service_requests

## Open issues to fix later
1. Redis not running — "Cache set error: Timeout" in uvicorn logs (non-blocking, app works fine)
2. SMS sector-based subscriptions not matched by feeder_id lookup in _send_feeder_sms_alerts
3. Twilio disabled (TWILIO_ENABLED=False in .env) — add credentials when available
4. Final UI/layout checks at 375px mobile deferred to end of project
