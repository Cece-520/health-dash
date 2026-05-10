import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()


def get_supabase() -> Client:
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    print(f"SUPABASE_URL found: {bool(url)}")        # debug
    print(f"SERVICE_KEY found: {bool(key)}")          # debug

    if not url or not key:
        raise RuntimeError("Supabase credentials not set in .env")
    
    return create_client(url, key)