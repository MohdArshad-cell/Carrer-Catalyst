import os
import json
import re
import ast
from pathlib import Path
import google.generativeai as genai
from rapidfuzz import fuzz
from dotenv import load_dotenv
from app.generator import ResumeGenerator
import base64
from app.models import ResumeData
import time
load_dotenv()

API_KEY = os.getenv("GOOGLE_API_KEY") 
MODEL_NAME = "gemini-3.1-flash-lite" 

if not API_KEY:
    raise ValueError("CRITICAL: GOOGLE_API_KEY environment variable is not set.")

genai.configure(api_key=API_KEY)
model = genai.GenerativeModel(model_name=MODEL_NAME)

BASE_DIR = Path(__file__).resolve().parent.parent
TAILOR_PROMPTS_DIR = BASE_DIR / "prompts" / "tailor"

def load_file(filename: str) -> str:
    file_path = TAILOR_PROMPTS_DIR / filename
    if not file_path.exists():
        raise FileNotFoundError(f"Required prompt file not found at {file_path}")
    with open(file_path, 'r', encoding='utf-8') as f:
        return f.read()

def call_gemini_api(prompt: str, force_json: bool = False, retries=3) -> str:
    # Explicitly asking for max tokens so the resume never gets cut off mid-way
    config = {
        "max_output_tokens": 8192,
        "temperature": 0.2, # Low temp ensures strict adherence to JSON formatting
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

def extract_and_parse_ai_json(raw_text: str) -> dict:
    # Step 1: Direct Parse Attempt
    try:
        return json.loads(raw_text, strict=False)
    except Exception:
        pass

    # Step 2: Strip Markdown Blocks SAFELY (Bypassing UI Regex bugs)
    clean_text = raw_text.replace("```json", "").replace("```", "").strip()
    
    try:
        return json.loads(clean_text, strict=False)
    except Exception:
        pass

    # Step 3: Precise Bracket Extraction
    start_idx = raw_text.find('{')
    end_idx = raw_text.rfind('}')
    
    if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
        json_str = raw_text[start_idx:end_idx+1]
        try:
            return json.loads(json_str, strict=False)
        except json.JSONDecodeError:
            # Step 4: AST Fallback for minor quotes issues
            try:
                safe_str = json_str.replace('null', 'None').replace('true', 'True').replace('false', 'False')
                return ast.literal_eval(safe_str)
            except Exception as e:
                print(f"❌ FATAL JSON ERROR: {json_str[:200]}")
                raise RuntimeError("CRITICAL: JSON Parser failed.") from e
                
    raise ValueError("No JSON structure found in AI response.")

def find_missing_keywords(resume_text: str, jd_data: dict) -> list:
    missing = []
    resume_lower = resume_text.lower()
    all_jd_skills = jd_data.get("must_have_skills", []) + jd_data.get("good_to_have_skills", []) + jd_data.get("soft_skills", [])
    
    for skill in all_jd_skills:
        skill_str = str(skill).lower()
        if skill_str in resume_lower: continue
        if fuzz.partial_ratio(skill_str, resume_lower) < 80: missing.append(str(skill))
    return missing[:6]

def normalize_ai_data(data: dict) -> dict:
    """Brute-force unwraps and normalizes AI data to strictly match our templates."""
    # Unwrap if AI wrapped it in {"resume_data": {...}}
    if len(data) == 1 and isinstance(list(data.values())[0], dict): data = list(data.values())[0]
    if "resume" in data and isinstance(data["resume"], dict): data = data["resume"]
    if "resume_data" in data and isinstance(data["resume_data"], dict): data = data["resume_data"]

    # Force normalize Experience
    exp_list = data.get('experience') or data.get('workExperience') or data.get('work_experience') or []
    for exp in exp_list:
        if 'title' in exp: exp['role'] = exp.pop('title')
        if 'position' in exp: exp['role'] = exp.pop('position')
        if 'description' in exp: exp['descriptionPoints'] = exp.pop('description')
        if 'bullets' in exp: exp['descriptionPoints'] = exp.pop('bullets')
        if isinstance(exp.get('descriptionPoints'), str): exp['descriptionPoints'] = [exp['descriptionPoints']]
    data['experience'] = exp_list

    # Force normalize Projects
    proj_list = data.get('projects') or []
    for proj in proj_list:
        if 'title' in proj: proj['name'] = proj.pop('title')
        if 'description' in proj: proj['descriptionPoints'] = proj.pop('description')
        if 'technologies' in proj: proj['tech_stack'] = proj.pop('technologies')
        if isinstance(proj.get('descriptionPoints'), str): proj['descriptionPoints'] = [proj['descriptionPoints']]
    data['projects'] = proj_list
    
    return data

def remove_none_and_newlines(data):
    """Recursively converts None to '' and strips hidden newlines that crash LaTeX tables."""
    if isinstance(data, dict):
        return {k: remove_none_and_newlines(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [remove_none_and_newlines(v) for v in data]
    elif isinstance(data, str):
        # AI ke hidden enters aur carriage returns ko space se replace kar do
        return data.replace('\n', ' ').replace('\r', '').strip()
    return "" if data is None else data

# 🚨 "modern_line" hata kar "base_template" kar diya 
def execute_tailor_chain(resume_text: str, job_description: str, template_name: str = "base_template") -> dict:
    try:
        print("--- 🧠 Tailoring Step 1: Extract JD ---")
        prompt1_template = load_file('prompt_step1_jd_analysis.txt')
        # Inject the JD into Step 1
        prompt1 = prompt1_template.replace('{job_description}', job_description)
        raw_jd_json = call_gemini_api(prompt1, force_json=True)
        jd_data = extract_and_parse_ai_json(raw_jd_json)

        print("--- ⚙️ Tailoring Step 2: Micro-Tailoring into JSON ---")
        # Ensure your file is named correctly. I'm assuming 'prompt_step2_planning.txt' contains the NEW prompt
        prompt2_template = load_file('prompt_step2_planning.txt') 
        
        # FIXED: We inject the entire JD JSON directly into the prompt as instructed
        prompt2 = prompt2_template.replace('{jd_analysis}', json.dumps(jd_data, indent=2)) \
                                  .replace('{resume_text}', resume_text)
        
        raw_tailored_json = call_gemini_api(prompt2, force_json=True)
        tailored_data = extract_and_parse_ai_json(raw_tailored_json)

        print("--- 🛠️ Running Aggressive Normalizer ---")
        cleaned_ai_data = normalize_ai_data(tailored_data)

        print("--- 🛡️ Normalizing JSON with Pydantic & None-Cleaner ---")
        try:
            validated_resume = ResumeData(**cleaned_ai_data)
            clean_data = validated_resume.model_dump()
        except Exception as pydantic_err:
            print(f"❌ Pydantic Validation Error: {pydantic_err}")
            clean_data = cleaned_ai_data 

        # FINAL SHIELD
        clean_data = remove_none_and_newlines(clean_data)

        print("--- ⚙️ Tailoring Step 3: Generating LaTeX and PDF ---")
        generator = ResumeGenerator()
        gen_result = generator.generate(template_name, clean_data)
        
        pdf_path = gen_result["pdf_path"]
        tex_path = pdf_path.replace(".pdf", ".tex")

        with open(pdf_path, "rb") as f: pdf_b64 = base64.b64encode(f.read()).decode('utf-8')
        with open(tex_path, "r", encoding="utf-8") as f: tex_content = f.read()

        return { "latex_code": tex_content, "pdf_base64": pdf_b64, "session_dir": gen_result["session_dir"] }

    except Exception as e:
        raise RuntimeError(f"Tailoring failed: {str(e)}") from e