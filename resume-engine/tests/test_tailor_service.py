import pytest
import json
from app.services.tailor_service import sanitize_for_latex, extract_and_parse_ai_json, verify_metrics, calculate_yoe, find_missing_keywords

def test_sanitize_for_latex_edge_cases():
    # 1. LaTeX control characters
    bad_string = "I used C++ \\ C# and scored ~100% & saved $500, which made me #1. My path: {usr/bin/^} _test_"
    sanitized = sanitize_for_latex(bad_string)
    
    assert "\\textbackslash{}" in sanitized
    assert "\\textasciitilde{}" in sanitized
    assert "\\%" in sanitized
    assert "\\$" in sanitized
    assert "\\#" in sanitized
    assert "\\{" in sanitized
    assert "\\}" in sanitized
    assert "\\textasciicircum{}" in sanitized
    assert "\\_" in sanitized

def test_sanitize_for_latex_with_markdown_bold():
    # 2. Bold text isolation
    input_str = "Reduced latency by **35%** using **C++ & C#**"
    sanitized = sanitize_for_latex(input_str)
    
    # Should wrap the inner part in \textbf{} and escape the % and &
    assert "\\textbf{35\\%}" in sanitized
    assert "\\textbf{C++ \\& C\\#}" in sanitized
    # Should not contain raw **
    assert "**" not in sanitized

def test_extract_and_parse_ai_json_malformed():
    # 3. AI outputs markdown backticks around JSON
    malformed_json = "```json\n{\n  \"summary\": \"Great leader.\"\n}\n```"
    parsed = extract_and_parse_ai_json(malformed_json)
    assert parsed["summary"] == "Great leader."

def test_verify_metrics_drops_hallucinated_numbers():
    # 4. Metric verification (Number Shield)
    original_resume_json = json.dumps({
        "experience": [
            {
                "company": "Tech Corp",
                "descriptionPoints": ["Saved $500 by writing code."]
            }
        ]
    })
    
    tailored_data_from_ai = {
        "experience": [
            {
                "company": "Tech Corp",
                # The AI hallcuinated "9000" and "500%" which weren't in the original text
                "descriptionPoints": ["Saved $500 by writing code, increasing efficiency by 500% and serving 9000 users."]
            }
        ]
    }
    
    verified_data = verify_metrics(original_resume_json, tailored_data_from_ai)
    # The shield should drop the hallucinated bullet and replace it with nothing or drop it
    # Because there's only 1 bullet, the descriptionPoints should become empty
    assert len(verified_data["experience"][0]["descriptionPoints"]) == 0

def test_calculate_yoe():
    # Junior: < 2 years
    exp_junior = [{"startDate": "Jan 2025", "endDate": "Present"}]
    assert "Ambitious, growth-oriented" in calculate_yoe(exp_junior)
    
    # Mid: 3-7 years
    exp_mid = [{"startDate": "2018", "endDate": "2022"}]
    assert "Results-driven professional" in calculate_yoe(exp_mid)
    
    # Senior: 8+ years
    exp_senior = [{"startDate": "2010", "endDate": "2020"}, {"startDate": "2020", "endDate": "Present"}]
    assert "Strategic, high-level leader" in calculate_yoe(exp_senior)

def test_find_missing_keywords_fuzzy():
    # Missing words
    skills = ["React", "Amazon Web Services", "Node.js"]
    resume = "I use React and AWS and NodeJS for backend."
    
    missing = find_missing_keywords(resume, skills)
    
    # "React" is an exact match.
    # "AWS" != "Amazon Web Services", so it should be flagged as missing since they didn't write it out.
    # Wait, our rapidfuzz checks if "Amazon Web Services" is IN the resume. It's not, so missing.
    # "NodeJS" fuzzy matches "Node.js" with high score, so it shouldn't be missing.
    
    assert "React" not in missing
    assert "Node.js" not in missing
    assert "Amazon Web Services" in missing
