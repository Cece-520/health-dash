from fastapi import HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from app.database import get_supabase

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security),
):
    """
    Validates the Supabase JWT from the Authorization header.
    Returns the user dict, or raises 401 if invalid.
    """
    token = credentials.credentials
    try:
        supabase = get_supabase()
        print(f"TOKEN RECEIVED: {token[:20]}...") 
        response = supabase.auth.get_user(token)
        print(f"USER RESPONSE: {response}")  
        if not response.user:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        return response.user
    except Exception as e:
        print(f"AUTH ERROR: {str(e)}")  
        raise HTTPException(status_code=401, detail="Could not validate credentials")