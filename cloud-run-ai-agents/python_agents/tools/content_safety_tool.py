"""
Content Safety Tool - Validates text content for safety and appropriateness
"""

import google.generativeai as genai
import os
import json
from datetime import datetime


def check_content_safety(
    content: str,
    age_group: str,
    user_id: str
) -> dict:
    """
    Check if content is safe and age-appropriate using Gemini.

    This tool analyzes text content for harmful material, inappropriate language,
    and age-appropriateness. It provides detailed safety analysis and recommendations.

    Args:
        content: The text content to validate
        age_group: Target age group (e.g., "7-11", "11-14", "14-18")
        user_id: User identifier for logging and tracking

    Returns:
        dict: Safety analysis result containing:
            - isSafe (bool): Whether content passes safety checks
            - riskLevel (str): "none"|"low"|"medium"|"high"|"critical"
            - issues (list[dict]): Specific safety issues found
            - recommendation (str): "approve"|"review"|"block"
            - reasoning (str): Explanation of the safety decision
            - alertMessage (str|None): User-facing alert if unsafe
    """
    try:
        print(f"🛡️  [{datetime.utcnow().isoformat()}] Content Safety Check")
        print(f"   User: {user_id}, Age Group: {age_group}")
        print(f"   Content length: {len(content)} characters")

        # Configure Gemini
        api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise Exception("No API key found for Gemini")

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(
            "gemini-2.5-flash",
            system_instruction="""You are a content safety moderator for a children's educational platform.
Analyze content for harmful, inappropriate, or unsafe material."""
        )

        # Create safety analysis prompt
        prompt = f"""Analyze this content for safety issues for age group {age_group}:

Content: "{content}"

Check for:
1. Violence or threats
2. Sexual or inappropriate content
3. Hate speech or discrimination
4. Profanity or inappropriate language
5. Dangerous activities or self-harm
6. Personal information disclosure
7. Age-appropriateness

Respond with ONLY valid JSON in this exact format:
{{
  "isSafe": true or false,
  "riskLevel": "none" | "low" | "medium" | "high" | "critical",
  "issues": [
    {{
      "category": "violence" | "sexual" | "hate_speech" | "profanity" | "dangerous" | "privacy" | "age_inappropriate",
      "severity": "low" | "medium" | "high",
      "description": "Detailed description of the issue"
    }}
  ],
  "recommendation": "approve" | "review" | "block",
  "reasoning": "Detailed explanation of the safety decision"
}}"""

        # Call Gemini for safety analysis
        response = model.generate_content(prompt)
        response_text = response.text.strip()

        # Clean up markdown code blocks if present
        if response_text.startswith('```json'):
            response_text = response_text[7:]
        elif response_text.startswith('```'):
            response_text = response_text[3:]
        if response_text.endswith('```'):
            response_text = response_text[:-3]
        response_text = response_text.strip()

        # Parse JSON response
        result = json.loads(response_text)

        # Build safety result
        safety_result = {
            "isSafe": result.get("isSafe", True),
            "riskLevel": result.get("riskLevel", "none"),
            "issues": result.get("issues", []),
            "recommendation": result.get("recommendation", "approve"),
            "reasoning": result.get("reasoning", "Content appears safe"),
            "alertMessage": None,
            "userId": user_id,
            "ageGroup": age_group,
            "timestamp": datetime.utcnow().isoformat()
        }

        # Generate alert message if unsafe
        if not safety_result["isSafe"]:
            issue_count = len(safety_result["issues"])
            safety_result["alertMessage"] = (
                f"⚠️ This content has been flagged for review. "
                f"We found {issue_count} potential {'issue' if issue_count == 1 else 'issues'} "
                f"that may not be appropriate for this age group."
            )

        # Log result
        status = "✅ SAFE" if safety_result["isSafe"] else "⚠️  UNSAFE"
        print(f"   {status}: {safety_result['riskLevel']} risk - {safety_result['recommendation']}")
        if safety_result["issues"]:
            print(f"   Issues: {len(safety_result['issues'])}")

        return safety_result

    except json.JSONDecodeError as e:
        print(f"❌ JSON parse error: {str(e)}")
        return {
            "isSafe": False,
            "riskLevel": "unknown",
            "issues": [],
            "recommendation": "review",
            "reasoning": "Safety check failed due to parsing error",
            "alertMessage": "⚠️ Unable to verify content safety. Manual review required.",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }

    except Exception as e:
        print(f"❌ Content safety error: {str(e)}")
        return {
            "isSafe": False,
            "riskLevel": "unknown",
            "issues": [],
            "recommendation": "review",
            "reasoning": f"Safety check encountered an error: {str(e)}",
            "alertMessage": "⚠️ Safety check temporarily unavailable. Manual review required.",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }
