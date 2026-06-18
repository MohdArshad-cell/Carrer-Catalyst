import os
import json
import uuid
import base64
import shutil
import tempfile
import subprocess
import traceback
from typing import Dict, Any

# FastAPI & Security Imports
from fastapi import FastAPI, HTTPException, BackgroundTasks, Request, Depends, Security
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel

import jwt
from jwt import PyJWKClient

# Environment Variables
from dotenv import load_dotenv

# Third Party
import stripe
from supabase import create_client, Client

# Local Imports
from .models import (
    GenerationRequest, TailorRequest, EvaluateRequest, CoverLetterRequest, InterviewRequest
)
from .generator import ResumeGenerator
from app.services.tailor_service import execute_tailor_chain
from app.services.evaluate_service import execute_evaluate_chain
from app.services.cover_letter_service import execute_cover_letter_chain
from app.services.interview_service import execute_interview_chain

# ==========================================
# 1. INITIALIZATION & CONFIGURATION
# ==========================================
# 🚨 CRITICAL: Load .env FIRST before fetching any keys
load_dotenv()

# Stripe Setup
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

# Supabase Setup
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

# JWKS Client setup for Asymmetric ES256 Verification
jwk_client = None
if supabase_url:
    clean_url = supabase_url.rstrip("/")
    jwks_url = f"{clean_url}/auth/v1/.well-known/jwks.json"
    jwk_client = PyJWKClient(jwks_url)

# FastAPI App Setup
app = FastAPI(title="HireEase Core AI & Resume Engine")

