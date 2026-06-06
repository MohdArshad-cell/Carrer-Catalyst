import zipfile
import io
import traceback
import os
import json
from fastapi import FastAPI, HTTPException, Body
from starlette.responses import StreamingResponse
from dotenv import load_dotenv

# Ensure these models exist in your models.py
from .models import (
    GenerationRequest, 
    TailorRequest, 
    EvaluateRequest, 
    CoverLetterRequest, 
    InterviewRequest
)
from .generator import ResumeGenerator

# Import the modular services we created earlier
from app.services.tailor_service import execute_tailor_chain
from app.services.evaluate_service import execute_evaluate_chain
from app.services.cover_letter_service import execute_cover_letter_chain
from app.services.interview_service import execute_interview_chain

load_dotenv()

# ==========================================
# FASTAPI APP SETUP
# ==========================================
app = FastAPI(title="HireEase Core AI & Resume Engine")
generator = ResumeGenerator()

@app.get("/")
def read_root():
    return {"status": "ok", "message": "HireEase Resume Engine is running!"}

# --- PDF GENERATION ENDPOINT ---
@app.post("/generate")
async def generate_resume(request: GenerationRequest):
    print("--- ✅ GENERATE REQUEST RECEIVED ---")
    try:
        generated_files = generator.generate(
            request.template_name,
            request.resume_data.dict()
        )

        pdf_path = generated_files.get("pdf_path")
        tex_path = generated_files.get("tex_path")
        json_path = generated_files.get("json_path")

        for path in [pdf_path, tex_path, json_path]:
            if not path or not os.path.exists(path):
                raise HTTPException(status_code=500, detail=f"Generated file not found: {path}")

        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED, False) as zip_file:
            zip_file.write(pdf_path, arcname="resume.pdf")
            zip_file.write(tex_path, arcname="resume.tex")
            zip_file.write(json_path, arcname="resume.json")

        zip_buffer.seek(0)
        return StreamingResponse(
            zip_buffer,
            media_type="application/x-zip-compressed",
            headers={"Content-Disposition": "attachment; filename=resume_files.zip"}
        )

    except Exception as e:
        print("--- ❌ CRITICAL ERROR CAUGHT ---")
        traceback.print_exc() 
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

# ==========================================
# MODULAR AI ENDPOINTS
# ==========================================

@app.post("/api/ai/tailor")
def tailor_resume(request: TailorRequest):
    print("--- 🧠 AI TAILOR REQUEST RECEIVED ---")
    try:
        final_latex = execute_tailor_chain(request.resume_text, request.job_description)
        return {"tailored_content": final_latex}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"AI Tailoring failed: {str(e)}")


@app.post("/api/ai/evaluate")
def evaluate_resume(request: EvaluateRequest):
    print("--- 🧠 AI EVALUATE REQUEST RECEIVED ---")
    try:
        result = execute_evaluate_chain(request.resume_text, request.job_description)
        return {"evaluation_result": result}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"AI Evaluation failed: {str(e)}")


@app.post("/api/ai/coverletter")
def generate_cover_letter(request: CoverLetterRequest):
    print("--- 🧠 AI COVER LETTER REQUEST RECEIVED ---")
    try:
        result = execute_cover_letter_chain(request.resume_text, request.job_description)
        return {"cover_letter": result}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Cover Letter generation failed: {str(e)}")


@app.post("/api/ai/interview")
def generate_interview(request: InterviewRequest):
    print("--- 🧠 AI INTERVIEW REQUEST RECEIVED ---")
    try:
        result = execute_interview_chain(request.job_description)
        return {"interview_data": result}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Interview generation failed: {str(e)}")