"""
Cover Letter Service — Career Catalyst Resume Engine.
Generates high-impact, professionally formatted cover letters in a single LLM call.
"""
from datetime import datetime

from app.services.llm_client import call_llm, load_prompt


# ==========================================
# CORE EXECUTION CHAIN (MERGED: 2-step → 1-step)
# ==========================================
def execute_cover_letter_chain(resume_text: str, job_description: str) -> str:
    """
    Executes a single-pass AI chain to generate a premium, highly targeted cover letter.
    Merges the old 2-step (planning → generation) into 1 optimized call.
    """
    try:
        print("--- 🧠 Cover Letter: Single-Pass Premium Generation ---")

        prompt_template = load_prompt("cover_letter", "prompt_cover_letter.txt")
        today_date = datetime.now().strftime("%B %d, %Y")

        prompt = prompt_template \
            .replace('{resume_text}', resume_text) \
            .replace('{job_description}', job_description) \
            .replace('{current_date}', today_date)

        # Single LLM call — force_json=False because output is plain text
        cover_letter_text = call_llm(prompt, force_json=False).strip()

        # Strip any markdown code fences the model may have wrapped around the output
        MARKDOWN_BLOCK = "`" * 3
        if cover_letter_text.startswith(MARKDOWN_BLOCK):
            lines = cover_letter_text.split("\n")
            if lines[0].startswith(MARKDOWN_BLOCK):
                lines = lines[1:]
            if lines and lines[-1].startswith(MARKDOWN_BLOCK):
                lines = lines[:-1]
            cover_letter_text = "\n".join(lines).strip()

        print("--- ✅ Cover Letter Generation Successful ---")
        return cover_letter_text

    except Exception as e:
        print(f"❌ Cover Letter Chain Error: {e}")
        raise RuntimeError(f"Failed to generate cover letter: {str(e)}") from e