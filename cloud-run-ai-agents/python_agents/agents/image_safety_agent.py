"""
Image Safety Agent - Google ADK Implementation
Checks generated images for harmful content using Google ADK framework
Uses Gemini 2.5 Flash multimodal capabilities for image analysis
"""

from python_agents.adk.agents import LlmAgent
from python_agents.adk.models import get_model
import json
from datetime import datetime
from typing import Dict, Any, Optional
import base64
from PIL import Image
import io
import requests
from google import genai
import os


class ImageSafetyAgent:
    """
    ADK-based agent for validating image content safety.
    Uses Gemini 2.5 Flash's vision capabilities to detect inappropriate content in images.
    """

    def __init__(self, model_name: str = "gemini-2.5-flash"):
        self.name = "ImageSafetyAgent"
        self.model_name = model_name

        # Initialize Google GenAI client for vision analysis
        api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GOOGLE_API_KEY or GEMINI_API_KEY environment variable must be set")

        self.genai_client = genai.Client(api_key=api_key)

        # System instruction for safety analysis
        self.system_instruction = """You are an image content safety moderator for a children's educational platform.

Your responsibilities:
1. Analyze images for inappropriate visual content
2. Detect violence, gore, or disturbing imagery
3. Flag sexual or adult content in images
4. Identify inappropriate text or speech bubbles in images
5. Check for hate symbols or offensive imagery
6. Ensure images are age-appropriate for children

You must examine images carefully and provide detailed safety analysis.
Be thorough but understand these are AI-generated illustrations for children's stories.

Always respond with structured JSON format for safety analysis."""

    async def validate_image(
        self,
        image_url: str,
        age_group: str,
        context: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Validate generated image for safety issues.

        Args:
            image_url: URL of the image to analyze
            age_group: Age group (e.g., "7-11", "11-14")
            context: Optional story context for better analysis

        Returns:
            Safety validation result with alerts if needed
        """
        try:
            print(f"\n🛡️  [{self.name}] Validating image for age group: {age_group}")
            print(f"   Image URL: {image_url}")

            # Download and prepare image
            image_data = await self._download_image(image_url)

            if not image_data:
                return self._create_error_response("Failed to download image for analysis")

            # Convert image bytes to PIL Image
            try:
                image = Image.open(io.BytesIO(image_data))
                print(f"   📸 Image loaded: {image.format} {image.size} {image.mode}")
            except Exception as e:
                print(f"❌ [{self.name}] Failed to load image: {str(e)}")
                return self._create_error_response(f"Failed to load image: {str(e)}")

            # Create comprehensive safety check prompt
            context_text = f"\n\nStory context: {context}" if context else ""

            prompt = f"""Analyze this AI-generated image for a children's story (Age: {age_group}).{context_text}

Check the image for:
1. **Violence or Graphic Content**: Blood, weapons, fighting, scary imagery
2. **Inappropriate Text**: Profanity, offensive language in speech bubbles or text
3. **Sexual/Adult Content**: Inappropriate clothing, poses, or themes
4. **Hate Symbols**: Offensive symbols, gestures, or imagery
5. **Disturbing Elements**: Frightening, nightmare-inducing content
6. **Age-Appropriateness**: Is this suitable for {age_group} year-olds?

IMPORTANT: Examine the entire image carefully, including:
- Background details
- Text in speech bubbles or captions
- Character clothing and poses
- Objects and symbols
- Overall mood and atmosphere

Respond ONLY with valid JSON in this exact structure:
{{
  "isSafe": true or false,
  "riskLevel": "none" | "low" | "medium" | "high" | "critical",
  "issues": [
    {{
      "category": "violence" | "inappropriate_text" | "sexual_content" | "hate_symbols" | "disturbing" | "age_inappropriate",
      "severity": "low" | "medium" | "high",
      "description": "Detailed description of the issue found",
      "location": "Where in the image (e.g., 'top-left corner', 'speech bubble', 'background')"
    }}
  ],
  "recommendation": "approve" | "review" | "regenerate" | "block",
  "reasoning": "Detailed explanation of your decision",
  "alertMessage": "User-friendly alert message if image should be blocked or regenerated, null if approved",
  "visualDescription": "Brief description of what you see in the image"
}}"""

            # Use Gemini 2.5 Flash with direct vision capabilities
            print(f"   🔍 Analyzing image with Gemini 2.5 Flash vision...")
            response = self.genai_client.models.generate_content(
                model="gemini-2.5-flash",
                contents=[image, prompt]
            )

            # Parse JSON response
            print(f"   🔍 Response received (length: {len(response.text)} chars)")
            result = json.loads(response.text)
            print(f"   ✅ JSON parsed successfully")

            # Build safety result
            safety_result = {
                "isSafe": result.get("isSafe", True),
                "riskLevel": result.get("riskLevel", "none"),
                "issues": result.get("issues", []),
                "recommendation": result.get("recommendation", "approve"),
                "reasoning": result.get("reasoning", "Image appears appropriate"),
                "alertMessage": result.get("alertMessage"),
                "visualDescription": result.get("visualDescription", ""),
                "imageUrl": image_url,
                "agent": self.name,
                "timestamp": datetime.utcnow().isoformat()
            }

            # Log the result
            if not safety_result["isSafe"]:
                print(f"   ⚠️  IMAGE FLAGGED: {safety_result['riskLevel']} risk")
                print(f"   Issues found: {len(safety_result['issues'])}")
                print(f"   Recommendation: {safety_result['recommendation']}")
                if safety_result["alertMessage"]:
                    print(f"   🚨 ALERT: {safety_result['alertMessage']}")
                print(f"   Visual: {safety_result['visualDescription']}")
            else:
                print(f"   ✅ Image approved: No safety issues detected")
                print(f"   Visual: {safety_result['visualDescription']}")

            return safety_result

        except json.JSONDecodeError as e:
            print(f"❌ [{self.name}] JSON parse error: {e}")
            return self._create_error_response(
                "Failed to parse image safety analysis"
            )
        except Exception as e:
            print(f"❌ [{self.name}] Error: {str(e)}")
            return self._create_error_response(
                f"Image safety check encountered an error: {str(e)}"
            )

    async def validate_image_batch(
        self,
        image_urls: list,
        age_group: str,
        context: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Validate multiple images for safety issues.

        Args:
            image_urls: List of image URLs to analyze
            age_group: Age group
            context: Optional story context

        Returns:
            Batch safety validation results
        """
        try:
            print(f"\n🛡️  [{self.name}] Batch validating {len(image_urls)} images")

            results = []
            all_safe = True

            for idx, image_url in enumerate(image_urls, 1):
                print(f"\n   Analyzing image {idx}/{len(image_urls)}...")
                result = await self.validate_image(image_url, age_group, context)
                results.append(result)

                if not result["isSafe"]:
                    all_safe = False

            # Aggregate results
            total_issues = sum(len(r["issues"]) for r in results)
            flagged_images = sum(1 for r in results if not r["isSafe"])

            batch_result = {
                "allSafe": all_safe,
                "totalImages": len(image_urls),
                "flaggedImages": flagged_images,
                "totalIssues": total_issues,
                "results": results,
                "agent": self.name,
                "timestamp": datetime.utcnow().isoformat()
            }

            if not all_safe:
                print(f"\n   ⚠️  BATCH CHECK: {flagged_images}/{len(image_urls)} images flagged")
            else:
                print(f"\n   ✅ BATCH CHECK: All images approved")

            return batch_result

        except Exception as e:
            print(f"❌ [{self.name}] Batch validation error: {str(e)}")
            return {
                "allSafe": False,
                "error": str(e),
                "agent": self.name,
                "timestamp": datetime.utcnow().isoformat()
            }

    async def _download_image(self, image_url: str) -> Optional[bytes]:
        """
        Download image from URL and return image data.

        Args:
            image_url: URL of the image

        Returns:
            Image data as bytes or None if failed
        """
        try:
            response = requests.get(image_url, timeout=30)
            response.raise_for_status()
            return response.content
        except Exception as e:
            print(f"❌ [{self.name}] Failed to download image: {str(e)}")
            return None

    def _create_error_response(self, message: str) -> Dict[str, Any]:
        """Create standardized error response."""
        return {
            "isSafe": False,  # Fail-closed for images (safer)
            "riskLevel": "unknown",
            "issues": [],
            "recommendation": "review",
            "reasoning": "Image safety check failed, manual review required",
            "alertMessage": f"⚠️  {message} This image will be reviewed before display.",
            "agent": self.name,
            "error": message,
            "timestamp": datetime.utcnow().isoformat()
        }

    def get_info(self) -> Dict[str, Any]:
        """Get agent information."""
        return {
            "name": self.name,
            "framework": "Google ADK",
            "model": self.model_name,
            "description": "Image safety validation agent using Gemini 2.5 Flash vision",
            "capabilities": [
                "Analyze images for inappropriate content",
                "Detect violence and disturbing imagery",
                "Identify inappropriate text in images",
                "Flag sexual or adult content",
                "Recognize hate symbols",
                "Age-appropriateness validation",
                "Batch image processing",
                "Real-time safety alerts"
            ]
        }
