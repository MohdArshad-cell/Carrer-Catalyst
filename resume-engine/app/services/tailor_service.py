"""
Tailor Service — Career Catalyst Resume Engine.
Produces highly tailored resumes with zero LaTeX compilation errors.

Pipeline: Parse Resume → Analyze JD → Surgical Tailoring → Quality Guards → LaTeX PDF
"""
import json
import re
import hashlib
import base64
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor

from rapidfuzz import fuzz

from app.config import JD_CACHE_TTL
from app.services.llm_client import (
    call_llm, parse_ai_json, load_prompt, get_redis_client,
)
from app.generator import ResumeGenerator
from app.models import ResumeData, JobDescriptionAnalysis


# ==========================================
# 1. CORE UTILITIES
# ==========================================
def _load(filename: str) -> str:
    return load_prompt("tailor", filename)


def _hash_jd(jd_text: str) -> str:
    """Hash the FULL JD text (not just first 100 chars) for reliable caching."""
    return hashlib.sha256(jd_text.encode()).hexdigest()


# ==========================================
# 2. DATA QUALITY GUARDS
# ==========================================
def normalize_and_extract_metrics(text: str) -> set:
    """Extract all numeric values from text for comparison."""
    return set(re.findall(r'\b\d+(?:\.\d+)?\b', text))


def verify_metrics(baseline_text: str, tailored_data: dict) -> dict:
    """Detect and remove hallucinated metrics not present in the original resume."""
    baseline_numbers = normalize_and_extract_metrics(baseline_text)
    exp_list = tailored_data.get('experience', [])

    for exp in exp_list:
        valid_bullets = []
        for bullet in exp.get('descriptionPoints', []):
            bullet_nums = normalize_and_extract_metrics(str(bullet))
            # Flag ANY new number not in the original (stricter than before)
            suspicious_nums = {n for n in bullet_nums if n not in baseline_numbers}

            if suspicious_nums:
                print(f"⚠️ Shield Dropped Hallucinated Metric {suspicious_nums}: {str(bullet)[:60]}...")
            else:
                valid_bullets.append(bullet)
        exp['descriptionPoints'] = valid_bullets
    return tailored_data


def verify_bullet_count(original_json_str: str, tailored_data: dict) -> dict:
    """Ensure the AI doesn't shrink the resume by dropping bullet points."""
    original_data = json.loads(original_json_str)

    orig_exp = original_data.get('experience', [])
    tail_exp = tailored_data.get('experience', [])

    for i, orig_job in enumerate(orig_exp):
        if i < len(tail_exp):
            orig_bullets = orig_job.get('descriptionPoints', [])
            tail_bullets = tail_exp[i].get('descriptionPoints', [])

            if len(tail_bullets) < len(orig_bullets):
                deficit = len(orig_bullets) - len(tail_bullets)
                print(f"⚠️ AI dropped {deficit} bullets from {orig_job.get('company', 'Unknown')}. Restoring originals.")
                lost_bullets = orig_bullets[len(tail_bullets):]
                tail_exp[i]['descriptionPoints'] = tail_bullets + lost_bullets

    # Same check for projects
    orig_proj = original_data.get('projects', [])
    tail_proj = tailored_data.get('projects', [])

    for i, orig_p in enumerate(orig_proj):
        if i < len(tail_proj):
            orig_bullets = orig_p.get('descriptionPoints', [])
            tail_bullets = tail_proj[i].get('descriptionPoints', [])

            if len(tail_bullets) < len(orig_bullets):
                deficit = len(orig_bullets) - len(tail_bullets)
                print(f"⚠️ AI dropped {deficit} bullets from project {orig_p.get('name', 'Unknown')}. Restoring originals.")
                lost_bullets = orig_bullets[len(tail_bullets):]
                tail_proj[i]['descriptionPoints'] = tail_bullets + lost_bullets

    return tailored_data


def calculate_yoe(experience_list: list) -> str:
    """Calculate years of experience with improved date parsing for accurate tone detection."""
    total_months = 0
    now = datetime.now()

    for exp in experience_list:
        start = str(exp.get('startDate', '') or '')
        end = str(exp.get('endDate', '') or '')

        if not start:
            continue

        try:
            # Try parsing month+year formats first (e.g., "Jan 2020", "January 2020")
            start_date = _parse_date_string(start)
            if not start_date:
                continue

            if end and str(end).lower() not in ["present", "current", ""]:
                end_date = _parse_date_string(end)
                if not end_date:
                    end_date = now
            else:
                end_date = now

            months = (end_date.year - start_date.year) * 12 + (end_date.month - start_date.month)
            total_months += max(0, months)
        except Exception:
            continue

    total_years = total_months / 12

    if total_years <= 2:
        return "Ambitious, growth-oriented, and highly adaptable."
    elif total_years <= 7:
        return "Results-driven professional with proven technical execution."
    else:
        return "Strategic, high-level leader focused on architecture and business impact."


