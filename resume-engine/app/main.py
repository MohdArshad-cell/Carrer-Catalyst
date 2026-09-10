import os
import json
import uuid
import base64
import shutil
import tempfile
import subprocess
import traceback
import time
from typing import Dict, Any

# FastAPI & Security Imports
from fastapi import FastAPI, HTTPException, BackgroundTasks, Request, Depends, Security, UploadFile, File
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
import redis
from supabase import create_client, Client

# Local Imports
from .models import (
    GenerationRequest, TailorRequest, EvaluateRequest, CoverLetterRequest, InterviewRequest, LinkedInRequest, OutreachRequest, RoadmapRequest, BulletRewriteRequest, ResignationRequest
)
from .generator import ResumeGenerator
from app.services.tailor_service import execute_tailor_chain
from app.services.evaluate_service import execute_evaluate_chain
from app.services.cover_letter_service import execute_cover_letter_chain
from app.services.interview_service import execute_interview_chain
from app.services.linkedin_service import execute_linkedin_chain
from app.services.outreach_service import execute_outreach_chain
from app.services.roadmap_service import execute_roadmap_chain
from app.services.pdf_extractor import extract_text_from_pdf
from app.services.llm_client import call_llm, parse_ai_json

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

# Redis Setup (Replaces the broken active_tasks memory dictionary)
redis_client = redis.Redis(
    host=os.getenv("REDIS_HOST", "localhost"), 
    port=int(os.getenv("REDIS_PORT", 6379)), 
    decode_responses=True
)

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

# ==========================================
# 2. FASTAPI GATEKEEPER & LEDGER LOGIC
# ==========================================
security = HTTPBearer()

def verify_user_and_tokens(credentials: HTTPAuthorizationCredentials = Security(security)):
    """Validates the Supabase JWT securely and checks token balance from token_ledger."""
    token = credentials.credentials
    payload = None

    try:
        unverified_header = jwt.get_unverified_header(token)
        token_alg = unverified_header.get("alg", "HS256")
    except Exception:
        raise HTTPException(status_code=401, detail="Malformed authorization token.")

    if jwk_client:
        try:
            signing_key = jwk_client.get_signing_key_from_jwt(token)
            payload = jwt.decode(token, signing_key.key, algorithms=[token_alg], audience="authenticated")
        except Exception as jwks_err:
            print(f"⚠️ [AUTH DEBUG]: JWKS verification failed ({str(jwks_err)}). Trying fallback...")

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

    try:
        res = supabase.table("token_ledger").select("tokens_balance").eq("user_id", user_id).execute()
        
        if not res.data:
            raise HTTPException(status_code=404, detail="User ledger not found in database.")
            
        current_tokens = res.data[0].get("tokens_balance", 0)
        
        if current_tokens <= 0:
            raise HTTPException(status_code=402, detail="Insufficient tokens. Please purchase more.")
            
        return {"user_id": user_id, "current_tokens": current_tokens}
        
    except HTTPException:
        raise
    except Exception as db_err:
        print(f"❌ [DB ERROR]: Failed to fetch tokens for user {user_id}: {str(db_err)}")
        raise HTTPException(status_code=500, detail="Internal server error during token validation.")


def deduct_token_and_log(user_id: str, current_tokens: int, action_name: str):
    """Safely deducts a token via update to prevent duplicate key crashes."""
    try:
        new_tokens = current_tokens - 1
        
        # Update the token_ledger row (DO NOT INSERT)
        supabase.table("token_ledger").update({
            "tokens_balance": new_tokens,
            "transaction_type": "deduction",
            "amount": -1,
            "action": action_name
        }).eq("user_id", user_id).execute()
        
        return new_tokens
        
    except Exception as db_error:
        print(f"🚨 [CRITICAL DB ERROR]: Failed to deduct/log token for {user_id}. Error: {str(db_error)}")
        raise HTTPException(status_code=500, detail="Database ledger error during token deduction.")

