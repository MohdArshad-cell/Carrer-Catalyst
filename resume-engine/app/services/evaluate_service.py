import os
import json
import re
from pathlib import Path
import google.generativeai as genai
from dotenv import load_dotenv
from datetime import datetime

# Re-using the robust JSON parser from tailor_service
from app.services.tailor_service import extract_and_parse_ai_json

# ==========================================
# 1. INITIALIZATION & API KEY ROTATION
# ==========================================
load_dotenv()

# Load multiple keys for hot-swapping
raw_keys = os.getenv("GOOGLE_API_KEYS", "")
API_KEYS = [k.strip() for k in raw_keys.split(",") if k.strip()]

if not API_KEYS:
    # Fallback if the user is still using the old single-key variable
    single_key = os.getenv("GOOGLE_API_KEY")
    if not single_key:
        raise ValueError("CRITICAL: GOOGLE_API_KEYS or GOOGLE_API_KEY environment variable is not set.")
    API_KEYS = [single_key]

current_key_idx = 0
genai.configure(api_key=API_KEYS[current_key_idx])

# Using a valid, production-ready model
MODEL_NAME = "gemini-3.1-flash-lite" 
model = genai.GenerativeModel(model_name=MODEL_NAME)

BASE_DIR = Path(__file__).resolve().parent.parent
EVAL_PROMPTS_DIR = BASE_DIR / "prompts" / "evaluate"


# ==========================================
# 2. CORE UTILITIES
# ==========================================
def load_file(filename: str) -> str:
    file_path = EVAL_PROMPTS_DIR / filename
    if not file_path.exists():
        raise FileNotFoundError(f"Required prompt file not found at {file_path}")
    with open(file_path, 'r', encoding='utf-8') as f:
        return f.read()

def call_gemini_api(prompt: str, force_json: bool = True, max_retries: int = 3) -> str:
    """Calls Gemini and hot-swaps API keys instantly if rate limited."""
    global current_key_idx, model
    
    config = {
        "max_output_tokens": 8192,
        "temperature": 0.2, 
    }
    if force_json:
        config["response_mime_type"] = "application/json"
        
    for attempt in range(max_retries):
        try:
            return model.generate_content(prompt, generation_config=config).text
        except Exception as e:
            error_msg = str(e).lower()
            
            # Catch Rate Limits (429) or Quota Exhaustion
            if "429" in error_msg or "quota" in error_msg:
                print(f"⚠️ Key {current_key_idx + 1} exhausted/limited. Hot-swapping to next key...")
                current_key_idx = (current_key_idx + 1) % len(API_KEYS)
                genai.configure(api_key=API_KEYS[current_key_idx])
                model = genai.GenerativeModel(model_name=MODEL_NAME)
                continue # Retry immediately with the new key
            
            print(f"❌ Gemini API Error: {str(e)}")
            if attempt == max_retries - 1:
                raise RuntimeError(f"Gemini API failed permanently after {max_retries} attempts.") from e
                
    raise RuntimeError("Gemini API call failed.")


# ==========================================
# 3. CORE EXECUTION CHAIN
# ==========================================
def execute_evaluate_chain(resume_text: str, job_description: str) -> dict:
    """
    Executes the AI chain to brutally evaluate a resume against a JD.
    Returns a structured dictionary with score, red flags, missing keywords, and roasts.
    """
    try:
        print("--- 🧠 ATS Evaluator: Analyzing Resume vs JD ---")
        prompt_template = load_file('prompt_evaluate.txt')
        
        # Injecting the current system date so AI doesn't hallucinate future dates
        today_date = datetime.now().strftime("%B %Y")
        
        # Inject data into prompt
        prompt = prompt_template.replace('{resume_text}', resume_text) \
                                .replace('{job_description}', job_description) \
                                .replace('{current_date}', today_date)
        
        # Force JSON response from Gemini
        raw_json_response = call_gemini_api(prompt, force_json=True)
        
        # Parse cleanly using the robust parser imported from tailor_service
        evaluation_data = extract_and_parse_ai_json(raw_json_response)
        
        print("--- ✅ ATS Evaluation Successful ---")
        return evaluation_data
        
    except Exception as e:
        print(f"❌ ATS Evaluator Error: {e}")
        raise RuntimeError(f"Failed to evaluate resume: {str(e)}") from e