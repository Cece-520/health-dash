from fastapi import APIRouter, Depends, HTTPException
from app.auth import get_current_user
from app.database import get_supabase
from app.models.schemas import CheckInCreate, CheckInResponse

router = APIRouter()


@router.post("/", response_model=CheckInResponse)
async def create_checkin(body: CheckInCreate, user=Depends(get_current_user)):
    supabase = get_supabase()

    # Insert the check-in row
    checkin_data = {
        "user_id": user.id,
        "date": str(body.date),
        "mood": body.mood,
        "sleep_hours": body.sleep_hours,
        "energy": body.energy,
        "notes": body.notes,
    }
    result = supabase.table("check_ins").insert(checkin_data).execute()
    checkin = result.data[0]

    # Insert symptoms linked to this check-in
    if body.symptoms:
        symptoms_data = [
            {"check_in_id": checkin["id"], "name": s.name, "severity": s.severity}
            for s in body.symptoms
        ]
        supabase.table("symptoms").insert(symptoms_data).execute()

    checkin["symptoms"] = [s.model_dump() for s in body.symptoms]
    return checkin


@router.get("/", response_model=list[CheckInResponse])
async def list_checkins(days: int = 30, user=Depends(get_current_user)):
    supabase = get_supabase()

    result = (
        supabase.table("check_ins")
        .select("*, symptoms(*)")
        .eq("user_id", user.id)
        .order("date", desc=True)
        .limit(days)
        .execute()
    )
    return result.data


@router.get("/{checkin_id}", response_model=CheckInResponse)
async def get_checkin(checkin_id: str, user=Depends(get_current_user)):
    supabase = get_supabase()

    result = (
        supabase.table("check_ins")
        .select("*, symptoms(*)")
        .eq("id", checkin_id)
        .eq("user_id", user.id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Check-in not found")
    return result.data