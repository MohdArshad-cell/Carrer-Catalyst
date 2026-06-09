import os
import json
import time
from pathlib import Path
import google.generativeai as genai
from dotenv import load_dotenv
from datetime import datetime

# Re-using your robust JSON parser
from app.services.tailor_service import extract_and_parse_ai_json

load_dotenv()

API_KEY = os.getenv("GOOGLE_API_KEY")
# CRITICAL FIX: Google does not have a 3.5 model. Changed to 1.5-flash to prevent API default fallbacks/errors.
MODEL_NAME = "gemini-3.1-flash-lite" 

if not API_KEY:
    raise ValueError("CRITICAL: GOOGLE_API_KEY environment variable is not set.")

genai.configure(api_key=API_KEY)
model = genai.GenerativeModel(model_name=MODEL_NAME)

BASE_DIR = Path(__file__).resolve().parent.parent
EVAL_PROMPTS_DIR = BASE_DIR / "prompts" / "evaluate"

def load_file(filename: str) -> str:
    file_path = EVAL_PROMPTS_DIR / filename
    if not file_path.exists():
        raise FileNotFoundError(f"Required prompt file not found at {file_path}")
    with open(file_path, 'r', encoding='utf-8') as f:
        return f.read()

def call_gemini_api(prompt: str, force_json: bool = False, retries=3) -> str:
    """
    Upgraded API call with explicitly defined Token Limits and Retry Logic 
    to prevent JSON cutoff errors and handle rate limits.
    """
    config = {
        "max_output_tokens": 8192,
        "temperature": 0.2,
    }
    
    if force_json:
        config["response_mime_type"] = "application/json"
        
    for i in range(retries):
        try:
            return model.generate_content(prompt, generation_config=config).text
        except Exception as e:
            if "429" in str(e) and i < retries - 1:
                print(f"⚠️ Rate limit hit. Retrying in {10 * (i+1)} seconds...")
                time.sleep(10 * (i+1))
                continue
            raise e

def execute_evaluate_chain(resume_text: str, job_description: str) -> dict:
    """
    Executes the AI chain to brutally evaluate a resume against a JD.
    Returns a structured dictionary with score, red flags, missing keywords, and roasts.
    """
    try:
        print("--- 🧠 ATS Evaluator: Analyzing Resume vs JD ---")
        prompt_template = load_file('prompt_evaluate.txt')
        
        # CRITICAL FIX: Injecting the current system date so AI doesn't hallucinate future dates
        today_date = datetime.now().strftime("%B %Y")
        
        # Inject data into prompt
        prompt = prompt_template.replace('{resume_text}', resume_text) \
                                .replace('{job_description}', job_description) \
                                .replace('{current_date}', today_date)
        
        # Force JSON response from Gemini
        raw_json_response = call_gemini_api(prompt, force_json=True)
        
        # Parse cleanly using our robust parser
        evaluation_data = extract_and_parse_ai_json(raw_json_response)
        
        print("--- ✅ ATS Evaluation Successful ---")
        return evaluation_data
        
    except Exception as e:
        print(f"❌ ATS Evaluator Error: {e}")
        raise RuntimeError(f"Failed to evaluate resume: {str(e)}") from e