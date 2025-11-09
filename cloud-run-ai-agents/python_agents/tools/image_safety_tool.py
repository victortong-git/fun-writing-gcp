"""
Image Safety Validation Tool - Validates images using Gemini vision
"""

import google.generativeai as genai
import os
import json
import requests
from datetime import datetime
from PIL import Image
import io


def validate_image_safety(
    image_url: str,
    age_group: str,
    context: str = ""
) -> dict:
    """
    Validate a generated image for safety and appropriateness using Gemini vision.

    This tool analyzes images using Gemini's multimodal capabilities to detect
    inappropriate content, violence, or other safety issues.

    Args:
        image_url: URL of the image to validate
        age_group: Target age group (e.g., "7-11", "11-14")
        context: Optional story context for better validation

    Returns:
        dict: Safety validation result containing:
            - isSafe (bool): Whether image passes safety checks
            - riskLevel (str): "none"|"low"|"medium"|"high"|"critical"
            - issues (list[dict]): Specific safety issues found
            - recommendation (str): "approve"|"review"|"regenerate"|"block"
            - visualDescription (str): What the AI sees in the image
            - alertMessage (str|None): User-facing alert if unsafe
            - error (str|None): Error message if validation failed
    """
    try:
        print(f"\n🛡️  [{datetime.utcnow().isoformat()}] Image Safety Validation")
        print(f"   Image URL: {image_url}")
        print(f"   Age Group: {age_group}")

        # Download image
        print(f"   📥 Downloading image...")
        response = requests.get(image_url, timeout=30)
        response.raise_for_status()
        image_data = response.content

        # Open with PIL
        pil_image = Image.open(io.BytesIO(image_data))

        # Configure Gemini
        api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise Exception("No API key found for Gemini")

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(
            "gemini-2.5-flash",
            system_instruction="You are an image content safety moderator for a children's educational platform."
        )

        # Create safety validation prompt
        context_text = f"\n\nStory context: {context}" if context else ""

        prompt = f"""Analyze this AI-generated image for a children's story (Age: {age_group}).{context_text}

Check the image for:
1. Violence or Graphic Content: Blood, weapons, fighting, scary imagery
2. Inappropriate Text: Profanity, offensive language in text or speech bubbles
3. Sexual/Adult Content: Inappropriate clothing, poses, or themes
4. Hate Symbols: Offensive symbols, gestures, or imagery
5. Disturbing Elements: Frightening or nightmare-inducing content
6. Age-Appropriateness: Is this suitable for {age_group} year-olds?

Examine carefully: background details, text in bubbles/captions, character clothing/poses, objects, symbols, overall mood.

Respond with ONLY valid JSON in this EXACT format:
{{
  "isSafe": true or false,
  "riskLevel": "none" | "low" | "medium" | "high" | "critical",
  "issues": [
    {{
      "category": "violence" | "inappropriate_text" | "sexual_content" | "hate_symbols" | "disturbing" | "age_inappropriate",
      "severity": "low" | "medium" | "high",
      "description": "Detailed description of issue",
      "location": "Where in image (e.g., 'top-left corner', 'speech bubble')"
    }}
  ],
  "recommendation": "approve" | "review" | "regenerate" | "block",
  "reasoning": "Detailed explanation of your decision",
  "visualDescription": "Brief description of what you see in the image"
}}"""

        # Call Gemini with image
        print(f"   🤖 Analyzing with Gemini vision...")
        response = model.generate_content([prompt, pil_image])
        response_text = response.text.strip()

        # Clean markdown
        if response_text.startswith('```json'):
            response_text = response_text[7:]
        elif response_text.startswith('```'):
            response_text = response_text[3:]
        if response_text.endswith('```'):
            response_text = response_text[:-3]

        # Parse JSON
        result = json.loads(response_text.strip())

        # Build safety result
        safety_result = {
            "isSafe": result.get("isSafe", True),
            "riskLevel": result.get("riskLevel", "none"),
            "issues": result.get("issues", []),
            "recommendation": result.get("recommendation", "approve"),
            "reasoning": result.get("reasoning", "Image appears appropriate"),
            "visualDescription": result.get("visualDescription", ""),
            "alertMessage": None,
            "imageUrl": image_url,
            "timestamp": datetime.utcnow().isoformat()
        }

        # Generate alert if unsafe
        if not safety_result["isSafe"]:
            safety_result["alertMessage"] = (
                "⚠️ This image has been flagged and will be reviewed. "
                "It may contain content that isn't appropriate for this age group."
            )

        status = "✅ SAFE" if safety_result["isSafe"] else "⚠️  UNSAFE"
        print(f"   {status}: {safety_result['riskLevel']} - {safety_result['recommendation']}")

        return safety_result

    except json.JSONDecodeError as e:
        print(f"❌ JSON parse error: {str(e)}")
        return {
            "isSafe": False,
            "riskLevel": "unknown",
            "issues": [],
            "recommendation": "review",
            "reasoning": "Safety validation failed due to parsing error",
            "alertMessage": "⚠️ Unable to verify image safety. Manual review required.",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }

    except Exception as e:
        print(f"❌ Image safety validation error: {str(e)}")
        return {
            "isSafe": False,
            "riskLevel": "unknown",
            "issues": [],
            "recommendation": "review",
            "reasoning": f"Safety validation encountered an error: {str(e)}",
            "alertMessage": "⚠️ Safety check temporarily unavailable. Manual review required.",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }
