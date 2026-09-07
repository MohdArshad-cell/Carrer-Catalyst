"""
Interview Prep Service — Career Catalyst Resume Engine.
Generates tailored interview questions with model answers in a single LLM call.
"""
from app.services.llm_client import call_llm, parse_ai_json, load_prompt


# ==========================================
# CORE EXECUTION CHAIN (MERGED: 2-step → 1-step)
# ==========================================
def execute_interview_chain(job_description: str) -> dict:
    """
    Executes a single-pass AI chain to analyze a JD and generate
    10 rigorous interview questions with model answers.
    """
    if not job_description or not job_description.strip():
        raise ValueError("Job description is empty.")

    try:
        print("--- 🧠 Interview Prep: Single-Pass Analysis + Generation ---")

        prompt_template = load_prompt("interview_prep", "prompt_interview.txt")
        prompt = prompt_template.replace('{job_description}', job_description)

        raw_json = call_llm(prompt, force_json=True)
        result = parse_ai_json(raw_json)

        print("--- ✅ Interview Prep Generation Successful ---")
        return result

    except Exception as e:
        print(f"❌ Interview Prep Chain Error: {e}")
        raise RuntimeError(f"Interview Generation Chain Failed: {str(e)}") from e