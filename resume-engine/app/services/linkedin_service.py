"""LinkedIn Profile Optimization Service."""
from app.services.llm_client import call_llm, parse_ai_json, load_prompt

def execute_linkedin_chain(linkedin_content: str, job_description: str) -> dict:
    if not linkedin_content.strip() or not job_description.strip():
        raise ValueError("Both LinkedIn content and target JD are required.")
    
    prompt_template = load_prompt("linkedin_optimizer", "prompt_linkedin.txt")
    prompt = prompt_template \
        .replace('{linkedin_content}', linkedin_content) \
        .replace('{job_description}', job_description)
    
    raw_json = call_llm(prompt, force_json=True)
    return parse_ai_json(raw_json)