def _parse_date_string(date_str: str) -> datetime | None:
    """Parse various date formats: 'Jan 2020', 'January 2020', '01/2020', '2020'."""
    formats = [
        "%b %Y",      # Jan 2020
        "%B %Y",      # January 2020
        "%m/%Y",      # 01/2020
        "%m-%Y",      # 01-2020
        "%Y-%m",      # 2020-01
    ]
    for fmt in formats:
        try:
            return datetime.strptime(date_str.strip(), fmt)
        except ValueError:
            continue

    # Fallback: extract 4-digit year
    year_match = re.search(r'\d{4}', date_str)
    if year_match:
        return datetime(int(year_match.group()), 1, 1)
    return None


def find_missing_keywords(resume_string: str, skills_list: list) -> list:
    """Find JD skills that are missing from the resume, with improved matching."""
    missing = []
    resume_lower = resume_string.lower()

    for skill in skills_list:
        skill_str = str(skill).lower().strip()
        if not skill_str:
            continue

        # Exact substring match first (fastest)
        if skill_str in resume_lower:
            continue

        # Fuzzy match with higher threshold (90) to avoid false matches like Java↔JavaScript
        score = fuzz.partial_ratio(skill_str, resume_lower)

        if score < 90:
            missing.append(str(skill))

    return missing[:6]


