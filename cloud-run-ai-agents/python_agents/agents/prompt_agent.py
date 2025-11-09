"""
Prompt Agent - Google ADK Implementation
Generates age-appropriate writing prompts using Google ADK framework
Uses Gemini 2.5 Flash for creative prompt generation
"""

from python_agents.adk.agents import LlmAgent
from python_agents.adk.models import get_model
import json
from datetime import datetime
from typing import Dict, Any


class PromptAgent:
    """
    ADK-based agent for generating creative writing prompts.
    Creates age-appropriate prompts with instructions and word count targets.
    """

    def __init__(self, model_name: str = "gemini-2.5-flash"):
        self.name = "PromptAgent"
        self.model_name = model_name

        # Word count recommendations by age group
        self.word_count_targets = {
            "3-5": {"min": 20, "target": 35, "max": 50},
            "5-7": {"min": 50, "target": 75, "max": 100},
            "7-11": {"min": 100, "target": 200, "max": 300},
            "11-14": {"min": 250, "target": 400, "max": 500},
            "14-16": {"min": 400, "target": 600, "max": 800},
            "16+": {"min": 750, "target": 1000, "max": 1500}
        }

        # Time recommendations (minutes)
        self.time_recommendations = {
            "3-5": 15,
            "5-7": 20,
            "7-11": 30,
            "11-14": 45,
            "14-16": 60,
            "16+": 90
        }

        # Initialize ADK agent for prompt generation
        self.agent = LlmAgent(
            name="prompt_generation_agent",
            model=get_model(model_name),
            instruction="""You are a creative writing instructor specializing in age-appropriate prompts.

Your responsibilities:
1. Generate engaging, inspiring writing prompts
2. Tailor prompts to specific age groups
3. Provide clear, helpful instructions
4. Set appropriate word count and time expectations
5. Encourage creativity and imagination
6. Ensure prompts are educationally valuable

Create prompts that spark imagination while being achievable for the target age group.
Always respond with structured JSON format."""
        )

    async def generate_prompt(
        self,
        theme: str,
        age_group: str
    ) -> Dict[str, Any]:
        """
        Generate a creative writing prompt.

        Args:
            theme: Writing theme (e.g., "Adventure", "Fairy Tale")
            age_group: Age group (e.g., "7-11")

        Returns:
            Generated prompt with instructions and targets
        """
        try:
            print(f"✍️  [{self.name}] Generating prompt for theme: {theme}, age: {age_group}")

            word_counts = self.word_count_targets.get(age_group, self.word_count_targets["7-11"])
            time_limit = self.time_recommendations.get(age_group, 30)

            prompt_request = f"""You are a creative writing instructor for students aged {age_group}.
Theme: "{theme}"

Generate an engaging, age-appropriate writing prompt with:
- A compelling story starter or scenario
- 3-5 clear instructions to guide their writing
- Appropriate challenges for this age group

Target word count: {word_counts["target"]} words (min: {word_counts["min"]}, max: {word_counts["max"]})
Suggested time: {time_limit} minutes

Respond ONLY with this JSON structure:
{{
  "title": "Catchy prompt title (5-8 words)",
  "prompt": "The main prompt text - 2-3 sentences to inspire writing",
  "instructions": [
    "Instruction 1 - specific and actionable",
    "Instruction 2 - encourages creativity",
    "Instruction 3 - guides structure",
    "Instruction 4 (optional) - adds challenge",
    "Instruction 5 (optional) - encourages detail"
  ],
  "wordCountTarget": {word_counts["target"]},
  "wordCountMin": {word_counts["min"]},
  "wordCountMax": {word_counts["max"]},
  "estimatedTimeMinutes": {time_limit},
  "theme": "{theme}",
  "ageGroup": "{age_group}"
}}"""

            # Run agent to generate prompt
            response = await self.agent.run(prompt_request)

            # Parse JSON response
            prompt_data = json.loads(response.content)

            result = {
                "agent": self.name,
                "promptData": prompt_data,
                "timestamp": datetime.utcnow().isoformat()
            }

            print(f"✅ [{self.name}] Prompt generated: {prompt_data.get('title', 'Untitled')}")

            return result

        except json.JSONDecodeError as e:
            print(f"❌ [{self.name}] JSON parse error: {e}")
            raise Exception("Failed to generate prompt: Invalid JSON response")
        except Exception as e:
            print(f"❌ [{self.name}] Generation error: {str(e)}")
            raise

    async def generate_prompt_variations(
        self,
        theme: str,
        age_group: str,
        count: int = 3
    ) -> Dict[str, Any]:
        """
        Generate multiple prompt variations for the same theme.

        Args:
            theme: Writing theme
            age_group: Age group
            count: Number of variations (default: 3)

        Returns:
            Multiple prompt variations
        """
        try:
            print(f"✍️  [{self.name}] Generating {count} prompt variations")

            prompts = []
            for i in range(count):
                try:
                    prompt = await self.generate_prompt(theme, age_group)
                    prompts.append(prompt)
                except Exception as e:
                    print(f"⚠️  Failed to generate variation {i + 1}: {str(e)}")

            print(f"✅ [{self.name}] Generated {len(prompts)}/{count} variations")

            return {
                "agent": self.name,
                "variations": prompts,
                "count": len(prompts),
                "timestamp": datetime.utcnow().isoformat()
            }

        except Exception as e:
            print(f"❌ [{self.name}] Variation generation error: {str(e)}")
            raise

    def get_word_count_recommendation(self, age_group: str) -> Dict[str, int]:
        """
        Get word count recommendation for age group.

        Args:
            age_group: Age group

        Returns:
            Word count targets
        """
        return self.word_count_targets.get(age_group, self.word_count_targets["7-11"])

    def get_time_limit_recommendation(self, age_group: str) -> int:
        """
        Get time limit recommendation for age group.

        Args:
            age_group: Age group

        Returns:
            Time in minutes
        """
        return self.time_recommendations.get(age_group, 30)

    def get_info(self) -> Dict[str, Any]:
        """Get agent information."""
        return {
            "name": self.name,
            "framework": "Google ADK",
            "model": self.model_name,
            "description": "Creative writing prompt generation agent",
            "capabilities": [
                "Generate age-appropriate writing prompts",
                "Provide instructions and guidance",
                "Recommend word counts and time limits",
                "Create multiple prompt variations",
                "Theme-based prompt generation"
            ]
        }
