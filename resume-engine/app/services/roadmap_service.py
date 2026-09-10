"""Career Roadmap Generation Service."""
from app.services.llm_client import call_llm, parse_ai_json, load_prompt

def execute_roadmap_chain(resume_text: str, target_goal: str, timeframe: str = "12 Months") -> dict:
    if not resume_text.strip() or not target_goal.strip():
        raise ValueError("Both resume and target goal are required.")
    
    # Truncate content to avoid exceeding context limits for large PDFs
    truncated_resume = resume_text[:15000]
    
    prompt_template = load_prompt("career_roadmap", "prompt_roadmap.txt")
    prompt = prompt_template \
        .replace('{resume_text}', truncated_resume) \
        .replace('{target_goal}', target_goal) \
        .replace('{timeframe}', timeframe)
    
    raw_json = call_llm(prompt, force_json=True)
    return parse_ai_json(raw_json)
