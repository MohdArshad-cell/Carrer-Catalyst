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

import jwt  # Needs: pip install PyJWT

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

# Supabase Setup (Service Role Key for Admin Access)
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

# FastAPI App Setup
app = FastAPI(title="Core AI & Resume Engine")

# CORS Middleware - Dynamically uses frontend URL
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*", frontend_url], # Allows local and deployed frontend
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
    """Validates the Supabase JWT and checks if the user has enough tokens."""
    token = credentials.credentials
    try:
        # Decode the JWT sent from the React frontend
        jwt_secret = os.getenv("SUPABASE_JWT_SECRET")
        if not jwt_secret:
            raise HTTPException(status_code=500, detail="Server Error: Missing SUPABASE_JWT_SECRET in .env")
            
        payload = jwt.decode(token, jwt_secret, algorithms=["HS256"], audience="authenticated")
        user_id = payload.get("sub")
        
        # Fetch current tokens from DB
        res = supabase.table("profiles").select("tokens").eq("id", user_id).execute()
        if not res.data or len(res.data) == 0:
            raise HTTPException(status_code=404, detail="User not found in database.")
            
        current_tokens = res.data[0]["tokens"]
        if current_tokens <= 0:
            raise HTTPException(status_code=402, detail="Insufficient tokens. Please upgrade your plan.")
            
        return {"user_id": user_id, "current_tokens": current_tokens}
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expired. Please log in again.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid authentication token.")

# ==========================================
# 3. PYDANTIC MODELS (FastAPI Validators)
# ==========================================
class CompileRequest(BaseModel):
    latex_code: str

class CheckoutRequest(BaseModel):
    user_id: str
    price_id: str

class DeductTokenRequest(BaseModel):
    user_id: str


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
    shutil.rmtree(session_dir, ignore_errors=True)
    if task_id in active_tasks: 
        del active_tasks[task_id]


# ==========================================
# 5. CORE RESUME ENGINE ROUTES
# ==========================================
@app.get("/")
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
# 6. AI TOOL ROUTES (NOW SECURED!)
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

    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=400, detail="LaTeX Compilation Error: Check your syntax.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server Error: {str(e)}")

# NOTE: user_auth = Depends(verify_user_and_tokens) ensures the AI only runs if they have tokens
@app.post("/api/ai/tailor")
async def tailor(request: TailorRequest, background_tasks: BackgroundTasks, user_auth: dict = Depends(verify_user_and_tokens)): 
    result = execute_tailor_chain(request.resume_text, request.job_description)
    background_tasks.add_task(cleanup_session_and_task, "tailor_task", result.get("session_dir", ""))
    
    if "session_dir" in result:
        del result["session_dir"]
        
    # Auto-deduct 1 token safely on the backend after successful generation
    new_tokens = user_auth["current_tokens"] - 1
    supabase.table("profiles").update({"tokens": new_tokens}).eq("id", user_auth["user_id"]).execute()
        
    return result

@app.post("/api/ai/evaluate")
def evaluate(request: EvaluateRequest, user_auth: dict = Depends(verify_user_and_tokens)): 
    # Auto-deduct token
    new_tokens = user_auth["current_tokens"] - 1
    supabase.table("profiles").update({"tokens": new_tokens}).eq("id", user_auth["user_id"]).execute()
    
    return {"evaluation_result": execute_evaluate_chain(request.resume_text, request.job_description)}

@app.post("/api/ai/coverletter")
def coverletter(request: CoverLetterRequest, user_auth: dict = Depends(verify_user_and_tokens)): 
    # Auto-deduct token
    new_tokens = user_auth["current_tokens"] - 1
    supabase.table("profiles").update({"tokens": new_tokens}).eq("id", user_auth["user_id"]).execute()
    
    return {"cover_letter": execute_cover_letter_chain(request.resume_text, request.job_description)}

@app.post("/api/ai/interview")
def interview(request: InterviewRequest, user_auth: dict = Depends(verify_user_and_tokens)): 
    # Auto-deduct token
    new_tokens = user_auth["current_tokens"] - 1
    supabase.table("profiles").update({"tokens": new_tokens}).eq("id", user_auth["user_id"]).execute()
    
    return {"interview_data": execute_interview_chain(request.job_description)}


# ==========================================
# 7. STRIPE PAYMENT & WEBHOOK ROUTES
# ==========================================
@app.post("/api/create-checkout-session")
async def create_checkout_session(request: CheckoutRequest):
    try:
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
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
    except ValueError as e:
        return JSONResponse(status_code=400, content={"error": "Invalid payload"})
    except stripe.error.SignatureVerificationError as e:
        return JSONResponse(status_code=400, content={"error": "Invalid signature"})
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        
        user_id = None
        try:
            user_id = session["metadata"]["user_id"]
        except Exception as e:
            print(f"⚠️ WARNING: Could not extract user_id.")

        if user_id:
            try:
                res = supabase.table("profiles").select("tokens").eq("id", user_id).execute()
                if res.data and len(res.data) > 0:
                    current_tokens = res.data[0]["tokens"]
                    new_tokens = current_tokens + 10
                    supabase.table("profiles").update({"tokens": new_tokens}).eq("id", user_id).execute()
            except Exception as e:
                print("❌ SUPABASE UPDATE ERROR:", str(e))

    return {"status": "success"}

# Kept this route active to prevent old frontend code from crashing if it calls it, 
# but it now enforces security.
@app.post("/api/deduct-token")
def deduct_token(request: DeductTokenRequest, user_auth: dict = Depends(verify_user_and_tokens)):
    # Tokens are now deducted automatically by the AI endpoints above. 
    # This route is kept for backward compatibility with your frontend.
    return {"status": "success", "message": "Tokens are now handled by AI routes directly."}