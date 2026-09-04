import os
import json
import re
import time
from pathlib import Path
import base64
from datetime import datetime
from rapidfuzz import fuzz

# --- API & DISTRIBUTED DEPENDENCIES ---
import redis
from groq import Groq
import google.generativeai as genai
from dotenv import load_dotenv

from app.generator import ResumeGenerator
from app.models import ResumeData, JobDescriptionAnalysis

# ==========================================
# 1. INITIALIZATION & DISTRIBUTED INFRASTRUCTURE
# ==========================================
load_dotenv()

redis_client = redis.Redis(
    host=os.getenv("REDIS_HOST", "localhost"), 
    port=int(os.getenv("REDIS_PORT", 6379)), 
    decode_responses=True
)

MODEL_NAME = "gemini-2.5-flash-lite" 
BASE_DIR = Path(__file__).resolve().parent.parent.parent
TAILOR_PROMPTS_DIR = BASE_DIR / "app" / "prompts" / "tailor"


class DistributedTokenBucket:
    def __init__(self, raw_keys: str, prefix: str):
        self.prefix = prefix
        self.keys = [k.strip() for k in raw_keys.split(",") if k.strip()]
        if not self.keys:
            raise ValueError(f"CRITICAL: API keys for {self.prefix} are not set.")

    def get_key(self) -> str:
        for key in self.keys:
            if not redis_client.exists(f"{self.prefix}{key}"):
                return key
        print(f"⚠️ All keys for {self.prefix} are temporarily rate-limited. Forcing fallback with backoff.")
        time.sleep(2) 
        return self.keys[0]

    def lock_key(self, key: str, ttl_seconds: int = 60):
        redis_client.setex(f"{self.prefix}{key}", ttl_seconds, "locked")

key_manager = DistributedTokenBucket(
    os.getenv("GOOGLE_API_KEYS", os.getenv("GOOGLE_API_KEY", "")), 
    prefix="gemini_lock:"
)

groq_key_manager = DistributedTokenBucket(
    os.getenv("GROQ_API_KEYS", os.getenv("GROQ_API_KEY", "")), 
    prefix="groq_lock:"
)


# ==========================================
# 2. HYBRID LLM ROUTING & UTILITIES
# ==========================================
def load_file(filename: str) -> str:
    file_path = TAILOR_PROMPTS_DIR / filename
    if not file_path.exists():
        raise FileNotFoundError(f"Missing prompt file at: {file_path}")
    with open(file_path, 'r', encoding='utf-8') as f:
        return f.read()


def call_gemini_api(prompt: str, schema=None, force_json: bool = False, max_retries: int = 10) -> str:
    config_kwargs = {
        "max_output_tokens": 8192,
        "temperature": 0.2,
        "response_mime_type": "application/json" 
    }
    
    if schema:
        schema_json = json.dumps(schema.model_json_schema(), indent=2)
        prompt = prompt + f"\n\nCRITICAL INSTRUCTION: You MUST return a raw, highly structured JSON object that exactly matches this OpenAPI schema. Do NOT wrap it in markdown backticks:\n{schema_json}"
        
    strict_config = genai.types.GenerationConfig(**config_kwargs)

    for attempt in range(max_retries):
        api_key = key_manager.get_key()
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(model_name=MODEL_NAME)
        
        try:
            response = model.generate_content(prompt, generation_config=strict_config)
            return response.text
        except Exception as e:
            error_msg = str(e).lower()
            if "429" in error_msg or "quota" in error_msg:
                print(f"⚠️ Worker caught 429 Rate Limit. Locking Key in Redis...")
                key_manager.lock_key(api_key)
                continue
            
            print(f"❌ Gemini API Error: {str(e)}")
            if attempt == max_retries - 1:
                raise RuntimeError(f"Gemini failed permanently after {max_retries} attempts.") from e
                
    # THE FIX: If the loop finishes entirely because of 429s, raise an error instead of returning None.
    raise RuntimeError(f"API Rate Limit Reached: Gemini failed permanently after {max_retries} retries.")


def extract_and_parse_ai_json(raw_text: str) -> dict:
    try:
        return json.loads(raw_text)
    except json.JSONDecodeError:
        tick = chr(96)
        pattern = r'' + tick*3 + r'(?:json)?\n?'
        clean_text = re.sub(pattern, '', raw_text).replace(tick*3, '').strip()
        try:
            return json.loads(clean_text)
        except json.JSONDecodeError as e:
            print(f"❌ FATAL JSON ERROR. Raw Output:\n{raw_text[:300]}")
            raise RuntimeError("CRITICAL: AI returned malformed JSON.") from e


