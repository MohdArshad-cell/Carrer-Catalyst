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

load_dotenv()

API_KEY = os.getenv("GOOGLE_API_KEY") 
MODEL_NAME = "gemini-3.5-flash"

if not API_KEY:
    raise ValueError("CRITICAL: GOOGLE_API_KEY environment variable is not set.")

genai.configure(api_key=API_KEY)
model = genai.GenerativeModel(model_name=MODEL_NAME)

# Path to your custom prompts folder
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
        # Fallback to AST if JSON is malformed with single quotes
        try:
            return ast.literal_eval(extracted.replace('null', 'None').replace('true', 'True').replace('false', 'False'))
        except Exception as e:
            raise RuntimeError("CRITICAL: JSON Parser failed.") from e

def find_missing_keywords(resume_text: str, jd_data: dict) -> list:
    """Phase 2: Algorithmic Fuzzy Gap Analysis (Zero AI)"""
    missing = []
    resume_lower = resume_text.lower()
    
    # Check Must-Have, Good-to-Have, and Soft Skills together
    all_jd_skills = (
        jd_data.get("must_have_skills", []) + 
        jd_data.get("good_to_have_skills", []) +
        jd_data.get("soft_skills", [])
    )
    
    for skill in all_jd_skills:
        skill_str = str(skill).lower()
        # Direct match first (Fastest)
        if skill_str in resume_lower:
            continue
            
        # Fuzzy match (Detects "Amazon Web Services" == "AWS")
        score = fuzz.partial_ratio(skill_str, resume_lower)
        if score < 80:  # 80% similarity threshold
            missing.append(str(skill))
            
    # Return top 6 missing keywords to avoid over-stuffing
    return missing[:6]

def execute_tailor_chain(resume_text: str, job_description: str, template_name: str = "professional") -> dict:
    try:
        # Step 1: Extract JD
        print("--- 🧠 Tailoring Step 1: Extract JD ---")
        prompt1_template = load_file('prompt_step1_jd_analysis.txt')
        prompt1 = prompt1_template.replace('{job_description}', job_description)
        jd_data = extract_and_parse_ai_json(call_gemini_api(prompt1, force_json=True))

        # Step 2: Gap Analysis
        print("--- ⚙️ Tailoring Step 2: Gap Analysis ---")
        missing_keywords = find_missing_keywords(resume_text, jd_data)
        action_verbs = jd_data.get("action_verbs", [])

        # Smart fallbacks for Edge Cases
        missing_str = ", ".join(missing_keywords) if missing_keywords else "None. Just optimize the existing action verbs."
        verbs_str = ", ".join(action_verbs) if action_verbs else "Use strong, professional action verbs."

        # Step 3: Micro-Tailor and Force JSON Output
        print("--- 🧠 Tailoring Step 3: Micro-Tailoring into JSON ---")
        prompt2_template = load_file('prompt_step2_planning.txt')
        prompt2 = prompt2_template.replace('{missing_keywords}', missing_str)\
                                  .replace('{action_verbs}', verbs_str)\
                                  .replace('{resume_text}', resume_text)
        
        raw_tailored_json = call_gemini_api(prompt2, force_json=True)
        tailored_data = extract_and_parse_ai_json(raw_tailored_json)

        # Step 4: Generate PDF and LaTeX using Jinja2 template
        print("--- ⚙️ Tailoring Step 4: Generating LaTeX and PDF ---")
        generator = ResumeGenerator()
        gen_result = generator.generate(template_name, tailored_data)
        
        pdf_path = gen_result["pdf_path"]
        tex_path = pdf_path.replace(".pdf", ".tex")

        # Read the generated files safely into memory
        with open(pdf_path, "rb") as f:
            pdf_b64 = base64.b64encode(f.read()).decode('utf-8')
        with open(tex_path, "r", encoding="utf-8") as f:
            tex_content = f.read()

        print("--- ✅ Tailoring Complete! Sending data to Frontend ---")
        
        # Return the parsed strings and direct the server to clean up the folder
        return {
            "latex_code": tex_content,
            "pdf_base64": pdf_b64,
            "session_dir": gen_result["session_dir"] 
        }

    except Exception as e:
        raise RuntimeError(f"Tailoring failed: {str(e)}") from e