import traceback
import os
import shutil
import uuid
import base64
import json  # <-- ADDED FOR JSON DUMPING
from typing import Dict, Any
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from .models import (
    GenerationRequest, TailorRequest, EvaluateRequest, CoverLetterRequest, InterviewRequest
)
from .generator import ResumeGenerator
from app.services.tailor_service import execute_tailor_chain
from app.services.evaluate_service import execute_evaluate_chain
from app.services.cover_letter_service import execute_cover_letter_chain
from app.services.interview_service import execute_interview_chain

load_dotenv()

app = FastAPI(title="Core AI & Resume Engine")

# CORS middleware for frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

generator = ResumeGenerator()
active_tasks: Dict[str, Dict[str, Any]] = {}

def process_resume_background(task_id: str, template_name: str, resume_data: dict):
    try:
        result = generator.generate(template_name, resume_data)
        active_tasks[task_id].update({
            "status": "completed", 
            "pdf_path": result["pdf_path"], 
            "session_dir": result["session_dir"],
            "raw_json": resume_data  # 🚨 BUG FIX: Holding raw JSON directly in memory
        })
    except Exception as e:
        active_tasks[task_id].update({"status": "failed", "error": str(e)})

def cleanup_session_and_task(task_id: str, session_dir: str):
    """Deletes the files AND removes the task from memory after download."""
    shutil.rmtree(session_dir, ignore_errors=True)
    if task_id in active_tasks: 
        del active_tasks[task_id]

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

# 🚨 UPDATED: Reads TeX and PDF from disk, but grabs JSON directly from memory 🚨
@app.get("/generate/download/{task_id}")
async def download_files(task_id: str, background_tasks: BackgroundTasks):
    task = active_tasks.get(task_id)
    if not task or task["status"] != "completed": 
        raise HTTPException(status_code=400, detail="Not ready")
    
    pdf_path = task["pdf_path"]
    tex_path = pdf_path.replace(".pdf", ".tex") 
    
    try:
        # Read PDF as Base64
        with open(pdf_path, "rb") as f:
            pdf_b64 = base64.b64encode(f.read()).decode('utf-8')
            
        # Read TeX as plain text
        with open(tex_path, "r", encoding="utf-8") as f:
            tex_content = f.read()
            
        # Convert the memory dictionary back into a pretty JSON string
        json_content = json.dumps(task["raw_json"], indent=4)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading generated files: {str(e)}")

    # Schedule the deletion of the temp folder right after sending response
    background_tasks.add_task(cleanup_session_and_task, task_id, task["session_dir"])
    
    return JSONResponse({
        "pdf_base64": pdf_b64,
        "tex_content": tex_content,
        "json_content": json_content
    })

# ==========================================
# AI Routes (Untouched)
# ==========================================
@app.post("/api/ai/tailor")
async def tailor(request: TailorRequest, background_tasks: BackgroundTasks): 
    # AI chain run karo, jisme ab PDF aur LaTeX generate ho raha hai
    result = execute_tailor_chain(request.resume_text, request.job_description)
    
    # Stateless Architecture: Download hone ke turant baad background mein kachra delete karo
    background_tasks.add_task(cleanup_session_and_task, "tailor_task", result.get("session_dir", ""))
    
    # Frontend ko session_dir bhejne ki zaroorat nahi hai, usko hata do
    if "session_dir" in result:
        del result["session_dir"]
        
    # Ab data directly return karo bina kisi extra wrapper ke
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