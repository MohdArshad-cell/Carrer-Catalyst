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

load_dotenv()

API_KEY = os.getenv("GOOGLE_API_KEY") 
MODEL_NAME = "gemini-3.5-flash" 

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

def call_gemini_api(prompt: str, force_json: bool = False) -> str:
    if force_json:
        return model.generate_content(prompt, generation_config={"response_mime_type": "application/json"}).text
    return model.generate_content(prompt).text

def extract_and_parse_ai_json(raw_text: str) -> dict:
    match = re.search(r'\{[\s\S]*\}|\[[\s\S]*\]', raw_text)
    if not match: raise ValueError("No JSON structure found in AI response.")
    extracted = match.group(0)
    try:
        return json.loads(extracted, strict=False)
    except json.JSONDecodeError:
        try:
            return ast.literal_eval(extracted.replace('null', 'None').replace('true', 'True').replace('false', 'False'))
        except Exception as e:
            raise RuntimeError("CRITICAL: JSON Parser failed.") from e

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
        jd_data = extract_and_parse_ai_json(call_gemini_api(prompt1_template.replace('{job_description}', job_description), force_json=True))

        print("--- ⚙️ Tailoring Step 2: Gap Analysis ---")
        missing_keywords = find_missing_keywords(resume_text, jd_data)
        action_verbs = jd_data.get("action_verbs", [])

        missing_str = ", ".join(missing_keywords) if missing_keywords else "None. Just optimize verbs."
        verbs_str = ", ".join(action_verbs) if action_verbs else "Use strong verbs."

        print("--- 🧠 Tailoring Step 3: Micro-Tailoring into JSON ---")
        prompt2_template = load_file('prompt_step2_planning.txt')
        prompt2 = prompt2_template.replace('{missing_keywords}', missing_str).replace('{action_verbs}', verbs_str).replace('{resume_text}', resume_text)
        
        raw_tailored_json = call_gemini_api(prompt2, force_json=True)
        tailored_data = extract_and_parse_ai_json(raw_tailored_json)

        print("--- 🛠️ Running Aggressive Normalizer ---")
        cleaned_ai_data = normalize_ai_data(tailored_data)

        print("--- 🛡️ Normalizing JSON with Pydantic & None-Cleaner ---")
        try:
            validated_resume = ResumeData(**cleaned_ai_data)
            clean_data = validated_resume.model_dump() # Removed exclude_none=True
        except Exception as pydantic_err:
            print(f"❌ Pydantic Validation Error: {pydantic_err}")
            clean_data = cleaned_ai_data 

        # 🚨 FINAL SHIELD: Remove all None values so Jinja template NEVER fails
        # 🚨 FINAL SHIELD: Remove all None values and hidden \n so Jinja/LaTeX NEVER fails
        clean_data = remove_none_and_newlines(clean_data)

        print("\n=== FINAL DATA SENT TO JINJA (CHECK EXPERIENCE LIST HERE) ===")
        print(json.dumps({"experience": clean_data.get("experience"), "projects": clean_data.get("projects")}, indent=2))
        print("==============================================================\n")

        print("--- ⚙️ Tailoring Step 4: Generating LaTeX and PDF ---")
        generator = ResumeGenerator()
        gen_result = generator.generate(template_name, clean_data)
        
        pdf_path = gen_result["pdf_path"]
        tex_path = pdf_path.replace(".pdf", ".tex")

        with open(pdf_path, "rb") as f: pdf_b64 = base64.b64encode(f.read()).decode('utf-8')
        with open(tex_path, "r", encoding="utf-8") as f: tex_content = f.read()

        return { "latex_code": tex_content, "pdf_base64": pdf_b64, "session_dir": gen_result["session_dir"] }

    except Exception as e:
        raise RuntimeError(f"Tailoring failed: {str(e)}") from e