"""
Cover Letter Service — Career Catalyst Resume Engine.
Generates high-impact, professionally formatted cover letter PDFs using LaTeX.
"""
import base64
from datetime import datetime

from app.services.llm_client import call_llm, load_prompt, parse_ai_json
from app.generator import ResumeGenerator
from app.models import CoverLetterData
from app.services.tailor_service import clean_data_for_template


# ==========================================
# CORE EXECUTION CHAIN (MERGED: 2-step → 1-step)
# ==========================================
def execute_cover_letter_chain(resume_text: str, job_description: str) -> dict:
    """
    Executes a single-pass AI chain to generate a premium, highly targeted cover letter,
    and compiles it into a LaTeX PDF.
    """
    try:
        print("--- 🧠 Cover Letter: Structured Data Extraction ---")

        prompt_template = load_prompt("cover_letter", "prompt_cover_letter.txt")
        today_date = datetime.now().strftime("%B %d, %Y")

        prompt = prompt_template \
            .replace('{resume_text}', resume_text) \
            .replace('{job_description}', job_description) \
            .replace('{current_date}', today_date)

        # Call LLM with the new CoverLetterData schema injected into the prompt
        raw_response = call_llm(
            prompt,
            schema=CoverLetterData,
            force_json=True,
            temperature=0.3,
            max_output_tokens=4096
        )

        # Parse the JSON response manually to bypass the SDK's schema bugs
        raw_data = parse_ai_json(raw_response)

        print("--- ⚙️ Cover Letter: Generating PDF ---")
        
        # Clean data (remove None/null/N/A without LaTeX escaping)
        clean_data = clean_data_for_template(raw_data)

        # Generate the PDF
        generator = ResumeGenerator()
        gen_result = generator.generate("cover_letter", clean_data)

        pdf_path = gen_result["pdf_path"]
        tex_path = pdf_path.replace(".pdf", ".tex")

        with open(pdf_path, "rb") as f:
            pdf_b64 = base64.b64encode(f.read()).decode('utf-8')
        with open(tex_path, "r", encoding="utf-8") as f:
            tex_content = f.read()

        print("--- ✅ Cover Letter Generation Successful ---")
        
        return {
            "latex_code": tex_content,
            "pdf_base64": pdf_b64,
            "session_dir": gen_result["session_dir"]
        }

    except Exception as e:
        print(f"❌ Cover Letter Chain Error: {e}")
        raise RuntimeError(f"Failed to generate cover letter PDF: {str(e)}") from e