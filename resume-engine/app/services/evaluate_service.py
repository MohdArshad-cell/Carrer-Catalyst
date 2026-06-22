import os
import json
from pathlib import Path
from datetime import datetime
from typing import List, Optional
import google.generativeai as genai
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# Optional: Import redis for distributed multi-worker key management
try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

load_dotenv()

# ==========================================
# 1. ENTERPRISE PYDANTIC RESPONSE SCHEMA
# ==========================================
class ATSEvaluationSchema(BaseModel):
    score: int = Field(
        ..., 
        description="The overall semantic match score from 0 to 100. Evaluated based on strict qualification parity, contextual skill usage, and career progression alignment."
    )
    red_flags: List[str] = Field(
        ..., 
        description="Critical gaps or red flags that would trigger automated machine rejection (e.g., missing mandatory core technologies, severe timeline gaps)."
    )
    missing_keywords: List[str] = Field(
        ..., 
        description="High-priority industry terms and core competencies present in the job description that are contextually missing or weak in the resume."
    )
    constructive_roasts: List[str] = Field(
        ..., 
        description="Brutally honest, clear, and logical feedback calling out layout flaws, weak action verbs, unquantified achievements, or corporate buzzword filler."
    )

# ==========================================
# 2. DISTRIBUTED API KEY COOLDOWN ENGINE
# ==========================================
raw_keys = os.getenv("GOOGLE_API_KEYS", "")
API_KEYS = [k.strip() for k in raw_keys.split(",") if k.strip()]

if not API_KEYS:
    single_key = os.getenv("GOOGLE_API_KEY")
    if not single_key:
        raise ValueError("CRITICAL: Neither GOOGLE_API_KEYS nor GOOGLE_API_KEY environment variables are set.")
    API_KEYS = [single_key]

# Initialize Centralized Redis connection if available for multi-worker safety
redis_client = None
if REDIS_AVAILABLE and os.getenv("REDIS_URL"):
    try:
        redis_client = redis.Redis.from_url(os.getenv("REDIS_URL"), decode_responses=True)
    except Exception as e:
        print(f"⚠️ Redis connection failed: {e}. Falling back to single-instance memory rotation.")

def get_viable_api_key() -> str:
    """
    Retrieves the next viable API key. If running in a multi-worker cluster,
    uses Redis to track and bypass locked/exhausted keys globally.
    """
    if not redis_client:
        # Single instance fallback fallback logic
        if not hasattr(get_viable_api_key, "_idx"):
            get_viable_api_key._idx = 0
        key = API_KEYS[get_viable_api_key._idx]
        get_viable_api_key._idx = (get_viable_api_key._idx + 1) % len(API_KEYS)
        return key

    # Distributed cluster logic: Scan keys for ones not locked by a 429 TTL cooldown
    for idx, key in enumerate(API_KEYS):
        lock_status = redis_client.get(f"rate_limit_lock:gemini_key:{idx}")
        if not lock_status:
            return key
            
    # Exhaustion state: If all keys are locked, force-use the first one and let the exception bubble
    print("🚨 CRITICAL: All global API keys are currently marked as rate-limited in Redis.")
    return API_KEYS[0]

def flag_key_as_rate_limited(exhausted_key: str):
    """Locks a broken key across the entire worker cluster for 60 seconds."""
    if exhausted_key in API_KEYS:
        idx = API_KEYS.index(exhausted_key)
        if redis_client:
            redis_client.setex(f"rate_limit_lock:gemini_key:{idx}", 60, "exhausted_429")
            print(f"🔒 Key {idx + 1} locked globally in Redis due to Rate Limiting (429).")

# ==========================================
# 3. INITIAL MODEL CONFIGURATION
# ==========================================
MODEL_NAME = "gemini-2.5-flash"  # Production optimized architecture baseline
BASE_DIR = Path(__file__).resolve().parent.parent
EVAL_PROMPTS_DIR = BASE_DIR / "prompts" / "evaluate"

def load_file(filename: str) -> str:
    file_path = EVAL_PROMPTS_DIR / filename
    if not file_path.exists():
        raise FileNotFoundError(f"Required evaluation template missing at {file_path}")
    with open(file_path, 'r', encoding='utf-8') as f:
        return f.read()

# ==========================================
# 4. STRUCTURAL CONTENT ENGINE
# ==========================================
def call_gemini_structured_api(prompt: str, max_retries: int = 3) -> dict:
    """Executes call ensuring token-level compliance with the Pydantic schema."""
    
    for attempt in range(max_retries):
        current_key = get_viable_api_key()
        genai.configure(api_key=current_key)
        model = genai.GenerativeModel(model_name=MODEL_NAME)
        
        config = {
            "temperature": 0.1,  # Low variance temperature to ensure factual consistency
            "response_mime_type": "application/json",
            "response_schema": ATSEvaluationSchema,
        }
        
        try:
            response = model.generate_content(prompt, generation_config=config)
            # Response validation guaranteed by Gemini token-level schema adherence
            return json.loads(response.text)
            
        except Exception as e:
            error_msg = str(e).lower()
            if "429" in error_msg or "quota" in error_msg:
                print(f"⚠️ Worker caught 429 rate limit exception. Triggering cluster lock...")
                flag_key_as_rate_limited(current_key)
                continue  # Hot-swap and retry immediately with the next key
                
            print(f"❌ Pipeline Execution Error: {str(e)}")
            if attempt == max_retries - 1:
                raise RuntimeError(f"Engine failure: Pipeline permanently broken after {max_retries} attempts.") from e

    raise RuntimeError("Engine failure: Unresponsive API cluster.")

def execute_evaluate_chain(resume_text: str, job_description: str) -> dict:
    """
    Executes the analytical parsing chain to contextually evaluate a resume against a target JD.
    Bypasses structural parsing fragility by using forced native structured objects.
    """
    try:
        print("--- 🧠 ATS Evaluator: Performing Semantic Parsing Pass ---")
        prompt_template = load_file('prompt_evaluate.txt')
        
        today_date = datetime.now().strftime("%B %Y")
        
        # Weave data context straight into the template strings
        prompt = prompt_template.replace('{resume_text}', resume_text) \
                                .replace('{job_description}', job_description) \
                                .replace('{current_date}', today_date)
        
        # Native structured output allocation
        evaluation_data = call_gemini_structured_api(prompt)
        
        print("--- ✅ ATS Evaluation Chain Finalized Safely ---")
        return evaluation_data
        
    except Exception as e:
        print(f"❌ ATS Evaluation Pipeline Halted: {e}")
        raise RuntimeError(f"Service Execution Failure: {str(e)}") from e