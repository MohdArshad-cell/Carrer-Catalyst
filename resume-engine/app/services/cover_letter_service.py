import os
import json
import re
from pathlib import Path
import google.generativeai as genai

# --- CONFIGURATION ---
API_KEY = os.getenv("GOOGLE_API_KEY")
MODEL_NAME = "gemini-2.5-flash-lite"

# Pointing to the new cover_letter prompts folder
BASE_DIR = Path(__file__).resolve().parent.parent
CL_PROMPTS_DIR = BASE_DIR / "prompts" / "cover_letter"

# --- HELPER FUNCTIONS ---
def load_file(filename: str) -> str:
    """Reads and returns the content of a file from the cover letter prompts directory."""
    file_path = CL_PROMPTS_DIR / filename
    if not file_path.exists():
        raise FileNotFoundError(f"Required prompt file not found at {file_path}")
    with open(file_path, 'r', encoding='utf-8') as f:
        return f.read()

def call_gemini_api(prompt: str) -> str:
    genai.configure(api_key=API_KEY)
    model = genai.GenerativeModel(model_name=MODEL_NAME)
    return model.generate_content(prompt).text

def clean_json_string(json_string: str) -> str:
    match = re.search(r'\{[\s\S]*\}|\[[\s\S]*\]', json_string)
    if match:
        return match.group(0)
    raise ValueError(f"No valid JSON object found in AI response: {json_string}")

# --- MAIN EXECUTION FUNCTION ---
def execute_cover_letter_chain(resume_content: str, job_description: str) -> str:
    if not API_KEY:
        raise RuntimeError("GOOGLE_API_KEY environment variable is missing in Python server.")

    try:
        # Step 1: Analysis
        prompt1_template = load_file('cl_prompt_step1_analysis.txt')
        prompt1 = prompt1_template.format(job_description=job_description, resume_content=resume_content)
        analysis_json = json.loads(clean_json_string(call_gemini_api(prompt1)))
        
        # Step 2: Outlining
        prompt2_template = load_file('cl_prompt_step2_outline.txt')
        prompt2 = prompt2_template.format(analysis_json=json.dumps(analysis_json, indent=2))
        outline_json = json.loads(clean_json_string(call_gemini_api(prompt2)))

        # Step 3: Drafting
        prompt3_template = load_file('cl_prompt_step3_draft.txt')
        prompt3 = prompt3_template.format(outline_json=json.dumps(outline_json, indent=2), resume_content=resume_content, job_description=job_description)
        cover_letter_draft = call_gemini_api(prompt3)

        # Step 4: Reviewing
        prompt4_template = load_file('cl_prompt_step4_review.txt')
        prompt4 = prompt4_template.format(cover_letter_draft=cover_letter_draft, analysis_json=json.dumps(analysis_json, indent=2))
        final_cover_letter = call_gemini_api(prompt4)
        
        return final_cover_letter

    except Exception as e:
        raise RuntimeError(f"Cover Letter Generation Chain Failed: {str(e)}")