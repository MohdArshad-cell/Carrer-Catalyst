import os
import json
import re
from pathlib import Path
import google.generativeai as genai

# --- CONFIGURATION ---
API_KEY = os.getenv("GOOGLE_API_KEY")
MODEL_NAME = "gemini-2.5-flash-lite"

BASE_DIR = Path(__file__).resolve().parent.parent
INTERVIEW_PROMPTS_DIR = BASE_DIR / "prompts" / "interview"

# --- HELPER FUNCTIONS ---
def load_file(filename: str) -> str:
    file_path = INTERVIEW_PROMPTS_DIR / filename
    if not file_path.exists():
        raise FileNotFoundError(f"Missing prompt file: {file_path}")
    with open(file_path, 'r', encoding='utf-8') as f:
        return f.read()

def call_gemini(prompt: str) -> str:
    genai.configure(api_key=API_KEY)
    model = genai.GenerativeModel(MODEL_NAME)
    return model.generate_content(prompt).text

def clean_json(text: str) -> str:
    match = re.search(r'\{[\s\S]*\}|\[[\s\S]*\]', text)
    if match:
        return match.group(0)
    raise ValueError("No valid JSON found in AI response.")

# --- MAIN EXECUTION FUNCTION ---
def execute_interview_chain(job_description: str) -> dict:
    if not API_KEY:
        raise RuntimeError("GOOGLE_API_KEY environment variable is missing.")
    
    if not job_description or not job_description.strip():
        raise ValueError("Job description is empty.")

    try:
        # STEP 1: Deep Analysis
        p1 = load_file('prompt_step1_analysis.txt').format(job_description=job_description)
        analysis_json = clean_json(call_gemini(p1))

        # STEP 2: Question Generation
        p2 = load_file('prompt_step2_generate.txt').format(analysis_json=analysis_json)
        questions_json = clean_json(call_gemini(p2))

        # Parse string to actual Python dictionary
        return json.loads(questions_json)

    except Exception as e:
        raise RuntimeError(f"Interview Generation Chain Failed: {str(e)}")