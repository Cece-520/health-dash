from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from app.routers import checkins, analytics, symptoms

load_dotenv()

app = FastAPI(title="Wellness Tracker API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(checkins.router, prefix="/checkins", tags=["checkins"])
app.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
app.include_router(symptoms.router, prefix="/symptoms", tags=["symptoms"])


@app.get("/ping")
def ping():
    return {"status": "ok"}