# CORS Middleware Setup
raw_origins = os.getenv("FRONTEND_URL", "http://localhost:3000")
allowed_origins = [
    url.strip().rstrip("/") 
    for url in raw_origins.split(",") 
    if url.strip()
]
if not allowed_origins:
    allowed_origins = ["http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins, # Explicit list, strictly NO WILDCARDS
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Variables
generator = ResumeGenerator()
active_tasks: Dict[str, Dict[str, Any]] = {}

# ==========================================
# 2. FASTAPI GATEKEEPER (SECURITY & TOKENS)
# ==========================================
security = HTTPBearer()

def verify_user_and_tokens(credentials: HTTPAuthorizationCredentials = Security(security)):
    """Validates the Supabase JWT securely and checks token balance."""
    token = credentials.credentials
    payload = None

    try:
        unverified_header = jwt.get_unverified_header(token)
        token_alg = unverified_header.get("alg", "HS256")
    except Exception:
        raise HTTPException(status_code=401, detail="Malformed authorization token.")

    # Try Asymmetric JWKS Verification
    if jwk_client:
        try:
            signing_key = jwk_client.get_signing_key_from_jwt(token)
            payload = jwt.decode(token, signing_key.key, algorithms=[token_alg], audience="authenticated")
        except Exception as jwks_err:
            print(f"⚠️ [AUTH DEBUG]: JWKS verification failed ({str(jwks_err)}). Trying fallback...")

    # Fallback to Symmetric Verification
    if not payload:
        jwt_secret = os.getenv("SUPABASE_JWT_SECRET")
        if not jwt_secret:
            raise HTTPException(status_code=500, detail="Server Error: Missing JWT Secret configuration.")
        
        try:
            payload = jwt.decode(token, jwt_secret, algorithms=[token_alg], audience="authenticated")
        except Exception:
            raise HTTPException(status_code=401, detail="Invalid authentication token signature or audience.")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload: Missing user subject.")

    # Database Logic: Token Balance Check
    try:
        res = supabase.table("profiles").select("tokens").eq("id", user_id).execute()
        
        if not res.data:
            raise HTTPException(status_code=404, detail="User profile not found in database.")
            
        current_tokens = res.data[0].get("tokens", 0)
        
        if current_tokens <= 0:
            raise HTTPException(status_code=402, detail="Insufficient tokens. Please purchase more.")
            
        return {"user_id": user_id, "current_tokens": current_tokens}
        
    except HTTPException:
        raise
    except Exception as db_err:
        print(f"❌ [DB ERROR]: Failed to fetch tokens for user {user_id}: {str(db_err)}")
        raise HTTPException(status_code=500, detail="Internal server error during token validation.")


# ==========================================
# 3. PYDANTIC MODELS (FastAPI Validators)
# ==========================================
class CompileRequest(BaseModel):
    latex_code: str

class CheckoutRequest(BaseModel):
    user_id: str
    price_id: str

# DeductTokenRequest removed. It is unnecessary since we pull user_id from the JWT.

# ==========================================
# 4. HELPER FUNCTIONS
# ==========================================
def process_resume_background(task_id: str, template_name: str, resume_data: dict):
    try:
        result = generator.generate(template_name, resume_data)
        active_tasks[task_id].update({
            "status": "completed", 
            "pdf_path": result["pdf_path"], 
            "session_dir": result["session_dir"],
            "raw_json": resume_data  
        })
    except Exception as e:
        active_tasks[task_id].update({"status": "failed", "error": str(e)})

def cleanup_session_and_task(task_id: str, session_dir: str):
    """Deletes the files AND removes the task from memory after download."""
    if session_dir and os.path.exists(session_dir):
        shutil.rmtree(session_dir, ignore_errors=True)
    if task_id in active_tasks: 
        del active_tasks[task_id]


# ==========================================
# 5. CORE RESUME ENGINE ROUTES
# ==========================================
@app.api_route("/", methods=["GET", "HEAD"])
def read_root():
    return {"status": "ok", "message": "HireEase Resume Engine is running!"}

@app.post("/generate/start")
async def start_generation(request: GenerationRequest, background_tasks: BackgroundTasks):
    task_id = str(uuid.uuid4())
    active_tasks[task_id] = {"status": "processing"}
    background_tasks.add_task(process_resume_background, task_id, request.template_name, request.resume_data.dict())
    return {"task_id": task_id}

@app.get("/generate/status/{task_id}")
async def check_status(task_id: str):
    if task_id not in active_tasks: 
        raise HTTPException(status_code=404, detail="Task not found")
    return {"status": active_tasks[task_id]["status"], "error": active_tasks[task_id].get("error")}

@app.get("/generate/download/{task_id}")
async def download_files(task_id: str, background_tasks: BackgroundTasks):
    task = active_tasks.get(task_id)
    if not task or task["status"] != "completed": 
        raise HTTPException(status_code=400, detail="Not ready")
    
    pdf_path = task["pdf_path"]
    tex_path = pdf_path.replace(".pdf", ".tex") 
    
    try:
        with open(pdf_path, "rb") as f:
            pdf_b64 = base64.b64encode(f.read()).decode('utf-8')
            
        with open(tex_path, "r", encoding="utf-8") as f:
            tex_content = f.read()
            
        json_content = json.dumps(task["raw_json"], indent=4)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading generated files: {str(e)}")

    background_tasks.add_task(cleanup_session_and_task, task_id, task["session_dir"])
    
    return JSONResponse({
        "pdf_base64": pdf_b64,
        "tex_content": tex_content,
        "json_content": json_content
    })


# ==========================================
# 6. AI TOOL ROUTES (SECURED & TRANSACTIONAL)
# ==========================================
@app.post("/api/ai/compile-only")
async def compile_latex_only(request: CompileRequest):
    """Compiles raw LaTeX to PDF instantly without invoking AI."""
    try:
        with tempfile.TemporaryDirectory() as temp_dir:
            tex_path = os.path.join(temp_dir, "resume.tex")
            pdf_path = os.path.join(temp_dir, "resume.pdf")

            with open(tex_path, "w", encoding="utf-8") as f:
                f.write(request.latex_code)

            subprocess.run(["tectonic", "resume.tex"], cwd=temp_dir, capture_output=True, text=True, check=True)

            with open(pdf_path, "rb") as f:
                pdf_b64 = base64.b64encode(f.read()).decode('utf-8')

            return {"pdf_base64": pdf_b64}

    except subprocess.CalledProcessError:
        raise HTTPException(status_code=400, detail="LaTeX Compilation Error: Check your syntax.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server Error: {str(e)}")

@app.post("/api/ai/tailor")
async def tailor(request: TailorRequest, background_tasks: BackgroundTasks, user_auth: dict = Depends(verify_user_and_tokens)): 
    # 1. Execute AI Logic FIRST
    try:
        result = execute_tailor_chain(request.resume_text, request.job_description)
    except Exception as ai_error:
        print(f"❌ [AI ERROR]: {str(ai_error)}")
        raise HTTPException(status_code=500, detail="AI processing failed. Your token was not deducted.")

    # Handle ephemeral directory cleanup cleanly
    session_dir = result.pop("session_dir", None)
    if session_dir:
        background_tasks.add_task(cleanup_session_and_task, "ephemeral_tailor_task", session_dir)
        
    # 2. Deduct Token SECOND
    try:
        new_tokens = user_auth["current_tokens"] - 1
        supabase.table("profiles").update({"tokens": new_tokens}).eq("id", user_auth["user_id"]).execute()
    except Exception as db_error:
        print(f"🚨 [CRITICAL DB ERROR]: Failed to deduct token for user {user_auth['user_id']}. Error: {str(db_error)}")
        
    return result

@app.post("/api/ai/evaluate")
def evaluate(request: EvaluateRequest, user_auth: dict = Depends(verify_user_and_tokens)): 
    # 1. Execute AI Logic FIRST
    try:
        result = execute_evaluate_chain(request.resume_text, request.job_description)
    except Exception as ai_error:
        print(f"❌ [AI ERROR]: {str(ai_error)}")
        raise HTTPException(status_code=500, detail="AI processing failed. Your token was not deducted.")

    # 2. Deduct Token SECOND
    try:
        new_tokens = user_auth["current_tokens"] - 1
        supabase.table("profiles").update({"tokens": new_tokens}).eq("id", user_auth["user_id"]).execute()
    except Exception as db_error:
        print(f"🚨 [CRITICAL DB ERROR]: Failed to deduct token for user {user_auth['user_id']}. Error: {str(db_error)}")
    
    return {"evaluation_result": result}

@app.post("/api/ai/coverletter")
def coverletter(request: CoverLetterRequest, user_auth: dict = Depends(verify_user_and_tokens)): 
    # 1. Execute AI Logic FIRST
    try:
        result = execute_cover_letter_chain(request.resume_text, request.job_description)
    except Exception as ai_error:
        print(f"❌ [AI ERROR]: {str(ai_error)}")
        raise HTTPException(status_code=500, detail="AI processing failed. Your token was not deducted.")

    # 2. Deduct Token SECOND
    try:
        new_tokens = user_auth["current_tokens"] - 1
        supabase.table("profiles").update({"tokens": new_tokens}).eq("id", user_auth["user_id"]).execute()
    except Exception as db_error:
        print(f"🚨 [CRITICAL DB ERROR]: Failed to deduct token for user {user_auth['user_id']}. Error: {str(db_error)}")
    
    return {"cover_letter": result}

@app.post("/api/ai/interview")
def interview(request: InterviewRequest, user_auth: dict = Depends(verify_user_and_tokens)): 
    # 1. Execute AI Logic FIRST
    try:
        result = execute_interview_chain(request.job_description)
    except Exception as ai_error:
        print(f"❌ [AI ERROR]: {str(ai_error)}")
        raise HTTPException(status_code=500, detail="AI processing failed. Your token was not deducted.")

    # 2. Deduct Token SECOND
    try:
        new_tokens = user_auth["current_tokens"] - 1
        supabase.table("profiles").update({"tokens": new_tokens}).eq("id", user_auth["user_id"]).execute()
    except Exception as db_error:
        print(f"🚨 [CRITICAL DB ERROR]: Failed to deduct token for user {user_auth['user_id']}. Error: {str(db_error)}")
    
    return {"interview_data": result}


# ==========================================
# 7. STRIPE PAYMENT & WEBHOOK ROUTES
# ==========================================
@app.post("/api/create-checkout-session")
async def create_checkout_session(request: CheckoutRequest):
    try:
        # Fallback to the first allowed origin if FRONTEND_URL is explicitly missing
        frontend_url = allowed_origins[0] 
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{'price': request.price_id, 'quantity': 1}],
            mode='payment',
            success_url=f"{frontend_url}/ai-tools?success=true", 
            cancel_url=f"{frontend_url}/pricing?canceled=true",
            metadata={"user_id": request.user_id}
        )
        return {"url": checkout_session.url}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
