"""
Writing Assistant Orchestrator - Main ADK Agent
Coordinates all writing-related operations using Google ADK
"""

from google.adk.agents import LlmAgent
from .tools import (
    check_content_safety,
    analyze_student_writing,
    generate_image_from_writing,
    generate_video_from_writing,
    upload_image_to_gcs,
    upload_video_to_gcs,
    save_submission_feedback,
    create_media_record,
    validate_image_safety
)


class WritingAssistantOrchestrator:
    """
    Main orchestration agent for Fun Writing AI platform.

    This agent coordinates all writing-related operations including:
    - Student writing analysis and feedback
    - AI image and video generation
    - Content and media safety validation
    - Database and storage operations
    """

    def __init__(self):
        self.name = "WritingAssistantOrchestrator"

        # Initialize the ADK agent with all tools
        self.agent = LlmAgent(
            name="WritingAssistantOrchestrator",
            model="gemini-2.5-flash",
            instruction="""You are an AI orchestrator for a children's writing platform called Fun Writing.

Your responsibilities:
1. Analyze student writing and provide detailed, encouraging feedback
2. Generate safe, age-appropriate images and videos from student stories
3. Validate all content for safety and appropriateness
4. Coordinate with storage and database systems to save results

When analyzing writing:
- First check content safety using the check_content_safety tool
- If safe, evaluate the writing using analyze_student_writing tool
- Provide comprehensive, encouraging, age-appropriate feedback across 4 dimensions:
  * Grammar & Sentence Structure (0-25 points)
  * Spelling & Vocabulary (0-25 points)
  * Relevance & Content (0-25 points)
  * Creativity & Originality (0-25 points)
- Save feedback using save_submission_feedback tool

When generating images:
- Create vivid, child-friendly image prompts that capture story moments
- Generate images using generate_image_from_writing tool
- Upload to cloud storage using upload_image_to_gcs tool
- Validate safety using validate_image_safety tool
- If safe, save media record using create_media_record tool
- If unsafe, inform the user and do not save

When generating videos:
- Create detailed video prompts that bring stories to life
- Generate videos using generate_video_from_writing tool
- Upload to cloud storage using upload_video_to_gcs tool
- Save media record using create_media_record tool

Always prioritize:
- Child safety and age-appropriateness
- Educational value and encouragement
- Positive, constructive feedback
- Fun and engaging creative expression

Be specific, enthusiastic, and helpful in all interactions.""",
            tools=[
                check_content_safety,
                analyze_student_writing,
                generate_image_from_writing,
                generate_video_from_writing,
                upload_image_to_gcs,
                upload_video_to_gcs,
                save_submission_feedback,
                create_media_record,
                validate_image_safety
            ]
        )

    async def analyze_writing(
        self,
        submission_id: str,
        user_id: str,
        student_writing: str,
        original_prompt: str,
        age_group: str
    ) -> dict:
        """
        Analyze student writing and return comprehensive feedback.

        Args:
            submission_id: Unique submission identifier
            user_id: User identifier
            student_writing: The student's text
            original_prompt: The writing prompt given
            age_group: Student's age group

        Returns:
            dict: Analysis result with feedback and safety check
        """
        request = f"""Analyze this student writing submission:

Submission ID: {submission_id}
User ID: {user_id}
Age Group: {age_group}

Original Prompt: "{original_prompt}"

Student Writing:
"{student_writing}"

Please:
1. Check if the content is safe and age-appropriate
2. If safe, analyze the writing and provide detailed feedback
3. Save the feedback to the database

Return the complete feedback with scores."""

        response = await self.agent.run(request)
        return self._parse_response(response)

    async def generate_image(
        self,
        submission_id: str,
        user_id: str,
        student_writing: str,
        age_group: str,
        image_index: int,
        image_style: str
    ) -> dict:
        """
        Generate an AI image from student writing.

        Args:
            submission_id: Submission identifier
            user_id: User identifier
            student_writing: The student's story
            age_group: Student's age group
            image_index: Which scene to illustrate
            image_style: Visual style

        Returns:
            dict: Generation result with image URL and metadata
        """
        request = f"""Generate an image from this student story:

Submission ID: {submission_id}
User ID: {user_id}
Age Group: {age_group}
Image Index: {image_index}
Image Style: {image_style}

Student Writing:
"{student_writing}"

Please:
1. Generate an image using the specified style and index
2. Upload the image to Google Cloud Storage
3. Validate the image for safety
4. If safe, save the media record to the database
5. Return the image URL and metadata

If the image is unsafe, do not save it and explain why."""

        response = await self.agent.run(request)
        return self._parse_response(response)

    async def generate_video(
        self,
        submission_id: str,
        user_id: str,
        student_writing: str,
        age_group: str,
        video_style: str
    ) -> dict:
        """
        Generate an AI video from student writing.

        Args:
            submission_id: Submission identifier
            user_id: User identifier
            student_writing: The student's story
            age_group: Student's age group
            video_style: Animation style

        Returns:
            dict: Generation result with video URL and metadata
        """
        request = f"""Generate a video from this student story:

Submission ID: {submission_id}
User ID: {user_id}
Age Group: {age_group}
Video Style: {video_style}

Student Writing:
"{student_writing}"

Please:
1. Generate a video using the specified style
2. Upload the video to Google Cloud Storage
3. Save the media record to the database
4. Return the video URL and metadata"""

        response = await self.agent.run(request)
        return self._parse_response(response)

    def _parse_response(self, response) -> dict:
        """Parse agent response into structured format."""
        try:
            # The agent response should already be structured
            # This is a placeholder for response parsing logic
            if hasattr(response, 'content'):
                return {
                    "success": True,
                    "response": response.content
                }
            return {
                "success": True,
                "response": str(response)
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    def get_info(self) -> dict:
        """Get orchestrator information."""
        return {
            "name": self.name,
            "framework": "Google ADK",
            "model": "gemini-2.5-flash",
            "description": "Main orchestration agent for Fun Writing platform",
            "tools": [
                "check_content_safety",
                "analyze_student_writing",
                "generate_image_from_writing",
                "generate_video_from_writing",
                "upload_image_to_gcs",
                "upload_video_to_gcs",
                "save_submission_feedback",
                "create_media_record",
                "validate_image_safety"
            ],
            "capabilities": [
                "Student writing analysis and feedback",
                "AI image generation with Gemini 2.5 Flash Image",
                "AI video generation with Veo 3.1",
                "Content and media safety validation",
                "Cloud storage management",
                "Database operations",
                "Multi-step workflow orchestration"
            ]
        }