def log_generation(user_id: str, action: str, status: str, latency_ms: int, error_message: str = None):
    """Safely log the generation to Supabase generation_logs table."""
    try:
        log_data = {
            "user_id": user_id,
            "action": action,
            "status": status,
            "latency_ms": latency_ms
        }
        if error_message:
            log_data["error_message"] = error_message[:500]  # truncate to avoid huge logs
            
        supabase.table("generation_logs").insert(log_data).execute()
    except Exception as e:
        # We don't want a logging failure to break the user's flow
        print(f"⚠️ [LOGGING ERROR]: Could not insert generation log: {str(e)}")

# ==========================================
# 3. PYDANTIC MODELS (FastAPI Validators)
# ==========================================
class CompileRequest(BaseModel):
    latex_code: str

class CheckoutRequest(BaseModel):
    user_id: str
    price_id: str


# ==========================================
# 4. HELPER FUNCTIONS (REDIS BACKED)
# ==========================================
def process_resume_background(task_id: str, template_name: str, resume_data: dict):
    try:
        # Save processing state to Redis
        redis_client.setex(f"task:{task_id}", 3600, json.dumps({"status": "processing"}))
        
        result = generator.generate(template_name, resume_data)
        
        # Save completed state to Redis (Expires in 1 hour)
        completed_data = {
            "status": "completed", 
            "pdf_path": result["pdf_path"], 
            "session_dir": result["session_dir"],
            "raw_json": resume_data  
        }
        redis_client.setex(f"task:{task_id}", 3600, json.dumps(completed_data))
        
    except Exception as e:
        redis_client.setex(f"task:{task_id}", 3600, json.dumps({"status": "failed", "error": str(e)}))

def cleanup_session_and_task(task_id: str, session_dir: str):
    """Deletes the files AND removes the task from Redis memory after download."""
    if session_dir and os.path.exists(session_dir):
        shutil.rmtree(session_dir, ignore_errors=True)
    redis_client.delete(f"task:{task_id}")


# ==========================================
# 5. UTILITY: PDF UPLOAD & RATE LIMITING
# ==========================================
def check_user_rate_limit(user_id: str, max_requests: int = 5, window_seconds: int = 60):
    """Prevent API abuse: max N requests per window per user."""
    key = f"rate_limit:{user_id}"
    try:
        current = redis_client.get(key)
        if current and int(current) >= max_requests:
            raise HTTPException(status_code=429, detail="Too many requests. Please wait a moment before trying again.")
        pipe = redis_client.pipeline()
        pipe.incr(key)
        pipe.expire(key, window_seconds)
        pipe.execute()
    except HTTPException:
        raise
    except Exception:
        pass  # If Redis is down, don't block the user