@app.post("/api/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")

    if not webhook_secret:
        return JSONResponse(status_code=400, content={"error": "Secret missing"})

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
    except ValueError:
        return JSONResponse(status_code=400, content={"error": "Invalid payload"})
    except stripe.error.SignatureVerificationError:
        return JSONResponse(status_code=400, content={"error": "Invalid signature"})
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        
        user_id = session.get("metadata", {}).get("user_id")

        if user_id:
            try:
                res = supabase.table("profiles").select("tokens").eq("id", user_id).execute()
                if res.data and len(res.data) > 0:
                    current_tokens = res.data[0]["tokens"]
                    new_tokens = current_tokens + 10
                    supabase.table("profiles").update({"tokens": new_tokens}).eq("id", user_id).execute()
            except Exception as e:
                print("❌ SUPABASE UPDATE ERROR:", str(e))
                # FORCE STRIPE TO RETRY LATER
                return JSONResponse(status_code=500, content={"error": "Database update failed, retry later"})

    return {"status": "success"}

# ==========================================
# 8. TOKEN MANAGEMENT ROUTE (FOR NON-AI GENERATION)
# ==========================================
@app.post("/api/deduct-token")
def deduct_token(user_auth: dict = Depends(verify_user_and_tokens)):
    # Note: No JSON body required. The JWT proves who they are.
    try:
        user_id = user_auth["user_id"]
        current_tokens = user_auth["current_tokens"]
        
        new_tokens = current_tokens - 1
        supabase.table("profiles").update({"tokens": new_tokens}).eq("id", user_id).execute()
        
        print(f"📉 TOKEN DEDUCTED SECURELY: User {user_id} used 1 token. Tokens left: {new_tokens}")
        return {"status": "success", "tokens_left": new_tokens}
        
    except Exception as e:
        print("❌ ERROR DEDUCTING TOKEN:", str(e))
        raise HTTPException(status_code=500, detail=str(e))