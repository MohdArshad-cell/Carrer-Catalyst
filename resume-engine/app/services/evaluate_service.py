import os
import json
import re
from pathlib import Path
import google.generativeai as genai

# --- CONFIGURATION ---
API_KEY = os.getenv("GOOGLE_API_KEY")
MODEL_NAME = "gemini-2.5-flash-lite"

# Dynamically point to the new 'evaluate' prompts folder
BASE_DIR = Path(__file__).resolve().parent.parent
EVAL_PROMPTS_DIR = BASE_DIR / "prompts" / "evaluate"

# --- HELPER FUNCTIONS ---
def load_file(filename: str) -> str:
    """Reads and returns the content of a file from the evaluate prompts directory."""
    file_path = EVAL_PROMPTS_DIR / filename
    if not file_path.exists():
        raise FileNotFoundError(f"Required prompt file not found at {file_path}")
    with open(file_path, 'r', encoding='utf-8') as f:
        return f.read()

def call_gemini_api(prompt: str) -> str:
    """Calls the Gemini API with a given prompt and returns the text response."""
    genai.configure(api_key=API_KEY)
    model = genai.GenerativeModel(model_name=MODEL_NAME)
    response = model.generate_content(prompt)
    return response.text

def clean_json_string(json_string: str) -> str:
    """Finds and extracts the first valid JSON object or array from a string."""
    match = re.search(r'```(json)?\s*(\{[\s\S]*\}|\[[\s\S]*\])\s*```', json_string)
    if match:
        return match.group(2)
    
    match = re.search(r'\{[\s\S]*\}|\[[\s\S]*\]', json_string)
    if match:
        return match.group(0)
    
    raise ValueError(f"No valid JSON object or array found in the AI's response: {json_string}")

# --- MAIN EXECUTION FUNCTION ---
def execute_evaluate_chain(resume_content: str, job_description: str) -> str:
    """Executes the 3-step evaluation prompt chain natively in Python."""
    if not API_KEY:
        raise RuntimeError("GOOGLE_API_KEY environment variable is missing in Python server.")

    try:
        # STEP 1: Analyze the Job Description
        prompt1_template = load_file('prompt_step1_jd_analysis.txt')
        prompt1 = prompt1_template.format(job_description=job_description)
        jd_analysis_json = json.loads(clean_json_string(call_gemini_api(prompt1)))

        # STEP 2: Analyze the Resume
        prompt2_template = load_file('prompt_step2_resume_analysis.txt')
        prompt2 = prompt2_template.format(resume_content=resume_content)
        resume_analysis_json = json.loads(clean_json_string(call_gemini_api(prompt2)))

        # STEP 3: Perform the Comprehensive ATS Evaluation
        prompt3_template = load_file('prompt_step3_ats_evaluation.txt')
        prompt3 = prompt3_template.format(
            job_description_json=json.dumps(jd_analysis_json, indent=2),
            resume_json=json.dumps(resume_analysis_json, indent=2),
            original_resume=resume_content
        )
        final_evaluation = call_gemini_api(prompt3)
        
        return final_evaluation

    except Exception as e:
        # Proper error handling for the web server
        raise RuntimeError(f"ATS Evaluation Chain Failed: {str(e)}")