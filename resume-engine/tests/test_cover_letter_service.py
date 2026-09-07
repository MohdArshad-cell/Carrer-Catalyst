import pytest
from app.services.cover_letter_service import execute_cover_letter_chain
import base64

def test_cover_letter_generation(mocker):
    """Test that the cover letter chain correctly parses data and generates a PDF."""
    
    mock_llm_data = {
        "candidate_name": "Mohammad Ibrahim Saleem",
        "candidate_contact": {
            "phone": "+1 7138537974",
            "email": "test@gmail.com",
            "linkedin": "linkedin.com/in/test",
            "address": "Texas 77494"
        },
        "date": "August 23, 2026",
        "salutation": "Dear Hiring Manager,",
        "opening_hook": "Watching the rapid evolution of threat landscapes...",
        "body_paragraphs": [
            "In my recent work at AT&T...",
            "Beyond these enterprise experiences..."
        ],
        "call_to_action": "I am eager to bring my analytical background...",
        "sign_off": "Yours Faithfully,"
    }

    mocker.patch(
        "app.services.cover_letter_service.call_llm_structured",
        return_value=mock_llm_data
    )

    result = execute_cover_letter_chain("dummy resume", "dummy jd")

    assert "pdf_base64" in result
    assert "latex_code" in result
    assert "session_dir" in result
    
    # Verify the generated LaTeX contains injected data
    tex_code = result["latex_code"]
    assert "Mohammad Ibrahim Saleem" in tex_code
    assert "test@gmail.com" in tex_code
    assert "August 23, 2026" in tex_code
    assert "Watching the rapid evolution of threat landscapes..." in tex_code
