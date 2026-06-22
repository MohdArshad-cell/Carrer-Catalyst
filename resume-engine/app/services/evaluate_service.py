import os
import json
import math
from pathlib import Path
from datetime import datetime
from typing import List
import google.generativeai as genai
from pydantic import BaseModel, Field
from dotenv import load_dotenv

try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

load_dotenv()

# ==========================================
# 1. AI DATA EXTRACTION SCHEMA (NO SCORING)
# ==========================================
class RoastDetail(BaseModel):
    weak_bullet: str = Field(..., description="The exact weak, generic bullet point quoted from the resume.")
    critique: str = Field(..., description="Brutally honest reason why a recruiter would reject this.")
    rewrite: str = Field(..., description="A hard-hitting, metric-driven AI rewrite incorporating missing keywords.")

class AIResumeExtractionSchema(BaseModel):
    jd_hard_skills: List[str] = Field(..., description="Every specific technical tool, framework, or hard skill explicitly demanded by the JD.")
    jd_soft_skills: List[str] = Field(..., description="Specific methodologies (Agile) or soft skills requested.")
    resume_hard_skills: List[str] = Field(..., description="The technical tools and hard skills explicitly found in the resume text.")
    resume_soft_skills: List[str] = Field(..., description="The soft skills and methodologies explicitly found in the resume text.")
    red_flags: List[str] = Field(..., description="Critical dealbreakers (e.g., missing mandatory core technologies).")
    constructive_roasts: List[RoastDetail] = Field(..., description="3 specific roasts targeting weak bullet points.")

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

redis_client = None
if REDIS_AVAILABLE and os.getenv("REDIS_URL"):
    try:
        redis_client = redis.Redis.from_url(os.getenv("REDIS_URL"), decode_responses=True)
    except Exception as e:
        print(f"⚠️ Redis connection failed: {e}. Falling back to single-instance memory rotation.")

def get_viable_api_key() -> str:
    if not redis_client:
        if not hasattr(get_viable_api_key, "_idx"):
            get_viable_api_key._idx = 0
        key = API_KEYS[get_viable_api_key._idx]
        get_viable_api_key._idx = (get_viable_api_key._idx + 1) % len(API_KEYS)
        return key

    for idx, key in enumerate(API_KEYS):
        lock_status = redis_client.get(f"rate_limit_lock:gemini_key:{idx}")
        if not lock_status:
            return key
            
    print("🚨 CRITICAL: All global API keys are currently marked as rate-limited in Redis.")
    return API_KEYS[0]

def flag_key_as_rate_limited(exhausted_key: str):
    if exhausted_key in API_KEYS:
        idx = API_KEYS.index(exhausted_key)
        if redis_client:
            redis_client.setex(f"rate_limit_lock:gemini_key:{idx}", 60, "exhausted_429")
            print(f"🔒 Key {idx + 1} locked globally in Redis due to Rate Limiting (429).")

# ==========================================
# 3. INITIAL MODEL CONFIGURATION
# ==========================================
MODEL_NAME = "gemini-2.5-flash"
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
    for attempt in range(max_retries):
        current_key = get_viable_api_key()
        genai.configure(api_key=current_key)
        model = genai.GenerativeModel(model_name=MODEL_NAME)
        
        config = {
            "temperature": 0.0,  # Absolute zero variance for strict data extraction
            "response_mime_type": "application/json",
            "response_schema": AIResumeExtractionSchema,
        }
        
        try:
            response = model.generate_content(prompt, generation_config=config)
            return json.loads(response.text)
            
        except Exception as e:
            error_msg = str(e).lower()
            if "429" in error_msg or "quota" in error_msg:
                print(f"⚠️ Worker caught 429 rate limit exception. Triggering cluster lock...")
                flag_key_as_rate_limited(current_key)
                continue
                
            print(f"❌ Pipeline Execution Error: {str(e)}")
            if attempt == max_retries - 1:
                raise RuntimeError(f"Engine failure: Pipeline permanently broken after {max_retries} attempts.") from e

    raise RuntimeError("Engine failure: Unresponsive API cluster.")

# ==========================================
# 5. DETERMINISTIC MATH ENGINE & EXECUTION
# ==========================================
def normalize_skills(skill_list: List[str]) -> dict:
    """Creates a map of normalized lowercase skills to their original casing."""
    return {s.lower().strip(): s for s in skill_list if s.strip()}

def execute_evaluate_chain(resume_text: str, job_description: str) -> dict:
    try:
        print("--- 🧠 ATS Evaluator: Extracting Raw Data via AI ---")
        prompt_template = load_file('prompt_evaluate.txt')
        today_date = datetime.now().strftime("%B %Y")
        
        prompt = prompt_template.replace('{resume_text}', resume_text) \
                                .replace('{job_description}', job_description) \
                                .replace('{current_date}', today_date)
        
        # 1. Retrieve the extracted arrays from Gemini
        ai_data = call_gemini_structured_api(prompt)
        
        # 2. Normalize data for mathematical comparison (fixes "React" vs "React.js" case issues)
        jd_hard_map = normalize_skills(ai_data.get("jd_hard_skills", []))
        res_hard_map = normalize_skills(ai_data.get("resume_hard_skills", []))
        
        jd_soft_map = normalize_skills(ai_data.get("jd_soft_skills", []))
        res_soft_map = normalize_skills(ai_data.get("resume_soft_skills", []))

        # 3. Calculate strict Set Intersections
        missing_hard_keys = set(jd_hard_map.keys()) - set(res_hard_map.keys())
        missing_soft_keys = set(jd_soft_map.keys()) - set(res_soft_map.keys())

        missing_hard = [jd_hard_map[k] for k in missing_hard_keys]
        missing_soft = [jd_soft_map[k] for k in missing_soft_keys]

        # 4. Calculate Mathematical ATS Score
        hard_total = len(jd_hard_map)
        soft_total = len(jd_soft_map)

        hard_score = ((hard_total - len(missing_hard)) / hard_total * 100) if hard_total > 0 else 100
        soft_score = ((soft_total - len(missing_soft)) / soft_total * 100) if soft_total > 0 else 100

        # Weighted calculation: Hard skills matter much more than soft skills (75/25 split)
        final_score = int(round((hard_score * 0.75) + (soft_score * 0.25)))

        # 5. Build the final payload exactly as the React frontend expects it
        print(f"--- ✅ Evaluation Complete. True ATS Score: {final_score}% ---")
        
        return {
            "score": final_score,
            "red_flags": ai_data.get("red_flags", []),
            "missing_keywords": missing_hard + missing_soft,
            "constructive_roasts": ai_data.get("constructive_roasts", [])
        }
        
    except Exception as e:
        print(f"❌ ATS Evaluation Pipeline Halted: {e}")
        raise RuntimeError(f"Service Execution Failure: {str(e)}") from e