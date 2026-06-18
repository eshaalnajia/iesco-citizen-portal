from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import supabase

app = FastAPI(title="IESCO Portal API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health():
    return {"status": "ok"}

@app.get("/test-db")
def test_db():
    result = supabase.table("feeders").select("feeder_code, name, status").execute()
    return {"feeders": result.data}
