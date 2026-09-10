"""LinkedIn Profile Optimization Service."""
from app.services.llm_client import call_llm, parse_ai_json, load_prompt

def execute_linkedin_chain(linkedin_content: str, job_description: str, tone: str = "Professional") -> dict:
    if not linkedin_content.strip() or not job_description.strip():
        raise ValueError("Both LinkedIn content and target JD are required.")
    
    # Truncate content to avoid exceeding context limits for large PDFs
    truncated_linkedin = linkedin_content[:15000]
    
    prompt_template = load_prompt("linkedin_optimizer", "prompt_linkedin.txt")
    prompt = prompt_template \
        .replace('{linkedin_content}', truncated_linkedin) \
        .replace('{job_description}', job_description) \
        .replace('{tone}', tone)
    
    raw_json = call_llm(prompt, force_json=True)
    return parse_ai_json(raw_json)
