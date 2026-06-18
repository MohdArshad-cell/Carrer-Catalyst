import os
import json
import re
from pathlib import Path
import google.generativeai as genai
from dotenv import load_dotenv
import base64

from app.generator import ResumeGenerator
from app.models import ResumeData

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
TAILOR_PROMPTS_DIR = BASE_DIR / "prompts" / "tailor"


# ==========================================
# 2. CORE UTILITIES
# ==========================================
def load_file(filename: str) -> str:
    file_path = TAILOR_PROMPTS_DIR / filename
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

def extract_and_parse_ai_json(raw_text: str) -> dict:
    """Strictly parses JSON. Fails fast if the AI hallucinates bad structures."""
    try:
        return json.loads(raw_text)
    except json.JSONDecodeError:
        # Strip Markdown Blocks if Gemini ignored the mime-type directive
        clean_text = re.sub(r'```(?:json)?', '', raw_text).replace('```', '').strip()
        try:
            return json.loads(clean_text)
        except json.JSONDecodeError as e:
            print(f"❌ FATAL JSON ERROR. Raw Output:\n{raw_text[:300]}")
            raise RuntimeError("CRITICAL: AI returned malformed JSON. Validation shield triggered.") from e

def find_missing_keywords(resume_string: str, jd_data: dict) -> list:
    """Uses exact word boundaries, stopping the AI from hallucinating partial matches."""
    missing = []
    resume_lower = resume_string.lower()
    
    all_jd_skills = jd_data.get("must_have_tech_skills", []) + \
                    jd_data.get("sdlc_and_practices", []) + \
                    jd_data.get("good_to_have_skills", [])
    
    for skill in all_jd_skills:
        skill_str = str(skill).lower().strip()
        if not skill_str:
            continue
            
        # \b ensures exact match (e.g., "C" won't match "Action")
        pattern = r'\b' + re.escape(skill_str) + r'\b'
        if not re.search(pattern, resume_lower):
            missing.append(str(skill))
            
    return missing[:6] 

