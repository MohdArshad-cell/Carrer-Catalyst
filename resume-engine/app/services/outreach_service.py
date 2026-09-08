"""Cold Outreach and Networking Service."""
from app.services.llm_client import call_llm, parse_ai_json, load_prompt

def execute_outreach_chain(resume_text: str, job_description: str) -> dict:
    if not resume_text.strip() or not job_description.strip():
        raise ValueError("Both resume and target JD/Company are required.")
    
    prompt_template = load_prompt("cold_outreach", "prompt_outreach.txt")
    prompt = prompt_template \
        .replace('{resume_text}', resume_text) \
        .replace('{job_description}', job_description)
    
    raw_json = call_llm(prompt, force_json=True)
    return parse_ai_json(raw_json)
