"""
Evaluate Service — Career Catalyst Resume Engine.
Performs ATS scoring with deterministic math-based scoring (not LLM-scored).
"""
import json
import hashlib
from datetime import datetime
from typing import List

from pydantic import BaseModel, Field

from app.services.llm_client import call_llm_structured, load_prompt, get_redis_client


# ==========================================
# 1. AI DATA EXTRACTION SCHEMA (NO SCORING)
# ==========================================
class RoastDetail(BaseModel):
    weak_bullet: str = Field(..., description="The exact weak, generic bullet point quoted from the resume.")
    critique: str = Field(..., description="Brutally honest reason why a recruiter would reject this.")
    rewrite: str = Field(..., description="A hard-hitting, metric-driven AI rewrite incorporating missing keywords.")

class SkillEvaluation(BaseModel):
    skill_name: str = Field(..., description="The exact noun-based skill extracted FROM THE JOB DESCRIPTION (e.g., 'Spring Boot', 'Redis'). NO VERBS.")
    is_found: bool = Field(..., description="True ONLY IF the skill OR a direct semantic equivalent (e.g., 'React' for 'React.js') is explicitly in the resume. False if missing.")

class AIResumeExtractionSchema(BaseModel):
    hard_skills_evaluation: List[SkillEvaluation] = Field(..., description="Evaluation of technical tools, frameworks, and hard skills REQUIRED BY THE JD.")
    soft_skills_evaluation: List[SkillEvaluation] = Field(..., description="Evaluation of methodologies (e.g., Agile) and soft skills REQUIRED BY THE JD.")
    red_flags: List[str] = Field(..., description="Critical dealbreakers.")
    constructive_roasts: List[RoastDetail] = Field(..., description="3 specific roasts targeting weak bullet points.")
    metrics_score: int = Field(..., description="Score out of 100 on how well the resume uses quantifiable metrics and data.")
    brevity_score: int = Field(..., description="Score out of 100 on brevity, conciseness, and readability.")
    action_verbs_score: int = Field(..., description="Score out of 100 on the use of strong, active verbs vs passive language.")


# ==========================================
# 2. CORE EXECUTION CHAIN
# ==========================================
def _hash_eval(resume: str, jd: str) -> str:
    combined = f"{resume[:500]}||{jd[:500]}"
    return hashlib.sha256(combined.encode()).hexdigest()

def execute_evaluate_chain(resume_text: str, job_description: str) -> dict:
    try:
        print("--- 🧠 ATS Evaluator: Checking Cache ---")
        eval_hash = _hash_eval(resume_text, job_description)
        redis_client = get_redis_client()
        
        if redis_client:
            cached = redis_client.get(f"eval_cache:{eval_hash}")
            if cached:
                print("--- ⚡ ATS Evaluator: Cache Hit! Returning cached result ---")
                return json.loads(cached)

        print("--- 🧠 ATS Evaluator: Extracting Semantic Data ---")
        prompt_template = load_prompt("evaluate", "prompt_evaluate.txt")
        today_date = datetime.now().strftime("%B %Y")

        prompt = prompt_template.replace('{resume_text}', resume_text) \
                                .replace('{job_description}', job_description) \
                                .replace('{current_date}', today_date)

        # Single LLM call with structured output
        ai_data = call_llm_structured(
            prompt,
            response_schema=AIResumeExtractionSchema,
            temperature=0.0,
            max_output_tokens=4096,
        )

        hard_skills = ai_data.get("hard_skills_evaluation", [])
        soft_skills = ai_data.get("soft_skills_evaluation", [])

        # Extract Missing Keywords (Where is_found == False)
        missing_hard = [skill.get("skill_name", "Unknown") for skill in hard_skills if not skill.get("is_found", False)]
        missing_soft = [skill.get("skill_name", "Unknown") for skill in soft_skills if not skill.get("is_found", False)]

        # Calculate True Match Score Mathematically
        hard_total = len(hard_skills)
        soft_total = len(soft_skills)

        hard_score = ((hard_total - len(missing_hard)) / hard_total * 100) if hard_total > 0 else 100
        soft_score = ((soft_total - len(missing_soft)) / soft_total * 100) if soft_total > 0 else 100

        # Weighted calculation (75% Hard / 25% Soft)
        final_score = int(round((hard_score * 0.75) + (soft_score * 0.25)))

        print(f"--- ✅ Evaluation Complete. Semantic ATS Score: {final_score}% ---")

        result = {
            "score": final_score,
            "dimension_scores": {
                "keyword_match": final_score,
                "metrics": ai_data.get("metrics_score", 50),
                "brevity": ai_data.get("brevity_score", 50),
                "action_verbs": ai_data.get("action_verbs_score", 50)
            },
            "red_flags": ai_data.get("red_flags", []),
            "missing_keywords": missing_hard + missing_soft,
            "constructive_roasts": ai_data.get("constructive_roasts", [])
        }
        
        if redis_client:
            redis_client.setex(f"eval_cache:{eval_hash}", 3600, json.dumps(result))
            
        return result

    except Exception as e:
        print(f"❌ ATS Evaluation Pipeline Halted: {e}")
        raise RuntimeError(f"Service Execution Failure: {str(e)}") from e