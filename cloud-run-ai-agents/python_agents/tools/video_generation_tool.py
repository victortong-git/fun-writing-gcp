"""
Video Generation Tool - Generates AI videos using Veo 3.1
"""

import os
import json
import time
from datetime import datetime
import google.generativeai as genai


def generate_video_from_writing(
    student_writing: str,
    age_group: str,
    video_style: str,
    submission_id: str
) -> dict:
    """
    Generate an AI video based on student writing using Veo 3.1.

    This tool creates video prompts from stories and generates videos
    using Google's Veo 3.1 text-to-video model.

    Args:
        student_writing: The student's story text
        age_group: Student's age group (e.g., "7-11", "11-14")
        video_style: Animation style ("animation"|"cinematic")
        submission_id: Submission identifier for tracking

    Returns:
        dict: Generation result containing:
            - success (bool): Whether generation succeeded
            - video_data (bytes): Raw video data
            - prompt (str): The generated video prompt
            - duration (int): Video duration in seconds
            - error (str|None): Error message if generation failed
    """
    try:
        print(f"\n🎬 [{datetime.utcnow().isoformat()}] Video Generation")
        print(f"   Submission: {submission_id}, Style: {video_style}")

        # Step 1: Generate video prompt
        print(f"   📝 Step 1: Generating video prompt...")
        prompt = _generate_video_prompt(student_writing, age_group, video_style)

        if not prompt:
            raise Exception("Failed to generate video prompt")

        print(f"   Prompt: {prompt[:100]}..." if len(prompt) > 100 else f"   Prompt: {prompt}")

        # Step 2: Generate video with Veo 3.1
        print(f"   🎬 Step 2: Generating video with Veo 3.1...")

        api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise Exception("No API key found for Veo")

        try:
            from google.genai import Client

            client = Client(api_key=api_key)

            # Start video generation
            operation = client.models.generate_videos(
                model="veo-3.1-fast-generate-preview",
                prompt=prompt,
            )

            print(f"   ⏳ Video generation started...")

            # Poll for completion
            poll_count = 0
            max_polls = 120  # 10 minutes max

            while not operation.done:
                if poll_count >= max_polls:
                    raise Exception("Video generation timed out after 10 minutes")

                print(f"   ⏳ Waiting... ({poll_count + 1}/{max_polls})")
                time.sleep(5)
                operation = client.operations.get(operation)
                poll_count += 1

            print(f"   ✅ Video generation completed after {poll_count * 5} seconds")

            # Download video
            if not hasattr(operation, 'response') or not hasattr(operation.response, 'generated_videos'):
                raise Exception("Invalid operation response")

            if not operation.response.generated_videos:
                raise Exception("No videos generated")

            generated_video = operation.response.generated_videos[0]

            # Download video data
            print(f"   📥 Downloading video...")
            video_file = client.files.download(file=generated_video.video)

            # Get video bytes
            if hasattr(video_file, 'read'):
                video_data = video_file.read()
            elif hasattr(video_file, 'content'):
                video_data = video_file.content
            else:
                import tempfile
                with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp:
                    generated_video.video.save(tmp.name)
                    tmp.seek(0)
                    video_data = tmp.read()

            print(f"   ✅ Video downloaded ({len(video_data)} bytes)")

            return {
                "success": True,
                "video_data": video_data,
                "prompt": prompt,
                "duration": 8,  # Veo 3.1 default duration
                "timestamp": datetime.utcnow().isoformat()
            }

        except Exception as veo_error:
            print(f"❌ Veo generation error: {str(veo_error)}")
            raise Exception(f"Veo API error: {str(veo_error)}")

    except Exception as e:
        print(f"❌ Video generation error: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }


def _generate_video_prompt(student_writing: str, age_group: str, video_style: str) -> str:
    """Generate detailed video prompt using Gemini."""
    style_instructions = ""
    if video_style == "cinematic":
        style_instructions = """
This will be CINEMATIC LIVE-ACTION style.
Focus on realistic camera movements, professional cinematography, natural lighting."""
    else:
        style_instructions = """
This will be ANIMATED style.
Focus on colorful, playful animation with smooth character movement and fun visuals."""

    api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
    genai.configure(api_key=api_key)

    model = genai.GenerativeModel(
        "gemini-2.5-flash",
        system_instruction="You are a creative AI generating video prompts for children's stories."
    )

    prompt_request = f"""Based on this student story, create a video prompt for {video_style} style (Age: {age_group}):

Story:
"{student_writing}"

{style_instructions}

Create a detailed, vivid video prompt that captures the essence of the story in {video_style} style.

Respond with JSON:
{{
  "videoActionPrompt": "Detailed action prompt for video..."
}}"""

    response = model.generate_content(prompt_request)
    response_text = response.text.strip()

    # Clean markdown
    if response_text.startswith('```json'):
        response_text = response_text[7:]
    elif response_text.startswith('```'):
        response_text = response_text[3:]
    if response_text.endswith('```'):
        response_text = response_text[:-3]

    result = json.loads(response_text.strip())
    return result.get("videoActionPrompt", "")
