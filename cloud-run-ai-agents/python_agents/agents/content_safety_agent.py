"""
Content Safety Agent - Google ADK Implementation
Checks student writing for harmful content using Google ADK framework
Uses Gemini 2.5 Flash for content analysis
"""

from python_agents.adk.agents import LlmAgent
from python_agents.adk.models import get_model
import json
from datetime import datetime
from typing import Dict, Any, List


class ContentSafetyAgent:
    """
    ADK-based agent for validating text content safety.
    Detects harmful, inappropriate, or unsafe content in student writing.
    """

    def __init__(self, model_name: str = "gemini-2.5-flash"):
        self.name = "ContentSafetyAgent"
        self.model_name = model_name

        # Initialize ADK agent with safety checking instructions
        self.agent = LlmAgent(
            name="content_safety_agent",
            model=get_model(model_name),
            instruction="""You are a content safety moderator for a children's educational writing platform.

Your responsibilities:
1. Detect harmful, inappropriate, or unsafe content
2. Identify content that is not age-appropriate
3. Flag violence, profanity, sexual content, hate speech, or bullying
4. Check for personal information exposure (PII)
5. Ensure content aligns with educational values

You must be thorough but also understanding that these are creative writings from children.
Balance safety with encouraging creativity.

Always respond with structured JSON format for safety analysis."""
        )

    async def validate_content(
        self,
        text: str,
        age_group: str,
        user_id: str
    ) -> Dict[str, Any]:
        """
        Validate student writing for safety issues.

        Args:
            text: Student's writing to check
            age_group: Age group (e.g., "7-11", "11-14")
            user_id: User ID for logging

        Returns:
            Safety validation result with alerts if needed
        """
        try:
            print(f"\n🛡️  [{self.name}] Validating content for age group: {age_group}")
            print(f"   User ID: {user_id}")
            print(f"   Content length: {len(text)} characters")

            # Create comprehensive safety check prompt
            prompt = f"""Analyze this student writing (Age: {age_group}) for safety issues:

Text:
"{text}"

Check for:
1. Violence or graphic content
2. Profanity or inappropriate language
3. Sexual or adult content
4. Hate speech, discrimination, or bullying
5. Personal information (names, addresses, phone numbers, emails)
6. Dangerous activities or self-harm references
7. Age-appropriateness for {age_group} year-olds

Respond ONLY with valid JSON in this exact structure:
{{
  "isSafe": true or false,
  "riskLevel": "none" | "low" | "medium" | "high" | "critical",
  "issues": [
    {{
      "category": "violence" | "profanity" | "sexual" | "hate_speech" | "pii" | "dangerous" | "age_inappropriate",
      "severity": "low" | "medium" | "high",
      "description": "Specific issue found",
      "snippet": "Text snippet showing the issue"
    }}
  ],
  "recommendation": "approve" | "review" | "block",
  "reasoning": "Brief explanation of the decision",
  "alertMessage": "User-friendly alert message if content should be blocked or reviewed, null if approved"
}}"""

            # Run agent to analyze content
            response = await self.agent.run(prompt)

            # Parse JSON response
            result = json.loads(response.content)

            # Build safety result
            safety_result = {
                "isSafe": result.get("isSafe", True),
                "riskLevel": result.get("riskLevel", "none"),
                "issues": result.get("issues", []),
                "recommendation": result.get("recommendation", "approve"),
                "reasoning": result.get("reasoning", "Content appears appropriate"),
                "alertMessage": result.get("alertMessage"),
                "agent": self.name,
                "timestamp": datetime.utcnow().isoformat()
            }

            # Log the result
            if not safety_result["isSafe"]:
                print(f"   ⚠️  CONTENT FLAGGED: {safety_result['riskLevel']} risk")
                print(f"   Issues found: {len(safety_result['issues'])}")
                print(f"   Recommendation: {safety_result['recommendation']}")
                if safety_result["alertMessage"]:
                    print(f"   🚨 ALERT: {safety_result['alertMessage']}")
            else:
                print(f"   ✅ Content approved: No safety issues detected")

            return safety_result

        except json.JSONDecodeError as e:
            print(f"❌ [{self.name}] JSON parse error: {e}")
            return self._create_error_response(
                "Failed to parse safety analysis. Manual review recommended."
            )
        except Exception as e:
            print(f"❌ [{self.name}] Error: {str(e)}")
            return self._create_error_response(
                f"Safety check encountered an error: {str(e)}"
            )

    async def validate_ai_output(
        self,
        content: str,
        age_group: str
    ) -> Dict[str, Any]:
        """
        Validate AI-generated content (prompts, feedback) for safety.

        Args:
            content: AI-generated content
            age_group: Age group

        Returns:
            Safety validation result
        """
        try:
            print(f"🛡️  [{self.name}] Validating AI output for age: {age_group}")

            prompt = f"""You are validating AI-generated content for a children's app.
Age Group: {age_group}

AI Content:
"{content}"

Ensure this content is:
1. Age-appropriate and educational
2. Free from any harmful elements
3. Encouraging and positive
4. Culturally sensitive

Respond with valid JSON:
{{
  "isSafe": true or false,
  "riskLevel": "none" | "low" | "medium" | "high",
  "issues": [{{"category": "string", "description": "string"}}],
  "recommendation": "approve" | "regenerate" | "block",
  "reasoning": "Brief explanation"
}}"""

            response = await self.agent.run(prompt)
            result = json.loads(response.content)

            validation_result = {
                "isSafe": result.get("isSafe", True),
                "riskLevel": result.get("riskLevel", "none"),
                "issues": result.get("issues", []),
                "recommendation": result.get("recommendation", "approve"),
                "reasoning": result.get("reasoning", "AI output appears appropriate"),
                "agent": self.name,
                "timestamp": datetime.utcnow().isoformat()
            }

            if not validation_result["isSafe"]:
                print(f"   ⚠️  AI OUTPUT FLAGGED: {validation_result['riskLevel']} risk")
                print(f"   Recommendation: {validation_result['recommendation']}")
            else:
                print(f"   ✅ AI output approved")

            return validation_result

        except Exception as e:
            print(f"❌ [{self.name}] AI validation error: {str(e)}")
            return {
                "isSafe": False,
                "riskLevel": "unknown",
                "issues": [],
                "recommendation": "regenerate",
                "reasoning": "Unable to validate AI output, regeneration recommended",
                "agent": self.name,
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }

    def _create_error_response(self, message: str) -> Dict[str, Any]:
        """Create standardized error response."""
        return {
            "isSafe": True,  # Fail-open for better UX
            "riskLevel": "unknown",
            "issues": [],
            "recommendation": "review",
            "reasoning": "Safety check failed, manual review recommended",
            "alertMessage": f"⚠️  {message} Your submission will be reviewed.",
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
            "description": "Content safety validation agent for student writing",
            "capabilities": [
                "Detect harmful and inappropriate content",
                "Age-appropriateness validation",
                "PII detection",
                "Violence and profanity filtering",
                "AI-generated content validation",
                "Real-time safety alerts"
            ]
        }
