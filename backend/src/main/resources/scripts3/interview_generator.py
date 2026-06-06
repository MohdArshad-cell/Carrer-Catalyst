import sys
import os
import json
import re
import google.generativeai as genai
import contextlib

# --- CONFIGURATION ---
API_KEY = os.getenv("GOOGLE_API_KEY")
MODEL_NAME = "gemini-2.5-flash-lite" 

def load_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        return f.read()

@contextlib.contextmanager
def suppress_stderr():
    original_stderr = sys.stderr
    sys.stderr = open(os.devnull, 'w', encoding='utf-8')
    try:
        yield
    finally:
        sys.stderr.close()
        sys.stderr = original_stderr

def call_gemini(prompt):
    with suppress_stderr():
        genai.configure(api_key=API_KEY)
        model = genai.GenerativeModel(MODEL_NAME)
        return model.generate_content(prompt).text

def clean_json(text):
    match = re.search(r'\{[\s\S]*\}|\[[\s\S]*\]', text)
    return match.group(0) if match else "{}"

def main():
    # Read JD from Stdin (passed by Java)
    try:
        job_description = sys.stdin.read().strip()
        if not job_description: raise ValueError("Empty Input")
    except Exception:
        sys.exit(1)

    script_dir = os.path.dirname(__file__)

    # --- CHAIN PROMPTING START ---
    
    # STEP 1: Deep Analysis
    try:
        p1 = load_file(os.path.join(script_dir, 'prompt_step1_analysis.txt')).format(job_description=job_description)
        analysis_raw = call_gemini(p1)
        analysis_json = clean_json(analysis_raw)
    except Exception as e:
        print(json.dumps({"error": "Step 1 Failed"}))
        sys.exit(1)

    # STEP 2: Question Generation
    try:
        p2 = load_file(os.path.join(script_dir, 'prompt_step2_generate.txt')).format(analysis_json=analysis_json)
        questions_raw = call_gemini(p2)
        questions_json = clean_json(questions_raw)
        
        # Output strictly JSON to Java
        print(questions_json) 
    except Exception as e:
        print(json.dumps({"error": "Step 2 Failed"}))
        sys.exit(1)

if __name__ == "__main__":
    main()