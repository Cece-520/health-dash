from fastapi import APIRouter, Depends
from app.auth import get_current_user
from app.database import get_supabase
from app.models.schemas import TrendPoint
from datetime import date, timedelta

router = APIRouter()


@router.get("/trends", response_model=list[TrendPoint])
async def get_trends(days: int = 30, user=Depends(get_current_user)):
    supabase = get_supabase()
    since = str(date.today() - timedelta(days=days))

    result = (
        supabase.table("check_ins")
        .select("date, mood, sleep_hours, energy")
        .eq("user_id", user.id)
        .gte("date", since)
        .order("date")
        .execute()
    )

    # Group by date and average (multiple entries per day edge case)
    grouped: dict[str, list] = {}
    for row in result.data:
        grouped.setdefault(row["date"], []).append(row)

    trends = []
    for day, rows in sorted(grouped.items()):
        trends.append(
            TrendPoint(
                date=day,
                avg_mood=round(sum(r["mood"] for r in rows) / len(rows), 1),
                avg_sleep=round(sum(r["sleep_hours"] for r in rows) / len(rows), 1),
                avg_energy=round(sum(r["energy"] for r in rows) / len(rows), 1),
            )
        )
    return trends