import os
import json
import uuid
import base64
import shutil
import tempfile
import subprocess
import traceback
from typing import Dict, Any

# FastAPI & Pydantic
from fastapi import FastAPI, HTTPException, BackgroundTasks, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

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

# CORS Middleware for Frontend Connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Variables
generator = ResumeGenerator()
active_tasks: Dict[str, Dict[str, Any]] = {}


# ==========================================
# 2. PYDANTIC MODELS (FastAPI Validators)
# ==========================================
class CompileRequest(BaseModel):
    latex_code: str

class CheckoutRequest(BaseModel):
    user_id: str
    price_id: str

class DeductTokenRequest(BaseModel):
    user_id: str


# ==========================================
# 3. HELPER FUNCTIONS
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
# 4. CORE RESUME ENGINE ROUTES
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

    # Schedule cleanup
    background_tasks.add_task(cleanup_session_and_task, task_id, task["session_dir"])
    
    return JSONResponse({
        "pdf_base64": pdf_b64,
        "tex_content": tex_content,
        "json_content": json_content
    })


# ==========================================
# 5. AI TOOL ROUTES
# ==========================================
@app.post("/api/ai/compile-only")
async def compile_latex_only(request: CompileRequest):
    """Compiles raw LaTeX to PDF instantly without invoking AI."""
    try:
        print("--- ⚡ Fast Compiling User-Edited LaTeX ---")
        with tempfile.TemporaryDirectory() as temp_dir:
            tex_path = os.path.join(temp_dir, "resume.tex")
            pdf_path = os.path.join(temp_dir, "resume.pdf")

            with open(tex_path, "w", encoding="utf-8") as f:
                f.write(request.latex_code)

            subprocess.run(
                ["tectonic", "resume.tex"],
                cwd=temp_dir,
                capture_output=True,
                text=True,
                check=True
            )

            with open(pdf_path, "rb") as f:
                pdf_b64 = base64.b64encode(f.read()).decode('utf-8')

            print("--- ✅ Fast Compile Successful ---")
            return {"pdf_base64": pdf_b64}

    except subprocess.CalledProcessError as e:
        print(f"❌ LaTeX Syntax Error: {e.stderr or e.stdout}")
        raise HTTPException(status_code=400, detail="LaTeX Compilation Error: Check your syntax. Missing brackets?")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server Error: {str(e)}")

@app.post("/api/ai/tailor")
async def tailor(request: TailorRequest, background_tasks: BackgroundTasks): 
    result = execute_tailor_chain(request.resume_text, request.job_description)
    background_tasks.add_task(cleanup_session_and_task, "tailor_task", result.get("session_dir", ""))
    
    if "session_dir" in result:
        del result["session_dir"]
        
    return result

@app.post("/api/ai/evaluate")
def evaluate(request: EvaluateRequest): 
    return {"evaluation_result": execute_evaluate_chain(request.resume_text, request.job_description)}

@app.post("/api/ai/coverletter")
def coverletter(request: CoverLetterRequest): 
    return {"cover_letter": execute_cover_letter_chain(request.resume_text, request.job_description)}

@app.post("/api/ai/interview")
def interview(request: InterviewRequest): 
    return {"interview_data": execute_interview_chain(request.job_description)}


# ==========================================
# 6. STRIPE PAYMENT & WEBHOOK ROUTES
# ==========================================
@app.post("/api/create-checkout-session")
async def create_checkout_session(request: CheckoutRequest):
    try:
        print(f"--- Creating Stripe Session for {request.user_id} | Price: {request.price_id} ---")
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price': request.price_id, 
                'quantity': 1,
            }],
            mode='payment',
            success_url="http://localhost:3000/ai-tools?success=true", 
            cancel_url="http://localhost:3000/pricing?canceled=true",
            metadata={
                "user_id": request.user_id 
            }
        )
        return {"url": checkout_session.url}
    except Exception as e:
        print("❌ STRIPE ERROR:", str(e))
        raise HTTPException(status_code=400, detail=str(e))
    
@app.post("/api/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")

    # 1. Check if Webhook Secret is loaded
    if not webhook_secret:
        print("❌ ERROR: STRIPE_WEBHOOK_SECRET is missing in .env")
        return JSONResponse(status_code=400, content={"error": "Secret missing"})

    try:
        # Verify Stripe signature
        event = stripe.Webhook.construct_event(
            payload, sig_header, webhook_secret
        )
    except ValueError as e:
        return JSONResponse(status_code=400, content={"error": "Invalid payload"})
    except stripe.error.SignatureVerificationError as e:
        print("❌ STRIPE ERROR: Signature mismatch! Check if you copied the correct whsec_ key.")
        return JSONResponse(status_code=400, content={"error": "Invalid signature"})
    except Exception as e:
        print(f"❌ UNEXPECTED WEBHOOK ERROR: {str(e)}")
        return JSONResponse(status_code=500, content={"error": str(e)})

    # When payment is successfully completed
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        
        # 🚨 THE 100% CRASH-PROOF FIX
        user_id = None
        try:
            # Stripe objects support bracket notation directly
            user_id = session["metadata"]["user_id"]
        except Exception as e:
            print(f"⚠️ WARNING: Could not extract user_id. Error: {str(e)}")

        if user_id:
            try:
                # 1. Fetch current tokens
                res = supabase.table("profiles").select("tokens").eq("id", user_id).execute()
                
                # Check if user actually exists in DB
                if res.data and len(res.data) > 0:
                    current_tokens = res.data[0]["tokens"]
                    
                    # 2. Add 10 premium tokens
                    new_tokens = current_tokens + 10
                    
                    # 3. Update Supabase
                    supabase.table("profiles").update({"tokens": new_tokens}).eq("id", user_id).execute()
                    print(f"💰 SUCCESS: Added 10 tokens to user {user_id}! Total: {new_tokens}")
                else:
                    print(f"❌ ERROR: User ID {user_id} not found in Supabase database!")
                    
            except Exception as e:
                print("❌ SUPABASE UPDATE ERROR:", str(e))
        else:
            print("⚠️ WARNING: Payment successful, but no 'user_id' was found in the session metadata.")

    return {"status": "success"}




@app.post("/api/deduct-token")
def deduct_token(request: DeductTokenRequest):
    try:
        # 1. User ke current tokens fetch karo
        res = supabase.table("profiles").select("tokens").eq("id", request.user_id).execute()
        
        if not res.data or len(res.data) == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        current_tokens = res.data[0]["tokens"]
        
        # 2. Check karo ki token 0 toh nahi hain
        if current_tokens <= 0:
            raise HTTPException(status_code=403, detail="Insufficient tokens! Please upgrade.")
        
        # 3. Agar token hain, toh 1 token minus kar do
        new_tokens = current_tokens - 1
        supabase.table("profiles").update({"tokens": new_tokens}).eq("id", request.user_id).execute()
        
        print(f"📉 TOKEN DEDUCTED: User {request.user_id} used 1 token. Tokens left: {new_tokens}")
        return {"status": "success", "tokens_left": new_tokens}
        
    except HTTPException:
        raise
    except Exception as e:
        print("❌ ERROR DEDUCTING TOKEN:", str(e))
        raise HTTPException(status_code=500, detail=str(e))