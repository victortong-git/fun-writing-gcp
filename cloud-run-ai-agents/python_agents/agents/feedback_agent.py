"""
Feedback Agent - Google ADK Implementation
Evaluates student writing and provides detailed feedback using Google ADK framework
Uses Gemini 2.5 Flash for comprehensive writing analysis
"""

from python_agents.adk.agents import LlmAgent
from python_agents.adk.models import get_model
import json
from datetime import datetime
from typing import Dict, Any, List


class FeedbackAgent:
    """
    ADK-based agent for evaluating student writing submissions.
    Provides detailed feedback across multiple dimensions with scoring.
    """

    def __init__(self, model_name: str = "gemini-2.5-flash"):
        self.name = "FeedbackAgent"
        self.model_name = model_name

        # Initialize ADK agent for writing evaluation
        self.agent = LlmAgent(
            name="writing_evaluation_agent",
            model=get_model(model_name),
            instruction="""You are an encouraging educational AI evaluating student writing.

Your responsibilities:
1. Provide comprehensive, detailed feedback across all dimensions
2. Be constructive and encouraging
3. Identify both strengths and areas for improvement
4. Give specific examples from the writing
5. Provide actionable next steps
6. Tailor feedback to the student's age group

Scoring guidelines:
- 90-100: Outstanding work showing exceptional skill
- 75-89: Strong work with good mastery
- 60-74: Solid work with room for improvement
- 50-59: Developing skills, needs practice
- Below 50: Significant work needed

Always be positive and encouraging while being honest about areas to improve.
Always respond with structured JSON format."""
        )

    async def evaluate_submission(
        self,
        student_writing: str,
        original_prompt: str,
        age_group: str
    ) -> Dict[str, Any]:
        """
        Evaluate student writing submission comprehensively.

        Args:
            student_writing: Student's submitted writing
            original_prompt: Original writing prompt
            age_group: Age group (e.g., "7-11")

        Returns:
            Comprehensive feedback and scores
        """
        try:
            print(f"📊 [{self.name}] Evaluating submission for age: {age_group}")

            evaluation_prompt = f"""You are an encouraging educational AI evaluating student writing. Provide comprehensive, detailed feedback across all 4 dimensions.

**Student Age Group**: {age_group}

**Original Writing Prompt**:
"{original_prompt}"

**Student Writing**:
"{student_writing}"

Evaluate this student's writing across 4 dimensions (each out of 25 points, total 100):

**1. GRAMMAR & SENTENCE STRUCTURE (0-25 points)**
Criteria:
- Correct sentence structure (subject, verb, object)
- Appropriate use of punctuation
- Varied sentence types and lengths
- Age-appropriate complexity

**2. SPELLING & VOCABULARY (0-25 points)**
Criteria:
- Spelling accuracy of common words
- Spelling accuracy of challenging words
- Overall clarity despite any errors
- Age-appropriate vocabulary usage

**3. RELEVANCE & CONTENT (0-25 points)**
Criteria:
- Addresses the core topic of the prompt
- Includes required elements or instructions
- Stays on topic throughout
- Shows understanding of the prompt's intent

**4. CREATIVITY & ORIGINALITY (0-25 points)**
Criteria:
- Original ideas and unique perspectives
- Imaginative descriptions and imagery
- Creative problem-solving in the narrative
- Unexpected or interesting twists
- Use of descriptive and figurative language

You MUST respond with this EXACT JSON structure:
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

Be specific, encouraging, and age-appropriate in all feedback. Provide actionable suggestions."""

            # Run agent to evaluate writing
            response = await self.agent.run(evaluation_prompt)

            # Parse JSON response
            result = json.loads(response.content)

            # Extract and validate scores
            grammar = self._validate_dimension(result.get("grammar", {}), "grammar")
            spelling = self._validate_dimension(result.get("spelling", {}), "spelling")
            relevance = self._validate_dimension(result.get("relevance", {}), "relevance")
            creativity = self._validate_dimension(result.get("creativity", {}), "creativity")

            # Calculate total score
            total_score = (
                grammar["score"] +
                spelling["score"] +
                relevance["score"] +
                creativity["score"]
            )

            # Build comprehensive feedback
            feedback = {
                "totalScore": total_score,
                "breakdown": {
                    "grammar": grammar["score"],
                    "spelling": spelling["score"],
                    "relevance": relevance["score"],
                    "creativity": creativity["score"]
                },
                "grammarFeedback": grammar["feedback"],
                "spellingFeedback": spelling["feedback"],
                "relevanceFeedback": relevance["feedback"],
                "creativityFeedback": creativity["feedback"],
                "strengths": result.get("strengths", []),
                "areasForImprovement": result.get("areasForImprovement", []),
                "generalComment": result.get("generalComment", self._generate_general_comment(total_score)),
                "nextSteps": result.get("nextSteps", []),
                "agent": self.name,
                "timestamp": datetime.utcnow().isoformat()
            }

            print(f"✅ [{self.name}] Evaluation complete - Score: {total_score}/100")

            return {
                "agent": self.name,
                "evaluated": True,
                "feedback": feedback
            }

        except json.JSONDecodeError as e:
            print(f"❌ [{self.name}] JSON parse error: {e}")
            raise Exception("Failed to parse evaluation results")
        except Exception as e:
            print(f"❌ [{self.name}] Evaluation error: {str(e)}")
            raise

    def _validate_dimension(
        self,
        dimension_data: Dict[str, Any],
        dimension_name: str
    ) -> Dict[str, Any]:
        """Validate and sanitize dimension data."""
        default_scores = {
            "grammar": 15,
            "spelling": 18,
            "relevance": 16,
            "creativity": 17
        }

        score = dimension_data.get("score", default_scores.get(dimension_name, 15))
        score = max(0, min(25, score))  # Clamp between 0-25

        return {
            "score": score,
            "issues": dimension_data.get("issues", []),
            "feedback": dimension_data.get("feedback", f"Good {dimension_name} overall"),
            **{k: v for k, v in dimension_data.items() if k not in ["score", "issues", "feedback"]}
        }

    def _generate_general_comment(self, score: int) -> str:
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

    def get_info(self) -> Dict[str, Any]:
        """Get agent information."""
        return {
            "name": self.name,
            "framework": "Google ADK",
            "model": self.model_name,
            "description": "Writing evaluation and feedback agent",
            "capabilities": [
                "Evaluate grammar and sentence structure",
                "Check spelling accuracy",
                "Assess prompt relevance",
                "Score creativity and originality",
                "Provide comprehensive feedback",
                "Offer actionable next steps"
            ]
        }