def coerce_ints_to_strings(data):
    """Convert integers to strings for LaTeX compatibility, preserving floats."""
    if isinstance(data, dict):
        return {k: coerce_ints_to_strings(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [coerce_ints_to_strings(v) for v in data]
    elif isinstance(data, int) and not isinstance(data, bool):
        return str(data)
    return data


def clean_data_for_template(data):
    """
    Clean data for template rendering WITHOUT LaTeX escaping.
    LaTeX escaping is handled by the template's escape_tex filter (single pass).
    This only handles None stripping and n/a removal.
    """
    if data is None:
        return ""
    elif isinstance(data, dict):
        cleaned = {k: clean_data_for_template(v) for k, v in data.items()}
        if all(v == "" for v in cleaned.values()):
            return ""
        return cleaned
    elif isinstance(data, list):
        cleaned = [clean_data_for_template(v) for v in data]
        return [item for item in cleaned if item != ""]
    elif isinstance(data, str):
        if data.strip().lower() in ["none", "n/a", "null", ""]:
            return ""
        return data
    return data


# ==========================================
# 3. PIPELINE STEPS
# ==========================================
def parse_raw_text_to_json(raw_text: str) -> str:
    """Step 0: Parse raw resume text/LaTeX into structured JSON."""
    print("--- ⚡ Step 0: Gemini Smart Parsing ---")
    prompt0 = _load('prompt_step0_parser.txt').replace('{raw_resume}', raw_text)
    return call_llm(prompt0, force_json=True)


def check_semantic_cache(jd_text: str):
    """Check if a JD analysis is already cached in Redis."""
    redis = get_redis_client()
    if not redis:
        return None
    try:
        jd_hash = _hash_jd(jd_text)
        cached_result = redis.get(f"jd_cache:{jd_hash}")
        if cached_result:
            print("--- ⚡ Step 1: Cache Hit! Bypassing LLM. ---")
            return json.loads(cached_result)
    except Exception as e:
        print(f"Cache check failed: {e}")
    return None


def cache_jd_analysis(jd_text: str, jd_data: dict):
    """Cache JD analysis result in Redis."""
    redis = get_redis_client()
    if not redis:
        return
    try:
        jd_hash = _hash_jd(jd_text)
        redis.setex(f"jd_cache:{jd_hash}", JD_CACHE_TTL, json.dumps(jd_data))
    except Exception as e:
        print(f"Cache write failed: {e}")


# ==========================================
# 4. MAIN EXECUTION CHAIN
# ==========================================
def execute_tailor_chain(resume_input: str, job_description: str, template_name: str = "base_template") -> dict:
    """
    Execute the full tailoring pipeline:
    1. Parse resume (if raw text) + Analyze JD (in parallel)
    2. Surgical keyword injection + rewrite
    3. Quality guards (metric verification, bullet count)
    4. LaTeX generation
    """
    try:
        # ── STEP 0 & 1: PARALLEL PARSING (Resume + JD) ──
        print("--- ⚡ Running Step 0 (Resume) and Step 1 (JD) Concurrently ---")

        def parse_resume():
            try:
                res = json.loads(resume_input)
                print("--- 🧠 Input is already valid JSON ---")
                return res
            except json.JSONDecodeError:
                return json.loads(parse_raw_text_to_json(resume_input))

        def parse_jd():
            jd = check_semantic_cache(job_description)
            if jd:
                return jd
            prompt1 = _load('prompt_step1_jd_analysis.txt').replace('{job_description}', job_description)
            raw_jd_json = call_llm(prompt1, schema=JobDescriptionAnalysis)
            jd = json.loads(raw_jd_json)
            cache_jd_analysis(job_description, jd)
            return jd

        with ThreadPoolExecutor(max_workers=2) as executor:
            future_resume = executor.submit(parse_resume)
            future_jd = executor.submit(parse_jd)

            full_resume_data = future_resume.result()
            jd_data = future_jd.result()

        # ── PREPARE IMMUTABLE vs MUTABLE SECTIONS ──
        immutables = {
            "personal_info": full_resume_data.get("personal_info", {}),
            "education": full_resume_data.get("education", []),
            "achievements": full_resume_data.get("achievements", []),
            "certifications": full_resume_data.get("certifications", [])
        }
        mutables = {k: full_resume_data.get(k, []) for k in ["summary", "skills", "experience", "projects"]}
        mutable_json_str = json.dumps(mutables, indent=2)

        # ── ANALYZE SKILL GAPS ──
        target_title = jd_data.get("target_job_title", "Software Engineer")
        all_jd_skills = jd_data.get("must_have_tech_skills", []) + jd_data.get("sdlc_and_practices", [])
        missing_skills = find_missing_keywords(json.dumps(full_resume_data), all_jd_skills)
        missing_skills_str = ", ".join(missing_skills) if missing_skills else "None"

        bonus_skills = find_missing_keywords(json.dumps(full_resume_data), jd_data.get("good_to_have_skills", []))
        bonus_skills_str = ", ".join(bonus_skills) if bonus_skills else "None"

        print(f"🎯 Title: {target_title} | 🛠️ Missing: {missing_skills_str} | 🎁 Bonus: {bonus_skills_str}")

        # ── BUILD BULLET COUNT CONSTRAINT ──
        exp_bullet_counts = [len(e.get('descriptionPoints', [])) for e in mutables.get('experience', [])]
        proj_bullet_counts = [len(p.get('descriptionPoints', [])) for p in mutables.get('projects', [])]
        bullet_constraint = (
            f"EXPERIENCE bullet counts per job (in order): {exp_bullet_counts}. "
            f"PROJECT bullet counts per project (in order): {proj_bullet_counts}. "
            f"You MUST output EXACTLY these counts."
        )

        # ── STEP 2: SURGICAL TAILORING ──
        print("--- ⚙️ Tailoring Step 2: Surgical Injection ---")
        tone = calculate_yoe(full_resume_data.get("experience", []))

        soft_skills_str = ", ".join(jd_data.get("soft_skills", [])) if jd_data.get("soft_skills") else "None"
        sdlc_str = ", ".join(jd_data.get("sdlc_and_practices", [])) if jd_data.get("sdlc_and_practices") else "None"
        verbs_str = ", ".join(jd_data.get("action_verbs", [])) if jd_data.get("action_verbs") else "None"

        prompt2 = _load('prompt_step2_planning.txt') \
            .replace('{target_job_title}', target_title) \
            .replace('{tone}', tone) \
            .replace('{missing_skills}', missing_skills_str) \
            .replace('{bonus_skills}', bonus_skills_str) \
            .replace('{soft_skills}', soft_skills_str) \
            .replace('{sdlc_and_practices}', sdlc_str) \
            .replace('{action_verbs}', verbs_str) \
            .replace('{bullet_count_constraint}', bullet_constraint) \
            .replace('{resume_text}', mutable_json_str)

        raw_tailored_json = call_llm(prompt2, schema=ResumeData)
        tailored_data = json.loads(raw_tailored_json)

        # ── STEP 3: QUALITY GUARDS ──
        print("--- 🔒 Running Quality Guards: Metric Lock + Bullet Count Shield ---")
        cleaned_ai_data = verify_metrics(mutable_json_str, tailored_data)
        cleaned_ai_data = verify_bullet_count(mutable_json_str, cleaned_ai_data)

        # Merge immutable sections back
        cleaned_ai_data.update(immutables)

        # ── STEP 4: VALIDATION & PDF GENERATION ──
        try:
            cleaned_ai_data = coerce_ints_to_strings(cleaned_ai_data)
            validated_resume = ResumeData(**cleaned_ai_data)
            # clean_data_for_template handles None/n/a but NOT LaTeX escaping
            # LaTeX escaping is done ONCE by the template's escape_tex filter
            clean_data = clean_data_for_template(validated_resume.model_dump())
        except Exception as pydantic_err:
            print(f"❌ Pydantic Validation Error: {pydantic_err}")
            raise RuntimeError("Data Shield failure: Incompatible resume structure generated.") from pydantic_err

        print("--- ⚙️ Tailoring Step 3: Generating LaTeX and PDF ---")
        generator = ResumeGenerator()
        gen_result = generator.generate(template_name, clean_data)

        pdf_path = gen_result["pdf_path"]
        tex_path = pdf_path.replace(".pdf", ".tex")

        with open(pdf_path, "rb") as f:
            pdf_b64 = base64.b64encode(f.read()).decode('utf-8')
        with open(tex_path, "r", encoding="utf-8") as f:
            tex_content = f.read()

        return {
            "latex_code": tex_content,
            "pdf_base64": pdf_b64,
            "session_dir": gen_result["session_dir"],
            "targeted_skills": missing_skills
        }

    except Exception as e:
        raise RuntimeError(f"Tailoring Chain failed: {str(e)}") from e