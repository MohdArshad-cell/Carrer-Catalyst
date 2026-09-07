"""
Evaluate Service — Career Catalyst Resume Engine.
Performs ATS scoring with deterministic math-based scoring (not LLM-scored).
"""
import json
from datetime import datetime
from typing import List

from pydantic import BaseModel, Field

from app.services.llm_client import call_llm_structured, load_prompt


# ==========================================
# 1. AI DATA EXTRACTION SCHEMA (NO SCORING)
# ==========================================
class RoastDetail(BaseModel):
    weak_bullet: str = Field(..., description="The exact weak, generic bullet point quoted from the resume.")
    critique: str = Field(..., description="Brutally honest reason why a recruiter would reject this.")
    rewrite: str = Field(..., description="A hard-hitting, metric-driven AI rewrite incorporating missing keywords.")

class SkillEvaluation(BaseModel):
    skill_name: str = Field(..., description="The exact noun-based skill from the JD (e.g., 'Spring Boot', 'Redis'). NO VERBS.")
    is_found: bool = Field(..., description="True if the skill OR a direct semantic equivalent (e.g., 'React' for 'React.js') is explicitly in the resume.")

class AIResumeExtractionSchema(BaseModel):
    hard_skills_evaluation: List[SkillEvaluation] = Field(..., description="Evaluation of technical tools, frameworks, and hard skills.")
    soft_skills_evaluation: List[SkillEvaluation] = Field(..., description="Evaluation of methodologies (e.g., Agile) and soft skills.")
    red_flags: List[str] = Field(..., description="Critical dealbreakers.")
    constructive_roasts: List[RoastDetail] = Field(..., description="3 specific roasts targeting weak bullet points.")


# ==========================================
# 2. CORE EXECUTION CHAIN
# ==========================================
def execute_evaluate_chain(resume_text: str, job_description: str) -> dict:
    try:
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
        missing_hard = [skill["skill_name"] for skill in hard_skills if not skill["is_found"]]
        missing_soft = [skill["skill_name"] for skill in soft_skills if not skill["is_found"]]

        # Calculate True Match Score Mathematically
        hard_total = len(hard_skills)
        soft_total = len(soft_skills)

        hard_score = ((hard_total - len(missing_hard)) / hard_total * 100) if hard_total > 0 else 100
        soft_score = ((soft_total - len(missing_soft)) / soft_total * 100) if soft_total > 0 else 100

        # Weighted calculation (75% Hard / 25% Soft)
        final_score = int(round((hard_score * 0.75) + (soft_score * 0.25)))

        print(f"--- ✅ Evaluation Complete. Semantic ATS Score: {final_score}% ---")

        return {
            "score": final_score,
            "red_flags": ai_data.get("red_flags", []),
            "missing_keywords": missing_hard + missing_soft,
            "constructive_roasts": ai_data.get("constructive_roasts", [])
        }

    except Exception as e:
        print(f"❌ ATS Evaluation Pipeline Halted: {e}")
        raise RuntimeError(f"Service Execution Failure: {str(e)}") from e