# ==========================================
# 3. REGEX BULLETPROOFING & VALIDATION 
# ==========================================
def normalize_and_extract_metrics(text: str) -> set:
    return set(re.findall(r'\b\d+(?:\.\d+)?\b', text)) 

def verify_metrics(baseline_text: str, tailored_data: dict) -> dict:
    baseline_numbers = normalize_and_extract_metrics(baseline_text)
    exp_list = tailored_data.get('experience', [])
    
    for exp in exp_list:
        valid_bullets = []
        for bullet in exp.get('descriptionPoints', []):
            bullet_nums = normalize_and_extract_metrics(str(bullet))
            suspicious_nums = {n for n in bullet_nums if len(n) > 1 and n not in baseline_numbers}
            
            if suspicious_nums:
                print(f"⚠️ Shield Dropped Hallucinated Metric {suspicious_nums}: {bullet[:50]}...")
            else:
                valid_bullets.append(bullet)
        exp['descriptionPoints'] = valid_bullets
    return tailored_data

def verify_bullet_count(original_json_str: str, tailored_data: dict) -> dict:
    """THE FIX: This stops the AI from shrinking a 2-page resume into a 1-page resume."""
    original_data = json.loads(original_json_str)
    
    orig_exp = original_data.get('experience', [])
    tail_exp = tailored_data.get('experience', [])
    
    for i, orig_job in enumerate(orig_exp):
        if i < len(tail_exp):
            orig_bullets = orig_job.get('descriptionPoints', [])
            tail_bullets = tail_exp[i].get('descriptionPoints', [])
            
            # If the AI deleted bullets, put them back
            if len(tail_bullets) < len(orig_bullets):
                print(f"⚠️ AI tried to shrink resume! Restoring {len(orig_bullets) - len(tail_bullets)} bullets to {orig_job.get('company')}.")
                lost_bullets = orig_bullets[len(tail_bullets):]
                tail_exp[i]['descriptionPoints'] = tail_bullets + lost_bullets
                
    return tailored_data

def calculate_yoe(experience_list: list) -> str:
    total_months = 0
    now = datetime.now()
    
    for exp in experience_list:
        start = str(exp.get('startDate', ''))
        end = str(exp.get('endDate', ''))
        
        if not start:
            continue
            
        try:
            # Try to parse Year or Month Year (e.g. "2020", "Jan 2020", "01/2020")
            # For simplicity, we just look for 4-digit years in the string
            start_year_match = re.search(r'\d{4}', start)
            if not start_year_match:
                continue
            start_year = int(start_year_match.group())
            
            end_year = now.year
            if end and str(end).lower() not in ["present", "current"]:
                end_year_match = re.search(r'\d{4}', end)
                if end_year_match:
                    end_year = int(end_year_match.group())
            
            years = max(0, end_year - start_year)
            # If they provide exact months we could be more precise, but years is usually enough
            # We'll assume full years for this simple local calculation
            total_months += years * 12
        except Exception:
            continue
            
    total_years = total_months / 12
    
    if total_years <= 2:
        return "Ambitious, growth-oriented, and highly adaptable."
    elif total_years <= 7:
        return "Results-driven professional with proven technical execution."
    else:
        return "Strategic, high-level leader focused on architecture and business impact."

def find_missing_keywords(resume_string: str, skills_list: list) -> list:
    missing = []
    resume_lower = resume_string.lower()
    
    # Simple tokenization for rapidfuzz matching against resume words
    resume_words = set(re.findall(r'\b\w+\b', resume_lower))
    
    for skill in skills_list:
        skill_str = str(skill).lower().strip()
        if not skill_str: continue
        
        # Exact substring match first (fastest)
        if skill_str in resume_lower:
            continue
            
        # Fuzzy match using partial ratio
        # For multi-word skills (e.g., "Amazon Web Services"), partial_ratio against the whole resume works well
        # For single words (e.g., "React.js"), check against token set
        score = fuzz.partial_ratio(skill_str, resume_lower)
        
        # 85 is a safe threshold for technical synonym matching without false positives
        if score < 85:
            missing.append(str(skill))
            
    return missing[:6] 

