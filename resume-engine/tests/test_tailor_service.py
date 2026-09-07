import pytest
import json
from app.services.tailor_service import (
    clean_data_for_template, verify_metrics, calculate_yoe, find_missing_keywords
)
from app.services.llm_client import parse_ai_json
from app.generator import escape_latex


def test_escape_latex_edge_cases():
    """Test that escape_latex handles LaTeX control characters correctly."""
    bad_string = "I used C++ & scored ~100% & saved $500, which made me #1. My_test"
    sanitized = escape_latex(bad_string)

    assert "\\%" in sanitized
    assert "\\$" in sanitized
    assert "\\#" in sanitized
    assert "\\textasciitilde{}" in sanitized
    assert "\\_" in sanitized


def test_escape_latex_with_markdown_bold():
    """Test that **bold** markers are converted to \\textbf{} with proper escaping."""
    input_str = "Reduced latency by **35%** using **C++ & C#**"
    sanitized = escape_latex(input_str)

    # Should wrap the inner part in \textbf{} and escape the % and &
    assert "\\textbf{35\\%}" in sanitized
    assert "\\textbf{C++ \\& C\\#}" in sanitized
    # Should not contain raw **
    assert "**" not in sanitized


def test_parse_ai_json_malformed():
    """Test that parse_ai_json strips markdown backticks from AI output."""
    malformed_json = "```json\n{\n  \"summary\": \"Great leader.\"\n}\n```"
    parsed = parse_ai_json(malformed_json)
    assert parsed["summary"] == "Great leader."


def test_verify_metrics_drops_hallucinated_numbers():
    """Test that the metric shield removes fabricated numbers."""
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
                # The AI hallucinated "9000" and "500%" which weren't in the original text
                "descriptionPoints": ["Saved $500 by writing code, increasing efficiency by 500% and serving 9000 users."]
            }
        ]
    }

    verified_data = verify_metrics(original_resume_json, tailored_data_from_ai)
    # The shield should drop the hallucinated bullet (9000 is not in original)
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
    skills = ["React", "Amazon Web Services", "Node.js"]
    resume = "I use React and AWS and NodeJS for backend."

    missing = find_missing_keywords(resume, skills)

    # "React" is an exact match → not missing
    assert "React" not in missing
    # "Amazon Web Services" is NOT in the resume text → missing
    assert "Amazon Web Services" in missing
    # With the stricter threshold (90), "NodeJS" vs "Node.js" may not match
    # This is intentional to prevent false matches like "Java" ↔ "JavaScript"

    # Test exact match works perfectly
    skills2 = ["Python", "Django"]
    resume2 = "I use Python and Django for web development."
    missing2 = find_missing_keywords(resume2, skills2)
    assert len(missing2) == 0  # Both are exact matches



def test_clean_data_for_template():
    """Test that clean_data_for_template strips None/n/a without escaping LaTeX."""
    data = {
        "name": "John & Jane",
        "summary": None,
        "skills": ["Python", "N/A", ""],
        "note": "100% match"
    }
    cleaned = clean_data_for_template(data)

    # None → ""
    assert cleaned["summary"] == ""
    # "N/A" and "" stripped from list
    assert cleaned["skills"] == ["Python"]
    # LaTeX chars should NOT be escaped here (that's the template's job)
    assert cleaned["name"] == "John & Jane"
    assert cleaned["note"] == "100% match"
