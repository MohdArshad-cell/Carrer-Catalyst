import pytest
from app.services.evaluate_service import execute_evaluate_chain

def test_evaluate_chain_scoring(mocker):
    # 1. Mock the API call to return a deterministic AI evaluation
    mocked_ai_response = {
        "hard_skills_evaluation": [
            {"skill_name": "Python", "is_found": True},
            {"skill_name": "React", "is_found": True},
            {"skill_name": "Docker", "is_found": False}, # 2/3 found = 66.6%
            {"skill_name": "AWS", "is_found": True}
        ], # 3/4 = 75%
        "soft_skills_evaluation": [
            {"skill_name": "Agile", "is_found": True},
            {"skill_name": "Mentorship", "is_found": False}
        ], # 1/2 = 50%
        "red_flags": [],
        "constructive_roasts": []
    }
    
    mocker.patch(
        "app.services.evaluate_service.call_gemini_structured_api", 
        return_value=mocked_ai_response
    )
    
    # Run the chain (the inputs don't matter because we mocked the API)
    result = execute_evaluate_chain("dummy resume", "dummy jd")
    
    # 75% Hard (weight 0.75) = 56.25
    # 50% Soft (weight 0.25) = 12.5
    # Total = 68.75 -> rounded to 69
    assert result["score"] == 69
    assert "Docker" in result["missing_keywords"]
    assert "Mentorship" in result["missing_keywords"]

def test_evaluate_chain_zero_division(mocker):
    # 2. Test edge case where AI finds no skills to evaluate (Empty arrays)
    mocked_ai_response = {
        "hard_skills_evaluation": [],
        "soft_skills_evaluation": [],
        "red_flags": [],
        "constructive_roasts": []
    }
    
    mocker.patch(
        "app.services.evaluate_service.call_gemini_structured_api", 
        return_value=mocked_ai_response
    )
    
    # Run the chain
    result = execute_evaluate_chain("dummy resume", "dummy jd")
    
    # Should safely return 100% instead of throwing ZeroDivisionError
    assert result["score"] == 100
