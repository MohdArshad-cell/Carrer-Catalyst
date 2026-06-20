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

    # 2. Check Token Balance directly from the new token_ledger
    ledger_data = supabase.table('token_ledger').select('tokens_balance').eq('user_id', user_id).execute()
    
    if not ledger_data.data or ledger_data.data[0]['tokens_balance'] <= 0:
        # Stop execution immediately, save Gemini quotas
        raise HTTPException(status_code=402, detail="Payment Required: Insufficient token balance")
        
    # 3. Deduct Token AND Update Ledger Audit Trail
    try:
        # Calculate new balance
        new_balance = ledger_data.data[0]['tokens_balance'] - 1
        
        # Update the existing row (DO NOT INSERT, as user_id is UNIQUE)
        supabase.table('token_ledger').update({
            'tokens_balance': new_balance,
            'action': 'AI_GENERATION', # Updates the action column we added
            'amount': -1               # Updates the amount column we added
        }).eq('user_id', user_id).execute()
        
    except Exception as e:
        print(f"Database error: {str(e)}") # Helpful for Render logs
        raise HTTPException(status_code=500, detail="Database transaction failed")

    return user_id # Returns user_id so the route can use it if needed