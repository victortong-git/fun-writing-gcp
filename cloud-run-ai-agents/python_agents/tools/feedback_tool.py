"""
Feedback Analysis Tool - Analyzes student writing and provides detailed feedback
"""

import google.generativeai as genai
import os
import json
from datetime import datetime
from .content_safety_tool import check_content_safety


def analyze_student_writing(
    student_writing: str,
    original_prompt: str,
    age_group: str,
    submission_id: str,
    user_id: str
) -> dict:
    """
    Analyze student writing and provide comprehensive feedback using Gemini.

    This tool performs a complete writing analysis including safety validation,
    evaluation across multiple dimensions, and generation of detailed,
    age-appropriate feedback.

    Args:
        student_writing: The student's submitted text
        original_prompt: The writing prompt that was given to the student
        age_group: Student's age group (e.g., "7-11", "11-14", "14-18")
        submission_id: Unique identifier for this submission
        user_id: User identifier

    Returns:
        dict: Analysis result containing:
            - success (bool): Whether analysis completed successfully
            - score (int): Total score out of 100
            - feedback (dict): Detailed feedback across all dimensions
            - safetyCheck (dict): Content safety validation results
            - error (str|None): Error message if analysis failed
    """
    try:
        print(f"\n📊 [{datetime.utcnow().isoformat()}] Writing Analysis")
        print(f"   Submission: {submission_id}")
        print(f"   User: {user_id}, Age Group: {age_group}")
        print(f"   Writing length: {len(student_writing)} characters")

        # Step 1: Content safety check
        print(f"\n🛡️  Step 1: Content Safety Check")
        safety_result = check_content_safety(student_writing, age_group, user_id)

        # If content is not safe, return early with alert
        if not safety_result["isSafe"]:
            print(f"   🚨 Content blocked: {safety_result['riskLevel']} risk")
            return {
                "success": False,
                "blocked": True,
                "safetyCheck": safety_result,
                "alertMessage": safety_result.get("alertMessage"),
                "recommendation": safety_result.get("recommendation")
            }

        # Step 2: Evaluate writing with Gemini
        print(f"\n📝 Step 2: Evaluating Writing")

        api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise Exception("No API key found for Gemini")

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(
            "gemini-2.5-flash",
            system_instruction="""You are an encouraging educational AI evaluating student writing.
Provide comprehensive, detailed feedback that is constructive and age-appropriate."""
        )

        # Create evaluation prompt
        evaluation_prompt = f"""Evaluate this student's writing (Age: {age_group}).

**Original Writing Prompt**:
"{original_prompt}"

**Student Writing**:
"{student_writing}"

Evaluate across 4 dimensions (each out of 25 points, total 100):

**1. GRAMMAR & SENTENCE STRUCTURE (0-25 points)**
- Correct sentence structure (subject, verb, object)
- Appropriate use of punctuation
- Varied sentence types and lengths
- Age-appropriate complexity

**2. SPELLING & VOCABULARY (0-25 points)**
- Spelling accuracy of common words
- Spelling accuracy of challenging words
- Overall clarity despite any errors
- Age-appropriate vocabulary usage

**3. RELEVANCE & CONTENT (0-25 points)**
- Addresses the core topic of the prompt
- Includes required elements or instructions
- Stays on topic throughout
- Shows understanding of the prompt's intent

**4. CREATIVITY & ORIGINALITY (0-25 points)**
- Original ideas and unique perspectives
- Imaginative descriptions and imagery
- Creative problem-solving in the narrative
- Unexpected or interesting twists
- Use of descriptive and figurative language

Respond with ONLY valid JSON in this EXACT format:
{{
  "grammar": {{
    "score": 20,
    "issues": ["specific issue 1", "specific issue 2"],
    "feedback": "detailed feedback on grammar and sentence structure"
  }},
  "spelling": {{
    "score": 22,
    "misspelledWords": ["word1", "word2"],
    "feedback": "detailed feedback on spelling and vocabulary"
  }},
  "relevance": {{
    "score": 18,
    "addressed": ["aspect 1 they covered", "aspect 2 they covered"],
    "missing": ["aspect they missed"],
    "feedback": "detailed feedback on how well they addressed the prompt"
  }},
  "creativity": {{
    "score": 19,
    "creativeElements": ["creative element 1", "creative element 2"],
    "feedback": "detailed feedback on creativity and originality"
  }},
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "areasForImprovement": ["area 1", "area 2"],
  "generalComment": "encouraging overall comment on their writing",
  "nextSteps": ["actionable step 1", "actionable step 2", "actionable step 3"]
}}

Be specific, encouraging, and age-appropriate in all feedback."""

        # Call Gemini for evaluation
        response = model.generate_content(evaluation_prompt)
        response_text = response.text.strip()

        # Clean up markdown code blocks
        if response_text.startswith('```json'):
            response_text = response_text[7:]
        elif response_text.startswith('```'):
            response_text = response_text[3:]
        if response_text.endswith('```'):
            response_text = response_text[:-3]
        response_text = response_text.strip()

        # Parse JSON response
        result = json.loads(response_text)

        # Extract and validate scores
        grammar = result.get("grammar", {})
        spelling = result.get("spelling", {})
        relevance = result.get("relevance", {})
        creativity = result.get("creativity", {})

        # Calculate total score
        grammar_score = max(0, min(25, grammar.get("score", 15)))
        spelling_score = max(0, min(25, spelling.get("score", 18)))
        relevance_score = max(0, min(25, relevance.get("score", 16)))
        creativity_score = max(0, min(25, creativity.get("score", 17)))

        total_score = grammar_score + spelling_score + relevance_score + creativity_score

        # Build comprehensive feedback
        feedback = {
            "totalScore": total_score,
            "breakdown": {
                "grammar": grammar_score,
                "spelling": spelling_score,
                "relevance": relevance_score,
                "creativity": creativity_score
            },
            "grammarFeedback": grammar.get("feedback", "Good grammar overall"),
            "spellingFeedback": spelling.get("feedback", "Good spelling overall"),
            "relevanceFeedback": relevance.get("feedback", "Good relevance overall"),
            "creativityFeedback": creativity.get("feedback", "Good creativity overall"),
            "strengths": result.get("strengths", []),
            "areasForImprovement": result.get("areasForImprovement", []),
            "generalComment": result.get("generalComment", _generate_general_comment(total_score)),
            "nextSteps": result.get("nextSteps", []),
            "submissionId": submission_id,
            "timestamp": datetime.utcnow().isoformat()
        }

        print(f"\n✅ Analysis Complete")
        print(f"   Total Score: {total_score}/100")
        print(f"   Breakdown: G:{grammar_score} S:{spelling_score} R:{relevance_score} C:{creativity_score}")

        return {
            "success": True,
            "score": total_score,
            "feedback": feedback,
            "safetyCheck": safety_result
        }

    except json.JSONDecodeError as e:
        print(f"❌ JSON parse error: {str(e)}")
        return {
            "success": False,
            "error": f"Failed to parse evaluation results: {str(e)}",
            "safetyCheck": safety_result if 'safety_result' in locals() else {}
        }

    except Exception as e:
        print(f"❌ Writing analysis error: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "safetyCheck": safety_result if 'safety_result' in locals() else {}
        }


def _generate_general_comment(score: int) -> str:
    """Generate fallback general comment based on score."""
    if score >= 90:
        return "🌟 Excellent work! Your writing is outstanding. You demonstrate strong skills across all areas."
    elif score >= 75:
        return "👏 Great job! Your writing shows solid skills and creativity. Keep up the excellent work!"
    elif score >= 60:
        return "📈 Good work! You're making progress. With some practice, you'll improve even more."
    elif score >= 50:
        return "💪 Nice effort! Keep practicing and focusing on the areas for improvement."
    else:
        return "📚 Good start! This is a learning journey. Review the feedback and try again!"
