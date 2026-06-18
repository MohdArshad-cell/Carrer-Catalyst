import os
import json
from pathlib import Path
import google.generativeai as genai
from dotenv import load_dotenv

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
# FIXED: Your actual folder name based on your file structure is interview_prep
INTERVIEW_PROMPTS_DIR = BASE_DIR / "prompts" / "interview_prep"


# ==========================================
# 2. CORE UTILITIES
# ==========================================
def load_file(filename: str) -> str:
    file_path = INTERVIEW_PROMPTS_DIR / filename
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
def execute_interview_chain(job_description: str) -> dict:
    if not job_description or not job_description.strip():
        raise ValueError("Job description is empty.")

    try:
        print("--- 🧠 Interview Prep Step 1: Deep JD Analysis ---")
        prompt1_template = load_file('prompt_step1_analysis.txt')
        
        # Use .replace() instead of .format() to avoid KeyError if the prompt contains JSON schema brackets {}
        prompt1 = prompt1_template.replace('{job_description}', job_description)
        
        raw_analysis_json = call_gemini_api(prompt1, force_json=True)
        analysis_data = extract_and_parse_ai_json(raw_analysis_json)

        print("--- ⚙️ Interview Prep Step 2: Question Generation ---")
        prompt2_template = load_file('prompt_step2_generate.txt')
        
        # Pass the parsed analysis explicitly as a formatted JSON string
        prompt2 = prompt2_template.replace('{analysis_json}', json.dumps(analysis_data, indent=2))
        
        raw_questions_json = call_gemini_api(prompt2, force_json=True)
        final_questions_data = extract_and_parse_ai_json(raw_questions_json)

        print("--- ✅ Interview Prep Generation Successful ---")
        return final_questions_data

    except Exception as e:
        print(f"❌ Interview Prep Chain Error: {e}")
        raise RuntimeError(f"Interview Generation Chain Failed: {str(e)}") from e