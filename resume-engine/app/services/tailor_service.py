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

def extract_and_parse_ai_json(raw_text: str) -> dict:
    """Intelligently extracts and parses JSON, ignoring AI trailing garbage."""
    # Step 1: Direct Parse Attempt
    try:
        return json.loads(raw_text, strict=False)
    except Exception:
        pass

    # Step 2: Strip Markdown Blocks
    clean_text = raw_text.replace("```json", "").replace("```", "").strip()
    try:
        return json.loads(clean_text, strict=False)
    except Exception:
        pass

    # Step 3: THE MAGIC BULLET (raw_decode)
    # Extracts the first valid JSON object and ignores ANY trailing extra data/brackets
    start_idx = clean_text.find('{')
    if start_idx != -1:
        try:
            decoder = json.JSONDecoder(strict=False)
            # raw_decode returns the parsed object and the index where it stopped
            parsed_obj, _ = decoder.raw_decode(clean_text[start_idx:])
            return parsed_obj
        except Exception:
            pass

    # Step 4: Fallback Precise Bracket Extraction
    start_idx = raw_text.find('{')
    end_idx = raw_text.rfind('}')
    
    if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
        json_str = raw_text[start_idx:end_idx+1]
        try:
            return json.loads(json_str, strict=False)
        except json.JSONDecodeError:
            # Step 5: AST Fallback
            try:
                safe_str = json_str.replace('null', 'None').replace('true', 'True').replace('false', 'False')
                return ast.literal_eval(safe_str)
            except Exception as e:
                print(f"❌ FATAL JSON ERROR: {json_str[:200]}")
                raise RuntimeError("CRITICAL: JSON Parser failed. Ensure AI output is strictly JSON.") from e
                
    raise ValueError("No JSON structure found in AI response.")

def find_missing_keywords(resume_string: str, jd_data: dict) -> list:
    missing = []
    resume_lower = resume_string.lower()
    
    all_jd_skills = jd_data.get("must_have_tech_skills", []) + \
                    jd_data.get("sdlc_and_practices", []) + \
                    jd_data.get("good_to_have_skills", [])
    
    for skill in all_jd_skills:
        skill_str = str(skill).lower()
        if skill_str in resume_lower: continue
        if fuzz.partial_ratio(skill_str, resume_lower) < 80: missing.append(str(skill))
        
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
    baseline_numbers = set(re.findall(r'\d+', baseline_text))
    
    exp_list = tailored_data.get('experience', [])
    for exp in exp_list:
        bullets = exp.get('descriptionPoints', [])
        for i, bullet in enumerate(bullets):
            bullet_nums = set(re.findall(r'\d+', str(bullet)))
            if not bullet_nums.issubset(baseline_numbers):
                print(f"⚠️ Hallucination Detected (Number Lock Triggered): {bullet}")
                bullets[i] = re.sub(r'\d+', '[REDACTED_AI_METRIC]', bullet)
                
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

# 🚨 STEP 0 HELPER: Converts Raw Text or LaTeX into structured JSON
def parse_raw_text_to_json(raw_text: str) -> str:
    print("--- 🔍 Step 0: Parsing Raw Input to JSON ---")
    prompt0_template = load_file('prompt_step0_parser.txt')
    prompt0 = prompt0_template.replace('{raw_resume}', raw_text)
    
    raw_ai_response = call_gemini_api(prompt0, force_json=True)
    parsed_dict = extract_and_parse_ai_json(raw_ai_response)
    return json.dumps(parsed_dict)

# 🚨 UNIVERSAL CHAIN: Accepts raw text, LaTeX, or JSON string seamlessly
def execute_tailor_chain(resume_input: str, job_description: str, template_name: str = "base_template") -> dict:
    try:
        # 0. SMART INPUT HANDLER
        try:
            full_resume_data = json.loads(resume_input)
            print("--- 🧠 Input is already valid JSON ---")
        except json.JSONDecodeError:
            # Agar direct JSON nahi hai, toh Step 0 call karo
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

        print("--- ⚙️ Tailoring Step 2: Surgical Injection (Shield Active) ---")
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

        try:
            validated_resume = ResumeData(**cleaned_ai_data)
            clean_data = validated_resume.model_dump()
        except Exception as pydantic_err:
            print(f"❌ Pydantic Validation Error: {pydantic_err}")
            clean_data = cleaned_ai_data 

        clean_data = remove_none_and_newlines(clean_data)

        print("--- 🧹 Running Checkpoint 2: LaTeX Sanitizer ---")
        clean_data = sanitize_for_latex(clean_data)

        print("--- ⚙️ Tailoring Step 3: Generating LaTeX and PDF ---")
        generator = ResumeGenerator()
        gen_result = generator.generate(template_name, clean_data)
        
        pdf_path = gen_result["pdf_path"]
        tex_path = pdf_path.replace(".pdf", ".tex")

        with open(pdf_path, "rb") as f: pdf_b64 = base64.b64encode(f.read()).decode('utf-8')
        with open(tex_path, "r", encoding="utf-8") as f: tex_content = f.read()

        return { 
            "latex_code": tex_content, 
            "pdf_base64": pdf_b64, 
            "session_dir": gen_result["session_dir"],
            "targeted_skills": missing_skills 
        }

    except Exception as e:
        raise RuntimeError(f"Tailoring failed: {str(e)}") from e