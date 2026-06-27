from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import ENVIRONMENT
from app.routers import feeders, schedules, tariffs, locations, services, bills, outage_reports, jazzcash, easypaisa

app = FastAPI(
    title="IESCO Citizen Portal API",
    version="1.0.0",
    description="Backend API for the IESCO Smart Citizen Web Portal",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    from fastapi.openapi.utils import get_openapi
    schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )
    schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
        }
    }
    schema["security"] = [{"BearerAuth": []}]
    app.openapi_schema = schema
    return app.openapi_schema

app.openapi = custom_openapi

ALLOWED_ORIGINS = (
    ["http://localhost:5173", "http://localhost:3000"]
    if ENVIRONMENT == "development"
    else ["https://portal.iesco.gov.pk"]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(feeders.router)
app.include_router(schedules.router)
app.include_router(tariffs.router)
app.include_router(locations.router)
app.include_router(services.router)
app.include_router(bills.router)
app.include_router(outage_reports.router)
app.include_router(jazzcash.router)
app.include_router(easypaisa.router)

@app.get("/", tags=["Health"])
def health_check():
    return {
        "status": "ok",
        "service": "IESCO Citizen Portal API",
        "version": "1.0.0",
        "environment": ENVIRONMENT,
    }

@app.get("/test-db", tags=["Health"])
def test_database():
    from app.config import supabase
    result = supabase.table("feeders").select(
        "feeder_code, name, status"
    ).limit(5).execute()
    return {
        "database": "connected",
        "sample_feeders": result.data,
    }

@app.get("/test-cache", tags=["Health"])
def test_cache():
    from app.config import redis_client
    redis_client.setex("health_check", 10, "ok")
    value = redis_client.get("health_check")
    return {
        "redis": "connected" if value == "ok" else "error",
    }





