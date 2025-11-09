"""
Image Generation Tool - Generates AI images using Gemini 2.5 Flash Image
"""

import google.generativeai as genai
import os
import json
from datetime import datetime


def generate_image_from_writing(
    student_writing: str,
    age_group: str,
    image_index: int,
    image_style: str,
    submission_id: str
) -> dict:
    """
    Generate an AI image based on student writing using Gemini 2.5 Flash Image.

    This tool creates vivid, child-friendly image prompts from stories and
    generates images using Google's Gemini 2.5 Flash Image model.

    Args:
        student_writing: The student's story text
        age_group: Student's age group (e.g., "7-11", "11-14")
        image_index: Which scene to illustrate (1, 2, 3, 4, 5, 6)
        image_style: Visual style ("standard"|"comic"|"manga"|"princess")
        submission_id: Submission identifier for tracking

    Returns:
        dict: Generation result containing:
            - success (bool): Whether generation succeeded
            - image_data (bytes): Raw image data
            - prompt (str): The generated image prompt
            - style (str): Image style used
            - aspectRatio (str): Aspect ratio (e.g., "16:9", "2:3")
            - error (str|None): Error message if generation failed
    """
    try:
        print(f"\n🎨 [{datetime.utcnow().isoformat()}] Image Generation")
        print(f"   Submission: {submission_id}, Index: {image_index}, Style: {image_style}")

        # Step 1: Generate image prompt
        print(f"   📝 Step 1: Generating image prompt...")
        prompt = _generate_image_prompt(student_writing, age_group, image_index, image_style)

        if not prompt:
            raise Exception("Failed to generate image prompt")

        print(f"   Prompt: {prompt[:100]}..." if len(prompt) > 100 else f"   Prompt: {prompt}")

        # Step 2: Generate image with Gemini 2.5 Flash Image
        print(f"   🎨 Step 2: Generating image with Gemini...")

        api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise Exception("No API key found for Gemini")

        try:
            from google.genai import Client
            from google.genai import types

            client = Client(api_key=api_key)

            # Determine aspect ratio based on style
            aspect_ratio = "2:3" if image_style in ['comic', 'manga', 'princess'] else "16:9"

            # Generate image
            response = client.models.generate_content(
                model='gemini-2.5-flash-image',
                contents=[prompt],
                config=types.GenerateContentConfig(
                    image_config=types.ImageConfig(
                        aspect_ratio=aspect_ratio,
                    )
                )
            )

            # Extract image data
            if not response.candidates or len(response.candidates) == 0:
                raise Exception("No image generated from Gemini")

            candidate = response.candidates[0]
            if not candidate.content or not candidate.content.parts:
                raise Exception("Invalid response structure")

            # Find inline image data
            image_data = None
            for part in candidate.content.parts:
                if part.inline_data is not None:
                    import base64
                    data = part.inline_data.data

                    if isinstance(data, str):
                        image_data = base64.b64decode(data)
                    elif isinstance(data, bytes):
                        image_data = data
                    else:
                        try:
                            image_data = bytes(data)
                        except:
                            image_data = base64.b64decode(str(data))
                    break

            if not image_data:
                raise Exception("No image data in response")

            print(f"   ✅ Image generated ({len(image_data)} bytes)")

            return {
                "success": True,
                "image_data": image_data,
                "prompt": prompt,
                "style": image_style,
                "aspectRatio": aspect_ratio,
                "timestamp": datetime.utcnow().isoformat()
            }

        except Exception as gemini_error:
            print(f"❌ Gemini image generation error: {str(gemini_error)}")
            raise Exception(f"Gemini API error: {str(gemini_error)}")

    except Exception as e:
        print(f"❌ Image generation error: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }


def _generate_image_prompt(
    student_writing: str,
    age_group: str,
    image_index: int,
    image_style: str
) -> str:
    """Generate detailed image prompt using Gemini."""
    scene_descriptions = [
        "the opening scene or setting",
        "a key moment or action in the middle",
        "the climax or most exciting part",
        "the resolution or ending",
        "an important character or creature",
        "a magical or special object mentioned"
    ]

    scene_desc = scene_descriptions[min(image_index - 1, len(scene_descriptions) - 1)]
    style_instructions = _get_style_instructions(image_style)

    api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
    genai.configure(api_key=api_key)

    model = genai.GenerativeModel(
        "gemini-2.5-flash",
        system_instruction="You are a creative AI generating visual prompts for children's stories."
    )

    prompt_request = f"""Based on this student story (Age: {age_group}), generate a detailed visual prompt for image #{image_index} focusing on {scene_desc}:

Story:
"{student_writing}"

{style_instructions}

Create a detailed, vivid image prompt that captures this aspect of the story. The prompt should be specific, descriptive, and suitable for a child-friendly image generation model.

Respond with JSON:
{{
  "prompt": "Detailed image prompt here..."
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
    return result.get("prompt", "")


def _get_style_instructions(image_style: str) -> str:
    """Get style-specific instructions."""
    safety_guidelines = """
Avoid: violence, scary imagery, adult themes, dark themes, weapons.
Ensure: age-appropriate, educational, friendly characters, positive themes."""

    if image_style == "comic":
        return f"""Create a HERO COMIC STYLE illustration with 3 to 4 comic panels.
Style: Vibrant superhero comic book art, bold outlines, dynamic poses.
Colors: Bright, bold, saturated colors.
{safety_guidelines}"""

    elif image_style == "manga":
        return f"""Create a BLACK AND WHITE MANGA STYLE illustration with 3 to 4 panels.
Style: Japanese manga art, dramatic angles, expressive characters.
Colors: BLACK AND WHITE only.
{safety_guidelines}"""

    elif image_style == "princess":
        return f"""Create a PRINCESS COMIC STYLE illustration with 3 to 4 panels.
Style: Enchanting fairy tale comic art, delicate linework, magical atmosphere.
Colors: Soft pastels, pinks, purples, golds, with sparkles.
{safety_guidelines}"""

    else:  # standard
        return f"""Create a colorful, child-friendly illustration.
Style: whimsical, educational, vibrant colors, friendly characters.
{safety_guidelines}"""