def coerce_ints_to_strings(data):
    if isinstance(data, dict):
        return {k: coerce_ints_to_strings(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [coerce_ints_to_strings(v) for v in data]
    elif isinstance(data, int) and not isinstance(data, bool):
        return str(data)
    return data

def sanitize_for_latex(data):
    if data is None:
        return ""
    elif isinstance(data, dict): 
        cleaned_dict = {k: sanitize_for_latex(v) for k, v in data.items()}
        if all(v == "" for v in cleaned_dict.values()):
            return ""
        return cleaned_dict
    elif isinstance(data, list): 
        cleaned_list = [sanitize_for_latex(v) for v in data]
        return [item for item in cleaned_list if item != ""]
    elif isinstance(data, str):
        if data.strip().lower() in ["none", "n/a", "null", ""]:
            return ""
            
        def escape_text(text):
            mapping = {
                '\\': '\\textbackslash{}',
                '{': '\\{',
                '}': '\\}',
                '~': '\\textasciitilde{}',
                '^': '\\textasciicircum{}',
                '&': '\\&',
                '%': '\\%',
                '$': '\\$',
                '#': '\\#',
                '_': '\\_'
            }
            res = []
            for char in text:
                res.append(mapping.get(char, char))
            text = "".join(res)
            
            text = text.replace('”', '"').replace('“', '"')
            text = text.replace('’', "'").replace('‘', "'")
            text = text.replace('—', '---').replace('–', '--')
            text = text.replace('\u2022', '-')
            return text

        parts = re.split(r'\*\*(.*?)\*\*', data)
        escaped_parts = []
        for i, part in enumerate(parts):
            escaped_part = escape_text(part)
            if i % 2 == 1:
                escaped_parts.append(f'\\textbf{{{escaped_part}}}')
            else:
                escaped_parts.append(escaped_part)
                
        return "".join(escaped_parts)
    return data


# ==========================================
# 4. CORE EXECUTION CHAINS
# ==========================================
def parse_raw_text_to_json(raw_text: str, max_retries: int = 10) -> str:
    print("--- ⚡ Step 0: Groq LPU Smart Parsing ---")
    prompt0 = load_file('prompt_step0_parser.txt').replace('{raw_resume}', raw_text)
    
    for attempt in range(max_retries):
        api_key = groq_key_manager.get_key()
        client = Groq(api_key=api_key)
        
        try:
            response = client.chat.completions.create(
                model="llama3-70b-8192",
                messages=[{"role": "user", "content": prompt0}],
                temperature=0.0,
                response_format={"type": "json_object"}
            )
            return response.choices[0].message.content
        except Exception as e:
            error_msg = str(e).lower()
            if "429" in error_msg or "rate limit" in error_msg:
                print(f"⚠️ Worker caught 429 Rate Limit on Groq. Locking Key in Redis...")
                groq_key_manager.lock_key(api_key)
                continue
            
            print(f"❌ Groq API Error: {str(e)}")
            if attempt == max_retries - 1:
                raise RuntimeError(f"Groq failed permanently after {max_retries} attempts.") from e
                
    # THE FIX: Prevent silent None returns
    raise RuntimeError(f"API Rate Limit Reached: Groq failed permanently after {max_retries} retries.")

def check_semantic_cache(jd_text: str):
    try:
        jd_hash = base64.b64encode(jd_text[:100].encode()).decode() 
        cached_result = redis_client.get(f"jd_cache:{jd_hash}")
        if cached_result:
            print("--- ⚡ Step 1: Cache Hit! Bypassing LLM. ---")
            return json.loads(cached_result)
    except Exception as e:
        print(f"Cache checking failed: {e}")
    return None

def execute_tailor_chain(resume_input: str, job_description: str, template_name: str = "base_template") -> dict:
    try:
        # 0. GROQ LPU INPUT PARSER
        try:
            full_resume_data = json.loads(resume_input)
            print("--- 🧠 Input is already valid JSON ---")
        except json.JSONDecodeError:
            resume_json_str = parse_raw_text_to_json(resume_input)
            full_resume_data = json.loads(resume_json_str)

        immutables = {
            "personal_info": full_resume_data.get("personal_info", {}),
            "education": full_resume_data.get("education", []),
            "achievements": full_resume_data.get("achievements", []),
            "certifications": full_resume_data.get("certifications", [])
        }
        mutables = {k: full_resume_data.get(k, []) for k in ["summary", "skills", "experience", "projects"]}
        mutable_json_str = json.dumps(mutables, indent=2)

        # 1. CACHE & JD EXTRACTION
        print("--- 🧠 Tailoring Step 1: Extract JD ---")
        jd_data = check_semantic_cache(job_description)
        if not jd_data:
            prompt1 = load_file('prompt_step1_jd_analysis.txt').replace('{job_description}', job_description)
            raw_jd_json = call_gemini_api(prompt1, schema=JobDescriptionAnalysis)
            jd_data = json.loads(raw_jd_json)
            jd_hash = base64.b64encode(job_description[:100].encode()).decode()
            redis_client.setex(f"jd_cache:{jd_hash}", 86400, json.dumps(jd_data))

        target_title = jd_data.get("target_job_title", "Software Engineer")
        all_jd_skills = jd_data.get("must_have_tech_skills", []) + jd_data.get("sdlc_and_practices", [])
        missing_skills = find_missing_keywords(json.dumps(full_resume_data), all_jd_skills)
        missing_skills_str = ", ".join(missing_skills) if missing_skills else "None"
        
        bonus_skills = find_missing_keywords(json.dumps(full_resume_data), jd_data.get("good_to_have_skills", []))
        bonus_skills_str = ", ".join(bonus_skills) if bonus_skills else "None"
        
        print(f"🎯 Title: {target_title} | 🛠️ Missing: {missing_skills_str} | 🎁 Bonus: {bonus_skills_str}")

        # 2. GEMINI SURGICAL INJECTION
        print("--- ⚙️ Tailoring Step 2: Surgical Injection ---")
        tone = calculate_yoe(full_resume_data.get("experience", []))
        
        soft_skills_str = ", ".join(jd_data.get("soft_skills", [])) if jd_data.get("soft_skills") else "None"
        sdlc_str = ", ".join(jd_data.get("sdlc_and_practices", [])) if jd_data.get("sdlc_and_practices") else "None"
        verbs_str = ", ".join(jd_data.get("action_verbs", [])) if jd_data.get("action_verbs") else "None"

        prompt2 = load_file('prompt_step2_planning.txt') \
            .replace('{target_job_title}', target_title) \
            .replace('{tone}', tone) \
            .replace('{missing_skills}', missing_skills_str) \
            .replace('{bonus_skills}', bonus_skills_str) \
            .replace('{soft_skills}', soft_skills_str) \
            .replace('{sdlc_and_practices}', sdlc_str) \
            .replace('{action_verbs}', verbs_str) \
            .replace('{resume_text}', mutable_json_str) 
        
        raw_tailored_json = call_gemini_api(prompt2, schema=ResumeData)
        tailored_data = json.loads(raw_tailored_json)

        # 3. REGEX PIPELINE BULLETPROOFING
        print("--- 🔒 Running Basic Number Lock & Length Shield ---")
        cleaned_ai_data = verify_metrics(mutable_json_str, tailored_data)
        
        # ---> THE SHIELD IS ACTIVATED HERE <---
        cleaned_ai_data = verify_bullet_count(mutable_json_str, cleaned_ai_data)
        
        cleaned_ai_data.update(immutables)

        # 4. FINAL COMPILATION
        try:
            cleaned_ai_data = coerce_ints_to_strings(cleaned_ai_data)
            validated_resume = ResumeData(**cleaned_ai_data)
            clean_data = sanitize_for_latex(validated_resume.model_dump())
        except Exception as pydantic_err:
            print(f"❌ Pydantic Validation Error: {pydantic_err}")
            raise RuntimeError("Data Shield failure: Incompatible resume structure generated.") from pydantic_err

        print("--- ⚙️ Tailoring Step 3: Generating LaTeX and PDF ---")
        generator = ResumeGenerator()
        gen_result = generator.generate(template_name, clean_data)
        
        pdf_path = gen_result["pdf_path"]
        tex_path = pdf_path.replace(".pdf", ".tex")

        with open(pdf_path, "rb") as f: 
            pdf_b64 = base64.b64encode(f.read()).decode('utf-8')
        with open(tex_path, "r", encoding="utf-8") as f: 
            tex_content = f.read()

        return { 
            "latex_code": tex_content, 
            "pdf_base64": pdf_b64, 
            "session_dir": gen_result["session_dir"],
            "targeted_skills": missing_skills 
        }

    except Exception as e:
        raise RuntimeError(f"Tailoring Chain failed: {str(e)}") from e