def sanitize_for_latex(data):
    if isinstance(data, dict):
        return {k: sanitize_for_latex(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [sanitize_for_latex(v) for v in data]
    elif isinstance(data, str):
        sanitized = re.sub(r'(?<!\\)&', r'\&', data)
        sanitized = re.sub(r'(?<!\\)%', r'\%', sanitized)
        sanitized = re.sub(r'(?<!\\)\$', r'\$', sanitized)
        return sanitized
    return data

def verify_metrics(baseline_text: str, tailored_data: dict) -> dict:
    """Drops hallucinated bullets instead of ruining the PDF with redaction tags."""
    baseline_numbers = set(re.findall(r'\b\d+\b', baseline_text))
    
    exp_list = tailored_data.get('experience', [])
    for exp in exp_list:
        bullets = exp.get('descriptionPoints', [])
        valid_bullets = []
        
        for bullet in bullets:
            bullet_nums = set(re.findall(r'\b\d+\b', str(bullet)))
            
            # Ignore single digit numbers (often used for structure, e.g., "1 team")
            suspicious_nums = {n for n in bullet_nums if len(n) > 1 and n not in baseline_numbers}
            
            if suspicious_nums:
                print(f"⚠️ Hallucination Dropped (Metric: {suspicious_nums}): {bullet[:50]}...")
            else:
                valid_bullets.append(bullet)
                
        exp['descriptionPoints'] = valid_bullets
    return tailored_data

def normalize_ai_data(data: dict) -> dict:
    if len(data) == 1 and isinstance(list(data.values())[0], dict): data = list(data.values())[0]
    if "resume" in data and isinstance(data["resume"], dict): data = data["resume"]
    if "resume_data" in data and isinstance(data["resume_data"], dict): data = data["resume_data"]

    exp_list = data.get('experience') or data.get('workExperience') or data.get('work_experience') or []
    for exp in exp_list:
        if 'title' in exp: exp['role'] = exp.pop('title')
        if 'position' in exp: exp['role'] = exp.pop('position')
        if 'description' in exp: exp['descriptionPoints'] = exp.pop('description')
        if 'bullets' in exp: exp['descriptionPoints'] = exp.pop('bullets')
        if isinstance(exp.get('descriptionPoints'), str): exp['descriptionPoints'] = [exp['descriptionPoints']]
    data['experience'] = exp_list

    proj_list = data.get('projects') or []
    for proj in proj_list:
        if 'title' in proj: proj['name'] = proj.pop('title')
        if 'description' in proj: proj['descriptionPoints'] = proj.pop('description')
        if 'technologies' in proj: proj['tech_stack'] = proj.pop('technologies')
        if isinstance(proj.get('descriptionPoints'), str): proj['descriptionPoints'] = [proj['descriptionPoints']]
    data['projects'] = proj_list
    
    return data

def remove_none_and_newlines(data):
    if isinstance(data, dict):
        return {k: remove_none_and_newlines(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [remove_none_and_newlines(v) for v in data]
    elif isinstance(data, str):
        cleaned = data.replace('\n', ' ').replace('\r', '').strip()
        if cleaned in ["N/A", "N/A -- N/A", "null", "None"]:
            return ""
        return cleaned
    return "" if data is None else data


# ==========================================
# 3. CORE EXECUTION CHAINS
# ==========================================
def parse_raw_text_to_json(raw_text: str) -> str:
    print("--- 🔍 Step 0: Parsing Raw Input to JSON ---")
    prompt0_template = load_file('prompt_step0_parser.txt')
    prompt0 = prompt0_template.replace('{raw_resume}', raw_text)
    
    raw_ai_response = call_gemini_api(prompt0, force_json=True)
    parsed_dict = extract_and_parse_ai_json(raw_ai_response)
    return json.dumps(parsed_dict)

def execute_tailor_chain(resume_input: str, job_description: str, template_name: str = "base_template") -> dict:
    try:
        # 0. SMART INPUT HANDLER
        try:
            full_resume_data = json.loads(resume_input)
            print("--- 🧠 Input is already valid JSON ---")
        except json.JSONDecodeError:
            resume_json_str = parse_raw_text_to_json(resume_input)
            full_resume_data = json.loads(resume_json_str)

        # 1. THE DATA SHIELD: Separate Immutable Facts from Mutable Content
        immutables = {
            "personal_info": full_resume_data.get("personal_info", {}),
            "education": full_resume_data.get("education", []),
            "achievements": full_resume_data.get("achievements", []),
            "certifications": full_resume_data.get("certifications", [])
        }
        
        mutables = {
            "summary": full_resume_data.get("summary", ""),
            "skills": full_resume_data.get("skills", []),
            "experience": full_resume_data.get("experience", []),
            "projects": full_resume_data.get("projects", [])
        }
        
        mutable_json_str = json.dumps(mutables, indent=2)

        print("--- 🧠 Tailoring Step 1: Extract JD ---")
        prompt1_template = load_file('prompt_step1_jd_analysis.txt')
        prompt1 = prompt1_template.replace('{job_description}', job_description)
        raw_jd_json = call_gemini_api(prompt1, force_json=True)
        jd_data = extract_and_parse_ai_json(raw_jd_json)

        target_title = jd_data.get("target_job_title", "Software Engineer")
        
        structured_json_str = json.dumps(full_resume_data)
        missing_skills = find_missing_keywords(structured_json_str, jd_data)
        missing_skills_str = ", ".join(missing_skills) if missing_skills else "None"
        print(f"🎯 Target Title: {target_title} | 🛠️ Missing Skills: {missing_skills_str}")

        print("--- ⚙️ Tailoring Step 2: Surgical Injection ---")
        prompt2_template = load_file('prompt_step2_planning.txt') 
        prompt2 = prompt2_template.replace('{target_job_title}', target_title) \
                                  .replace('{missing_skills}', missing_skills_str) \
                                  .replace('{resume_text}', mutable_json_str) 
        
        raw_tailored_json = call_gemini_api(prompt2, force_json=True)
        tailored_data = extract_and_parse_ai_json(raw_tailored_json)

        print("--- 🛠️ Running Aggressive Normalizer ---")
        cleaned_ai_data = normalize_ai_data(tailored_data)

        print("--- 🔒 Running Checkpoint 1: Number Lock ---")
        cleaned_ai_data = verify_metrics(mutable_json_str, cleaned_ai_data)

        print("--- 🛡️ Merging Shielded Data & Validating ---")
        cleaned_ai_data.update(immutables)

        # 🚨 STRICT VALIDATION: Do not bypass Pydantic anymore.
        try:
            validated_resume = ResumeData(**cleaned_ai_data)
            clean_data = validated_resume.model_dump()
        except Exception as pydantic_err:
            print(f"❌ Pydantic Validation Error: {pydantic_err}")
            raise RuntimeError("Data Shield failure: The AI generated an incompatible resume structure.") from pydantic_err

        clean_data = remove_none_and_newlines(clean_data)

        print("--- 🧹 Running Checkpoint 2: LaTeX Sanitizer ---")
        clean_data = sanitize_for_latex(clean_data)

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