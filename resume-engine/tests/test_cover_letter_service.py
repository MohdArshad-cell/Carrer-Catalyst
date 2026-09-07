import pytest
from app.services.cover_letter_service import execute_cover_letter_chain

def test_cover_letter_markdown_stripping(mocker):
    """Test that the service strips markdown code fences from AI output."""
    # The merged 1-step service only calls call_llm once
    malformed_output = "```\nDear Hiring Manager,\n\nI am great.\n\nSincerely,\nMe\n```"

    mocker.patch(
        "app.services.cover_letter_service.call_llm",
        return_value=malformed_output
    )

    result = execute_cover_letter_chain("dummy resume", "dummy jd")

    # The engine should have stripped the ``` marks
    assert "```" not in result
    assert result.startswith("Dear Hiring Manager")
    assert result.endswith("Me")


def test_cover_letter_clean_output(mocker):
    """Test that clean output passes through unchanged."""
    clean_output = "Dear Hiring Manager,\n\nI bring 5 years of experience.\n\nSincerely,\nJohn Doe"

    mocker.patch(
        "app.services.cover_letter_service.call_llm",
        return_value=clean_output
    )

    result = execute_cover_letter_chain("dummy resume", "dummy jd")
    assert result == clean_output
