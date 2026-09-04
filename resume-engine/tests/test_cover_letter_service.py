import pytest
from app.services.cover_letter_service import execute_cover_letter_chain

def test_cover_letter_markdown_stripping(mocker):
    # 1. Mock the first planning step to return a dummy plan
    mocker.patch(
        "app.services.cover_letter_service.extract_and_parse_ai_json",
        return_value={"strategy": "Be bold."}
    )
    
    # 2. Mock the second generation step to return text wrapped in markdown
    # The AI often does this despite being asked not to
    malformed_output = "```\nDear Hiring Manager,\n\nI am great.\n\nSincerely,\nMe\n```"
    
    # Patch call_gemini_api for both calls
    # Call 1 returns JSON string (which we mock-parse above anyway)
    # Call 2 returns the malformed output
    mocker.patch(
        "app.services.cover_letter_service.call_gemini_api",
        side_effect=["{}", malformed_output]
    )
    
    result = execute_cover_letter_chain("dummy resume", "dummy jd")
    
    # The engine should have stripped the ``` marks
    assert "```" not in result
    assert result.startswith("Dear Hiring Manager")
    assert result.endswith("Me")
