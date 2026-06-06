import os
import json
import re
import ast
from pathlib import Path
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# --- CONFIGURATION ---
API_KEY = os.getenv("GOOGLE_API_KEY") 
MODEL_NAME = "gemini-2.5-flash-lite"

if not API_KEY:
    raise ValueError("CRITICAL: GOOGLE_API_KEY environment variable is not set in Python server.")

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
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
    else:
        response = model.generate_content(prompt)
    return response.text

def extract_and_parse_ai_json(raw_text: str) -> dict:
    """Bulletproof parser: Tries JSON first, falls back to AST if AI uses single quotes."""
    match = re.search(r'\{[\s\S]*\}|\[[\s\S]*\]', raw_text)
    if not match:
        raise ValueError(f"No structure found in AI response. Raw text: {raw_text}")
    
    extracted = match.group(0)
    
    # Attempt 1: Strict standard JSON parsing
    try:
        cleaned = re.sub(r'\\(?![/"\\bfnrtu])', r'\\\\', extracted)
        cleaned = cleaned.replace('\n', '\\n').replace('\r', '')
        cleaned = re.sub(r',\s*([\]}])', r'\1', cleaned)
        return json.loads(cleaned, strict=False)
    except json.JSONDecodeError:
        # Attempt 2: The AST Fallback (Handles single quotes and Python dict formats)
        try:
            # Convert JSON specific null/booleans to Python equivalents before evaluating
            ast_ready_text = extracted.replace('null', 'None').replace('true', 'True').replace('false', 'False')
            return ast.literal_eval(ast_ready_text)
        except Exception as e:
            raise RuntimeError(f"CRITICAL: Parser failed on AI output. AI Output was: {extracted}") from e

def clean_final_latex(text: str) -> str:
    bt = '`' * 3
    pattern_start = r'^' + bt + r'(?:latex|tex)?\s*'
    pattern_end = r'' + bt + r'\s*$'
    
    text = re.sub(pattern_start, '', text, flags=re.IGNORECASE | re.MULTILINE)
    text = re.sub(pattern_end, '', text, flags=re.MULTILINE).strip()

    # FIX: Isolate the Preamble. We only apply regex to the Body.
    doc_start = text.find(r'\begin{document}')
    if doc_start == -1:
        return text.strip() 
        
    preamble = text[:doc_start]
    body = text[doc_start:]
    
    # Typography fixes ONLY on the body
    replacements = { "’": "'", "–": "--", "—": "--", "\uFFFD": "--" }
    for old, new in replacements.items():
        body = body.replace(old, new)
        
    # Safely escape ampersands and percentages ONLY in the body
    body = re.sub(r'(?<!\\)&', r'\\&', body)
    body = re.sub(r'(?<!\\)%(?!\w)', r'\\%', body)
    
    body = body.replace('{{', '{').replace('}}', '}')
    
    # Recombine and return
    return (preamble + body).strip()

# --- MAIN EXECUTION FUNCTION ---
def execute_tailor_chain(resume_content: str, job_description: str) -> str:
    try:
        # Step 1: Force valid JSON
        prompt1_template = load_file('prompt_step1_jd_analysis.txt')
        # FIX: Using .replace() instead of .format() to avoid JSON/LaTeX curly brace conflicts
        prompt1 = prompt1_template.replace('{job_description}', job_description)
        raw_json_1 = call_gemini_api(prompt1, force_json=True)
        jd_analysis_json = extract_and_parse_ai_json(raw_json_1)

        # Step 2: Force valid JSON
        prompt2_template = load_file('prompt_step2_planning.txt')
        # FIX: Replace variables sequentially
        prompt2 = prompt2_template.replace('{jd_analysis_json}', json.dumps(jd_analysis_json, indent=2)) \
                                  .replace('{resume_content}', resume_content)
        raw_json_2 = call_gemini_api(prompt2, force_json=True)
        strategic_plan_json = extract_and_parse_ai_json(raw_json_2)

        # Step 3: Drafting (LaTeX - No JSON forced)
        latex_template = "" 
        try:
            latex_template = load_file('template.tex')
        except FileNotFoundError:
            pass 
            
        prompt3_template = load_file('prompt_step3_drafting.txt')
        # FIX: Safe replacement for LaTeX templates
        prompt3 = prompt3_template.replace('{strategic_plan_json}', json.dumps(strategic_plan_json, indent=2)) \
                                  .replace('{resume_content}', resume_content) \
                                  .replace('{DEFAULT_LATEX_TEMPLATE}', latex_template)
        latex_draft = call_gemini_api(prompt3, force_json=False)

        # Step 4: Critique & Refine (LaTeX - No JSON forced)
        prompt4_template = load_file('prompt_step4_review.txt')
        # FIX: Safe replacement
        prompt4 = prompt4_template.replace('{jd_analysis_json}', json.dumps(jd_analysis_json, indent=2)) \
                                  .replace('{strategic_plan_json}', json.dumps(strategic_plan_json, indent=2)) \
                                  .replace('{latex_draft}', latex_draft)
        final_latex = call_gemini_api(prompt4, force_json=False)

        return clean_final_latex(final_latex)

    except Exception as e:
        raise RuntimeError(f"Chain Prompting Failed: {str(e)}") from e