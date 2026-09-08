"""Career Roadmap Generation Service."""
from app.services.llm_client import call_llm, parse_ai_json, load_prompt

def execute_roadmap_chain(resume_text: str, target_goal: str) -> dict:
    if not resume_text.strip() or not target_goal.strip():
        raise ValueError("Both resume and target goal are required.")
    
    prompt_template = load_prompt("career_roadmap", "prompt_roadmap.txt")
    prompt = prompt_template \
        .replace('{resume_text}', resume_text) \
        .replace('{target_goal}', target_goal)
    
    raw_json = call_llm(prompt, force_json=True)
    return parse_ai_json(raw_json)
