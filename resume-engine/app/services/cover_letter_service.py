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
CL_PROMPTS_DIR = BASE_DIR / "prompts" / "cover_letter"


# ==========================================
# 2. CORE UTILITIES
# ==========================================
def load_file(filename: str) -> str:
    file_path = CL_PROMPTS_DIR / filename
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
def execute_cover_letter_chain(resume_text: str, job_description: str) -> str:
    """
    Executes a 2-Step AI chain to generate a high-impact, No-BS cover letter.
    """
    try:
        print("--- 🧠 Cover Letter Step 1: Strategic Planning ---")
        prompt1_template = load_file('prompt_step1_cl_planning.txt')
        prompt1 = prompt1_template.replace('{resume_text}', resume_text).replace('{job_description}', job_description)
        
        # Force JSON response from Gemini for the planning step
        raw_plan_json = call_gemini_api(prompt1, force_json=True)
        strategic_plan = extract_and_parse_ai_json(raw_plan_json)
        
        print("--- ⚙️ Cover Letter Step 2: Generation ---")
        prompt2_template = load_file('prompt_step2_cl_generation.txt')
        today_date = datetime.now().strftime("%B %d, %Y")
        
        prompt2 = prompt2_template.replace('{strategic_plan}', json.dumps(strategic_plan, indent=2)) \
                                  .replace('{resume_text}', resume_text) \
                                  .replace('{job_description}', job_description) \
                                  .replace('{current_date}', today_date)
        
        # We want raw text for the final output, not JSON
        cover_letter_text = call_gemini_api(prompt2, force_json=False).strip()
        
        # --- THE BULLETPROOF FALLBACK ---
        # Using string multiplication so the markdown parser doesn't break
        MARKDOWN_BLOCK = "`" * 3
        
        if cover_letter_text.startswith(MARKDOWN_BLOCK):
            lines = cover_letter_text.split("\n")
            if lines[0].startswith(MARKDOWN_BLOCK): lines = lines[1:]
            if lines[-1].startswith(MARKDOWN_BLOCK): lines = lines[:-1]
            cover_letter_text = "\n".join(lines).strip()
            
        print("--- ✅ Cover Letter Generation Successful ---")    
        return cover_letter_text
        
    except Exception as e:
        print(f"❌ Cover Letter Chain Error: {e}")
        raise RuntimeError(f"Failed to generate cover letter: {str(e)}") from e