@app.post("/api/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):
    """Extract text from an uploaded PDF resume. Free utility — no auth or tokens required."""
    if not file.filename or not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")
    
    # Read file content
    pdf_bytes = await file.read()
    
    if len(pdf_bytes) > 5_000_000:  # 5MB limit
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 5MB.")
    
    if len(pdf_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    
    try:
        text = extract_text_from_pdf(pdf_bytes)
        return {"extracted_text": text, "page_count": len(text.split('\n\n'))}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"❌ PDF Extraction Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to process PDF. Please try pasting your resume text instead.")


# ==========================================
# 6. CORE RESUME ENGINE ROUTES
# ==========================================
@app.api_route("/", methods=["GET", "HEAD"])
def read_root():
    return {"status": "ok", "message": "HireEase Resume Engine is running!"}

@app.post("/generate/start")
async def start_generation(request: GenerationRequest, background_tasks: BackgroundTasks):
    task_id = str(uuid.uuid4())
    
    # Initialize task in Redis
    redis_client.setex(f"task:{task_id}", 3600, json.dumps({"status": "processing"}))
    
    background_tasks.add_task(process_resume_background, task_id, request.template_name, request.resume_data.dict())
    return {"task_id": task_id}

@app.get("/generate/status/{task_id}")
async def check_status(task_id: str):
    task_data = redis_client.get(f"task:{task_id}")
    if not task_data: 
        raise HTTPException(status_code=404, detail="Task not found or expired")
    
    task = json.loads(task_data)
    return {"status": task.get("status"), "error": task.get("error")}

@app.get("/generate/download/{task_id}")
async def download_files(task_id: str, background_tasks: BackgroundTasks):
    task_data = redis_client.get(f"task:{task_id}")
    if not task_data: 
        raise HTTPException(status_code=404, detail="Task not found or expired")
        
    task = json.loads(task_data)
    if task.get("status") != "completed": 
        raise HTTPException(status_code=400, detail="Files not ready for download")
    
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

    # Clean up files and Redis key
    background_tasks.add_task(cleanup_session_and_task, task_id, task.get("session_dir", ""))
    
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
    # 0. Rate Limit Check
    check_user_rate_limit(user_auth["user_id"])
    
    # 1. Execute AI Logic FIRST
    start_time = time.time()
    try:
        result = execute_tailor_chain(request.resume_text, request.job_description, request.template_name)
        latency_ms = int((time.time() - start_time) * 1000)
        log_generation(user_auth["user_id"], "ai_tailor", "success", latency_ms)
    except Exception as ai_error:
        latency_ms = int((time.time() - start_time) * 1000)
        log_generation(user_auth["user_id"], "ai_tailor", "failed", latency_ms, str(ai_error))
        print(f"❌ [AI ERROR]: {str(ai_error)}")
        raise HTTPException(status_code=500, detail="AI processing failed. Your token was not deducted.")

    # Handle ephemeral directory cleanup cleanly
    session_dir = result.pop("session_dir", None)
    if session_dir:
        background_tasks.add_task(cleanup_session_and_task, "ephemeral_tailor_task", session_dir)
        
    # 2. Deduct Token and Log SECOND
    deduct_token_and_log(user_auth["user_id"], user_auth["current_tokens"], "ai_tailor")
    return result

@app.post("/api/ai/evaluate")
async def evaluate(request: EvaluateRequest, user_auth: dict = Depends(verify_user_and_tokens)): 
    # 0. Rate Limit Check
    check_user_rate_limit(user_auth["user_id"])
    
    # 1. Execute AI Logic FIRST
    start_time = time.time()
    try:
        result = execute_evaluate_chain(request.resume_text, request.job_description)
        latency_ms = int((time.time() - start_time) * 1000)
        log_generation(user_auth["user_id"], "ai_evaluate", "success", latency_ms)
    except Exception as ai_error:
        latency_ms = int((time.time() - start_time) * 1000)
        log_generation(user_auth["user_id"], "ai_evaluate", "failed", latency_ms, str(ai_error))
        print(f"❌ [AI ERROR]: {str(ai_error)}")
        raise HTTPException(status_code=500, detail="AI processing failed. Your token was not deducted.")

    # 2. Deduct Token and Log SECOND
    deduct_token_and_log(user_auth["user_id"], user_auth["current_tokens"], "ai_evaluate")
    return {"evaluation_result": result}

@app.post("/api/ai/coverletter")
async def coverletter(request: CoverLetterRequest, background_tasks: BackgroundTasks, user_auth: dict = Depends(verify_user_and_tokens)): 
    # 0. Rate Limit Check
    check_user_rate_limit(user_auth["user_id"])
    
    # 1. Execute AI Logic FIRST
    start_time = time.time()
    try:
        result = execute_cover_letter_chain(request.resume_text, request.job_description)
        latency_ms = int((time.time() - start_time) * 1000)
        log_generation(user_auth["user_id"], "ai_coverletter", "success", latency_ms)
    except Exception as ai_error:
        latency_ms = int((time.time() - start_time) * 1000)
        log_generation(user_auth["user_id"], "ai_coverletter", "failed", latency_ms, str(ai_error))
        print(f"❌ [AI ERROR]: {str(ai_error)}")
        raise HTTPException(status_code=500, detail="AI processing failed. Your token was not deducted.")

    # Handle ephemeral directory cleanup
    session_dir = result.pop("session_dir", None)
    if session_dir:
        background_tasks.add_task(cleanup_session_and_task, "ephemeral_cl_task", session_dir)

    # 2. Deduct Token and Log SECOND
    deduct_token_and_log(user_auth["user_id"], user_auth["current_tokens"], "ai_coverletter")
    return {"cover_letter": result}

@app.post("/api/ai/interview")
async def interview(request: InterviewRequest, user_auth: dict = Depends(verify_user_and_tokens)): 
    # 0. Rate Limit Check
    check_user_rate_limit(user_auth["user_id"])
    
    # 1. Execute AI Logic FIRST
    start_time = time.time()
    try:
        result = execute_interview_chain(request.job_description)
        latency_ms = int((time.time() - start_time) * 1000)
        log_generation(user_auth["user_id"], "ai_interview", "success", latency_ms)
    except Exception as ai_error:
        latency_ms = int((time.time() - start_time) * 1000)
        log_generation(user_auth["user_id"], "ai_interview", "failed", latency_ms, str(ai_error))
        print(f"❌ [AI ERROR]: {str(ai_error)}")
        raise HTTPException(status_code=500, detail="AI processing failed. Your token was not deducted.")

    # 2. Deduct Token and Log SECOND
    deduct_token_and_log(user_auth["user_id"], user_auth["current_tokens"], "ai_interview")
    return {"interview_data": result}

@app.post("/api/ai/linkedin")
async def linkedin_optimize(request: LinkedInRequest, user_auth: dict = Depends(verify_user_and_tokens)):
    # 0. Rate Limit Check
    check_user_rate_limit(user_auth["user_id"])
    
    start_time = time.time()
    try:
        result = execute_linkedin_chain(request.linkedin_content, request.job_description, request.tone)
        latency_ms = int((time.time() - start_time) * 1000)
        log_generation(user_auth["user_id"], "ai_linkedin", "success", latency_ms)
    except Exception as ai_error:
        latency_ms = int((time.time() - start_time) * 1000)
        log_generation(user_auth["user_id"], "ai_linkedin", "failed", latency_ms, str(ai_error))
        print(f"❌ [AI ERROR]: {str(ai_error)}")
        raise HTTPException(status_code=500, detail="AI processing failed. Your token was not deducted.")
    
    deduct_token_and_log(user_auth["user_id"], user_auth["current_tokens"], "ai_linkedin")
    return {"linkedin_data": result}

@app.post("/api/ai/outreach")
async def outreach_generate(request: OutreachRequest, user_auth: dict = Depends(verify_user_and_tokens)):
    # 0. Rate Limit Check
    check_user_rate_limit(user_auth["user_id"])
    
    start_time = time.time()
    try:
        result = execute_outreach_chain(request.resume_text, request.job_description)
        latency_ms = int((time.time() - start_time) * 1000)
        log_generation(user_auth["user_id"], "ai_outreach", "success", latency_ms)
    except Exception as ai_error:
        latency_ms = int((time.time() - start_time) * 1000)
        log_generation(user_auth["user_id"], "ai_outreach", "failed", latency_ms, str(ai_error))
        print(f"❌ [AI ERROR]: {str(ai_error)}")
        raise HTTPException(status_code=500, detail="AI processing failed. Your token was not deducted.")
    
    deduct_token_and_log(user_auth["user_id"], user_auth["current_tokens"], "ai_outreach")
    return {"outreach_data": result}

@app.post("/api/ai/roadmap")
async def roadmap_generate(request: RoadmapRequest, user_auth: dict = Depends(verify_user_and_tokens)):
    # 0. Rate Limit Check
    check_user_rate_limit(user_auth["user_id"])
    
    start_time = time.time()
    try:
        result = execute_roadmap_chain(request.resume_text, request.target_goal)
        latency_ms = int((time.time() - start_time) * 1000)
        log_generation(user_auth["user_id"], "ai_roadmap", "success", latency_ms)
    except Exception as ai_error:
        latency_ms = int((time.time() - start_time) * 1000)
        log_generation(user_auth["user_id"], "ai_roadmap", "failed", latency_ms, str(ai_error))
        print(f"❌ [AI ERROR]: {str(ai_error)}")
        raise HTTPException(status_code=500, detail="AI processing failed. Your token was not deducted.")
    
    deduct_token_and_log(user_auth["user_id"], user_auth["current_tokens"], "ai_roadmap")
    return {"roadmap_data": result}

# ==========================================
# 6.5 FREE TOOLS (No Auth Required)
# ==========================================

@app.post("/api/free/rewrite-bullet")
async def rewrite_bullet(req: BulletRewriteRequest, request: Request):
    """Free tool: Rewrite a single resume bullet using STAR/XYZ formula."""
    ip = request.client.host if request.client else "unknown"
    key = f"rate_limit_free_bullet:{ip}"
    current = redis_client.get(key)
    if current and int(current) >= 10:
        raise HTTPException(429, "Too many free requests. Please try again in an hour.")
    
    pipe = redis_client.pipeline()
    pipe.incr(key)
    pipe.expire(key, 3600)
    pipe.execute()

    prompt = f"""Rewrite this weak resume bullet point into a powerful, metric-driven statement using the XYZ formula (Accomplished [X] as measured by [Y], by doing [Z]).

ORIGINAL BULLET: {req.bullet_text}
TARGET ROLE (optional): {req.target_role or 'General'}

Return JSON: {{ "original": "...", "rewritten": "...", "improvement_notes": "..." }}"""
    
    try:
        raw = call_llm(prompt, force_json=True)
        return parse_ai_json(raw)
    except Exception as e:
        print(f"❌ [AI ERROR] Free rewrite: {e}")
        raise HTTPException(status_code=500, detail="AI processing failed.")

# ==========================================
# 6.6 REFERRAL SYSTEM
# ==========================================
import string
import random

def generate_random_code(length=8):
    chars = string.ascii_uppercase + string.digits
    return ''.join(random.choice(chars) for _ in range(length))

@app.get("/api/referral/stats")
async def get_referral_stats(user_auth: dict = Depends(verify_user_and_tokens)):
    """Get user's referral code and stats."""
    user_id = user_auth["user_id"]
    
    # Check if user has a profile with a referral code
    profile_res = supabase.table("profiles").select("referral_code").eq("id", user_id).execute()
    
    referral_code = None
    if profile_res.data and len(profile_res.data) > 0:
        referral_code = profile_res.data[0].get("referral_code")
        
    if not referral_code:
        # Generate new one
        referral_code = generate_random_code()
        # Upsert profile (assuming user exists in auth.users, they should have a profile, if not create one)
        try:
            supabase.table("profiles").upsert({
                "id": user_id,
                "referral_code": referral_code
            }).execute()
        except Exception as e:
            print(f"Error creating referral code: {e}")
            raise HTTPException(status_code=500, detail="Could not generate referral code")

    # Get referral stats
    referrals_res = supabase.table("referrals").select("*").eq("referrer_id", user_id).execute()
    referrals = referrals_res.data if referrals_res.data else []
    
    completed_count = sum(1 for r in referrals if r.get("status") == "completed" or r.get("status") == "rewarded")
    pending_count = sum(1 for r in referrals if r.get("status") == "pending")
    total_earned = sum(r.get("tokens_awarded", 0) for r in referrals)

    return {
        "referral_code": referral_code,
        "stats": {
            "completed": completed_count,
            "pending": pending_count,
            "tokens_earned": total_earned,
            "history": referrals
        }
    }

@app.post("/api/referral/redeem")
async def redeem_referral(code: str = Body(..., embed=True), user_auth: dict = Depends(verify_user_and_tokens)):
    """When a new user signs up and enters a code."""
    new_user_id = user_auth["user_id"]
    
    # Find referrer
    profile_res = supabase.table("profiles").select("id").eq("referral_code", code).execute()
    if not profile_res.data or len(profile_res.data) == 0:
        raise HTTPException(status_code=400, detail="Invalid referral code.")
        
    referrer_id = profile_res.data[0]["id"]
    if referrer_id == new_user_id:
        raise HTTPException(status_code=400, detail="You cannot refer yourself.")
        
    # Check if already redeemed
    existing = supabase.table("referrals").select("id").eq("referred_user_id", new_user_id).execute()
    if existing.data and len(existing.data) > 0:
        raise HTTPException(status_code=400, detail="You have already redeemed a referral code.")

    # Record referral and award tokens
    try:
        # Record
        supabase.table("referrals").insert({
            "referrer_id": referrer_id,
            "referred_email": "signup",
            "referred_user_id": new_user_id,
            "status": "rewarded",
            "tokens_awarded": 5
        }).execute()
        
        # Award new user
        supabase.rpc('increment_tokens', {'user_id': new_user_id, 'amount': 5}).execute()
        # Award referrer
        supabase.rpc('increment_tokens', {'user_id': referrer_id, 'amount': 5}).execute()
        
        return {"success": True, "message": "Referral applied! Both users received 5 tokens."}
    except Exception as e:
        print(f"Error redeeming referral: {e}")
        raise HTTPException(status_code=500, detail="Could not process referral.")

@app.post("/api/free/resignation-letter")
async def generate_resignation_letter(req: ResignationRequest, request: Request):
    """Free tool: Generate a resignation letter."""
    ip = request.client.host if request.client else "unknown"
    key = f"rate_limit_free_resignation:{ip}"
    current = redis_client.get(key)
    if current and int(current) >= 5:
        raise HTTPException(429, "Too many free requests. Please try again later.")
    
    pipe = redis_client.pipeline()
    pipe.incr(key)
    pipe.expire(key, 3600)
    pipe.execute()

    prompt_template = load_prompt("resignation", "prompt_resignation.txt")
    prompt = prompt_template \
        .replace('{employee_name}', req.employee_name) \
        .replace('{company_name}', req.company_name) \
        .replace('{last_date}', req.last_date) \
        .replace('{tone}', req.tone) \
        .replace('{reason}', req.reason or 'No specific reason provided')

    try:
        raw = call_llm(prompt, force_json=True)
        return parse_ai_json(raw)
    except Exception as e:
        print(f"❌ [AI ERROR] Free resignation letter: {e}")
        raise HTTPException(status_code=500, detail="AI processing failed.")

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
                res = supabase.table("token_ledger").select("tokens_balance").eq("user_id", user_id).execute()
                if res.data and len(res.data) > 0:
                    current_tokens = res.data[0]["tokens_balance"]
                    new_tokens = current_tokens + 10 # Adjust quantity based on your pricing
                    
                    supabase.table("token_ledger").update({
                        "tokens_balance": new_tokens,
                        "transaction_type": "purchase",
                        "amount": 10,
                        "action": "stripe_checkout"
                    }).eq("user_id", user_id).execute()
                    
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
    new_tokens = deduct_token_and_log(user_auth["user_id"], user_auth["current_tokens"], "manual_generation")
    print(f"📉 TOKEN DEDUCTED SECURELY: User {user_auth['user_id']} used 1 token. Tokens left: {new_tokens}")
    return {"status": "success", "tokens_left": new_tokens}