from pydantic import BaseModel, Field
from typing import Optional
from datetime import date


class SymptomIn(BaseModel):
    name: str
    severity: int = Field(ge=1, le=10)


class CheckInCreate(BaseModel):
    date: date
    mood: int = Field(ge=1, le=10)
    sleep_hours: float = Field(ge=0, le=24)
    energy: int = Field(ge=1, le=10)
    notes: Optional[str] = None
    symptoms: list[SymptomIn] = []


class CheckInResponse(BaseModel):
    id: str
    date: date
    mood: int
    sleep_hours: float
    energy: int
    notes: Optional[str]
    symptoms: list[SymptomIn] = []


class TrendPoint(BaseModel):
    date: date
    avg_mood: float
    avg_sleep: float
    avg_energy: float