# IESCO Citizen Portal

A full-stack web portal for IESCO (Islamabad Electric Supply Company) citizens to check load shedding schedules, pay bills, view tariffs, and see live feeder status on a map.

## Tech Stack

**Frontend:** React + Vite, Tailwind CSS, Shadcn/UI, TanStack Query, Mapbox GL, i18n  
**Backend:** FastAPI, Python, Supabase (PostgreSQL + PostGIS), Redis  
**Infrastructure:** Docker, GitHub Actions CI

## Features

- Live feeder status map with colored zones
- Load shedding schedule with sector filter and week view
- Active outage banner with real-time updates
- Bill payment and tariff rates
- Admin dashboard with protected routes
- Pakistan Standard Time (PKT) timezone handling
- Redis caching with automatic invalidation
- Supabase Realtime subscriptions

## Project Structure
## Getting Started

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Redis
```bash
docker compose up -d redis
```

## Environment Variables

Copy `.env.example` to `.env` in the backend folder and fill in your Supabase credentials.

## License

MIT
