from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
import os

# Initialize Supabase client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

security = HTTPBearer()

async def verify_and_charge_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    token = credentials.credentials
    
    # 1. Validate JWT and get user
    try:
        user_response = supabase.auth.get_user(token)
        user_id = user_response.user.id
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid or expired authentication token")

    # 2. Check Token Balance
    profile_data = supabase.table('profiles').select('token_balance').eq('id', user_id).execute()
    
    if not profile_data.data or profile_data.data[0]['token_balance'] <= 0:
        # Stop execution immediately, save Gemini quotas
        raise HTTPException(status_code=402, detail="Payment Required: Insufficient token balance")
        
    # 3. Deduct Token AND Update Ledger
    # In a production environment, this should ideally be an RPC (Remote Procedure Call) 
    # to a Postgres function to ensure atomicity, but doing it sequentially works for MVP.
    try:
        # Deduct balance
        new_balance = profile_data.data[0]['token_balance'] - 1
        supabase.table('profiles').update({'token_balance': new_balance}).eq('id', user_id).execute()
        
        # Record in ledger
        ledger_entry = {
            'user_id': user_id,
            'amount': -1,
            'transaction_type': 'AI_GENERATION'
        }
        supabase.table('token_ledger').insert(ledger_entry).execute()
        
    except Exception as e:
        raise HTTPException(status_code=500, detail="Database transaction failed")

    return user_id # Returns user_id so the route can use it if needed