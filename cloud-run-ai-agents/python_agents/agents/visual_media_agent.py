"""
Visual Media Agent - Google ADK Implementation
Generates images and videos from student writing using Google ADK framework
Uses Gemini 2.5 Flash Image and Veo 3.1 for media generation
"""

from python_agents.adk.agents import LlmAgent
from python_agents.adk.models import get_model
import json
from datetime import datetime
from typing import Dict, Any, Optional
import google.generativeai as genai
import os


class VisualMediaAgent:
    """
    ADK-based agent for generating visual media (images and videos).
    Uses Gemini for prompt generation and image/video generation APIs.
    """

    def __init__(self, model_name: str = "gemini-2.5-flash"):
        self.name = "VisualMediaAgent"
        self.model_name = model_name

        # Initialize Google Generative AI for image/video generation
        api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
        if api_key:
            genai.configure(api_key=api_key)

        # Initialize GenAI client for video generation
        try:
            from google import genai as google_genai
            self.genai_client = google_genai.Client(api_key=api_key)
        except Exception as e:
            print(f"⚠️  Warning: Could not initialize GenAI client: {e}")
            self.genai_client = None

        # Initialize ADK agent for prompt generation
        self.agent = LlmAgent(
            name="visual_media_generation_agent",
            model=get_model(model_name),
            instruction="""You are a creative AI specializing in generating visual prompts for children's stories.

Your responsibilities:
1. Generate detailed, vivid image prompts from story text
2. Generate video scene descriptions for animations
3. Ensure all prompts are age-appropriate and child-friendly
4. Create engaging, colorful, educational visual descriptions
5. Adapt prompts for different visual styles (comic, manga, princess, standard)

Always create safe, positive, imaginative visual prompts suitable for children.
Always respond with structured JSON format."""
        )

    async def generate_image_prompt(
        self,
        student_writing: str,
        age_group: str,
        image_index: int,
        image_style: str = "standard"
    ) -> str:
        """
        Generate detailed image prompt for visual generation.

        Args:
            student_writing: Student's story
            age_group: Age group
            image_index: Which image number (1, 2, 3)
            image_style: 'standard', 'comic', 'manga', or 'princess'

        Returns:
            Detailed image prompt string
        """
        try:
            scene_descriptions = [
                "the opening scene or setting",
                "a key moment or action in the middle",
                "the climax or most exciting part",
                "the resolution or ending",
                "an important character or creature",
                "a magical or special object mentioned"
            ]

            scene_desc = scene_descriptions[min(image_index - 1, len(scene_descriptions) - 1)]

            style_instructions = self._get_style_instructions(image_style)

            prompt = f"""Based on this student story (Age: {age_group}), generate a detailed visual prompt for image #{image_index} focusing on {scene_desc}:

Story:
"{student_writing}"

{style_instructions}

Create a detailed, vivid image prompt that captures this aspect of the story. The prompt should be specific, descriptive, and suitable for a child-friendly image generation model.

Respond with JSON:
{{
  "prompt": "Detailed image prompt here..."
}}"""

            response = await self.agent.run(prompt)

            # Debug logging
            print(f"   🔍 Agent response type: {type(response.content)}")
            print(f"   🔍 Agent response preview: {str(response.content)[:200]}")

            try:
                result = json.loads(response.content)
                print(f"   🔍 Parsed result type: {type(result)}")

                # Check if response indicates an error
                if not result.get("success", True) or "error" in result:
                    error_msg = result.get("error", "Unknown error generating image prompt")
                    print(f"❌ [{self.name}] Agent returned error: {error_msg}")
                    raise Exception(f"Image prompt generation failed: {error_msg}")

                prompt_text = result.get("prompt", "")

                # Ensure prompt_text is a string
                if not isinstance(prompt_text, str):
                    print(f"❌ [{self.name}] Prompt is not a string: {type(prompt_text)}")
                    raise Exception(f"Invalid prompt type: {type(prompt_text)}, expected str")

                if not prompt_text:
                    raise Exception("Empty prompt returned from agent")

                print(f"   ✅ Extracted prompt (length: {len(prompt_text)})")
                return prompt_text

            except json.JSONDecodeError as je:
                print(f"❌ [{self.name}] JSON decode error. Raw response: {response.content[:500] if response.content else 'empty'}")
                # If JSON parsing fails, the response itself is not valid
                # Do NOT return anything, just raise the error
                raise Exception(f"Agent returned invalid JSON: {str(je)}")
            except Exception as e:
                # Make sure we're not swallowing errors
                print(f"❌ [{self.name}] Error processing response: {str(e)}")
                raise

        except Exception as e:
            print(f"❌ [{self.name}] Image prompt generation error: {str(e)}")
            raise

    async def generate_video_prompt(
        self,
        student_writing: str,
        age_group: str,
        video_style: str = "animation"
    ) -> str:
        """
        Generate video prompt for Veo 3.1 generation.

        Args:
            student_writing: Student's story
            age_group: Age group
            video_style: 'animation' or 'cinematic'

        Returns:
            Detailed video prompt string
        """
        try:
            style_instructions = ""
            if video_style == "cinematic":
                style_instructions = """
IMPORTANT: This will be rendered as a CINEMATIC LIVE-ACTION style video.
Focus on realistic camera movements, professional cinematography, natural lighting.
Think film-like quality with smooth camera pans, zooms, and professional framing."""
            else:
                style_instructions = """
IMPORTANT: This will be rendered as an ANIMATED style video.
Focus on colorful, playful animation with smooth character movement and fun visuals.
Think Pixar/Disney animation style with vibrant colors and engaging motion."""

            prompt = f"""Based on this student story, create a video prompt for {video_style} style (Age: {age_group}):

Story:
"{student_writing}"

{style_instructions}

Create a detailed, vivid video prompt that captures the essence of the story in {video_style} style.
The prompt should be specific, descriptive, and suitable for a child-friendly video generation model.

Respond with JSON:
{{
  "videoActionPrompt": "Detailed action prompt for video generation..."
}}"""

            response = await self.agent.run(prompt)

            # Debug logging
            print(f"   🔍 Agent response type: {type(response.content)}")
            print(f"   🔍 Agent response preview: {str(response.content)[:200]}")

            try:
                result = json.loads(response.content)
                print(f"   🔍 Parsed result type: {type(result)}")

                # Check if response indicates an error
                if not result.get("success", True) or "error" in result:
                    error_msg = result.get("error", "Unknown error generating video prompt")
                    print(f"❌ [{self.name}] Agent returned error: {error_msg}")
                    raise Exception(f"Video prompt generation failed: {error_msg}")

                prompt_text = result.get("videoActionPrompt", "")

                # Ensure prompt_text is a string
                if not isinstance(prompt_text, str):
                    print(f"❌ [{self.name}] Video prompt is not a string: {type(prompt_text)}")
                    raise Exception(f"Invalid video prompt type: {type(prompt_text)}, expected str")

                if not prompt_text:
                    raise Exception("Empty video prompt returned from agent")

                print(f"   ✅ Extracted video prompt (length: {len(prompt_text)})")
                return prompt_text

            except json.JSONDecodeError as je:
                print(f"❌ [{self.name}] JSON decode error. Raw response: {response.content[:500] if response.content else 'empty'}")
                # If JSON parsing fails, the response itself is not valid
                # Do NOT return anything, just raise the error
                raise Exception(f"Agent returned invalid JSON: {str(je)}")
            except Exception as e:
                # Make sure we're not swallowing errors
                print(f"❌ [{self.name}] Error processing video response: {str(e)}")
                raise

        except Exception as e:
            print(f"❌ [{self.name}] Video prompt generation error: {str(e)}")
            raise

    async def generate_image_with_gemini(
        self,
        image_prompt: str,
        image_style: str = "standard"
    ) -> bytes:
        """
        Generate image using Gemini 2.5 Flash Image.

        Args:
            image_prompt: The prompt for image generation
            image_style: 'standard', 'comic', 'manga', or 'princess'

        Returns:
            Image data as bytes
        """
        try:
            if not self.genai_client:
                raise Exception("GenAI client not initialized")

            print(f"   🎨 Calling Gemini 2.5 Flash Image API with {image_style} style...")

            # Determine aspect ratio based on style
            aspect_ratio = "2:3" if image_style in ['comic', 'manga', 'princess'] else "16:9"

            # Generate image with Gemini 2.5 Flash Image model
            from google.genai import types

            response = self.genai_client.models.generate_content(
                model='gemini-2.5-flash-image',
                contents=[image_prompt],
                config=types.GenerateContentConfig(
                    image_config=types.ImageConfig(
                        aspect_ratio=aspect_ratio,
                    )
                )
            )

            # Extract image data from response
            if not response.candidates or len(response.candidates) == 0:
                raise Exception("No image generated from Gemini")

            candidate = response.candidates[0]
            if not candidate.content or not candidate.content.parts:
                raise Exception("Invalid response structure")

            # Find inline image data
            image_data = None
            for part in candidate.content.parts:
                if part.inline_data is not None:
                    # inline_data.data might be base64 string or bytes
                    # Convert to bytes if needed (following Node.js pattern)
                    import base64
                    data = part.inline_data.data

                    # Check if it's a string (base64) or already bytes
                    if isinstance(data, str):
                        # It's base64, decode it
                        image_data = base64.b64decode(data)
                    elif isinstance(data, bytes):
                        # Already bytes, use as-is
                        image_data = data
                    else:
                        # Unknown type, try to convert
                        print(f"   ⚠️  Unknown data type: {type(data)}, attempting conversion...")
                        try:
                            image_data = bytes(data)
                        except:
                            image_data = base64.b64decode(str(data))
                    break

            if not image_data:
                raise Exception("No image data in response")

            print(f"   ✅ Image generated ({len(image_data)} bytes)")
            return image_data

        except Exception as e:
            print(f"❌ [{self.name}] Image generation error: {str(e)}")
            raise

    async def generate_video_with_veo(
        self,
        video_prompt: str,
        video_style: str = "animation"
    ) -> bytes:
        """
        Generate video using Veo 3.1 API.

        Args:
            video_prompt: The prompt for video generation
            video_style: 'animation' or 'cinematic'

        Returns:
            Video data as bytes
        """
        try:
            if not self.genai_client:
                raise Exception("GenAI client not initialized")

            print(f"   🎬 Calling Veo 3.1 API with {video_style} style...")

            # Start video generation operation
            import time
            operation = self.genai_client.models.generate_videos(
                model="veo-3.1-fast-generate-preview",
                prompt=video_prompt,
            )

            print(f"   ⏳ Video generation started (operation: {operation.name if hasattr(operation, 'name') else 'unknown'})")

            # Poll the operation status until the video is ready
            poll_count = 0
            max_polls = 120  # 10 minutes max (120 * 5 seconds)

            while not operation.done:
                if poll_count >= max_polls:
                    raise Exception("Video generation timed out after 10 minutes")

                print(f"   ⏳ Waiting for video generation ({poll_count + 1}/{max_polls})...")
                time.sleep(5)
                operation = self.genai_client.operations.get(operation)
                poll_count += 1

            print(f"   ✅ Video generation completed after {poll_count * 5} seconds")

            # Download the generated video
            if not hasattr(operation, 'response') or not hasattr(operation.response, 'generated_videos'):
                raise Exception("Invalid operation response structure")

            if not operation.response.generated_videos:
                raise Exception("No videos generated in response")

            generated_video = operation.response.generated_videos[0]

            # Download video data
            print(f"   📥 Downloading video data...")
            video_file = self.genai_client.files.download(file=generated_video.video)

            # Read video bytes
            if hasattr(video_file, 'read'):
                video_data = video_file.read()
            elif hasattr(video_file, 'content'):
                video_data = video_file.content
            else:
                # Try to save and read back
                import tempfile
                with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp:
                    generated_video.video.save(tmp.name)
                    tmp.seek(0)
                    video_data = tmp.read()

            print(f"   ✅ Video downloaded ({len(video_data)} bytes)")
            return video_data

        except Exception as e:
            print(f"❌ [{self.name}] Video generation error: {str(e)}")
            raise

    def _get_style_instructions(self, image_style: str) -> str:
        """Get style-specific instructions for image generation."""
        safety_guidelines = """
Avoid: violence, scary imagery, adult themes, dark themes, weapons.
Ensure: age-appropriate, educational, friendly characters, positive themes."""

        if image_style == "comic":
            return f"""Create a HERO COMIC STYLE illustration with 3 to 4 comic panels showing the story progression.

Style: Vibrant superhero comic book art, bold outlines, dynamic action poses.
Layout: 3-4 distinct comic panels arranged vertically or in a grid.
Colors: Bright, bold, saturated colors typical of superhero comics.
Characters: Heroic, confident, diverse, child-friendly superhero characters.
{safety_guidelines}
Art style: Marvel/DC Comics inspired, professional comic book illustration."""

        elif image_style == "manga":
            return f"""Create a BLACK AND WHITE MANGA STYLE illustration with 3 to 4 manga panels showing the story.

Style: Japanese manga art, dramatic angles, expressive characters.
Layout: 3-4 distinct manga panels with clear panel borders.
Colors: BLACK AND WHITE only, using shading, screen tones, and ink work.
Characters: Expressive eyes, dynamic poses, manga-style emotions.
{safety_guidelines}
Art style: Shonen/Shoujo manga inspired, professional manga illustration, NO COLOR."""

        elif image_style == "princess":
            return f"""Create a PRINCESS COMIC STYLE illustration with 3 to 4 comic panels showing the magical story.

Style: Enchanting fairy tale comic art, delicate linework, magical atmosphere.
Layout: 3-4 distinct comic panels arranged beautifully.
Colors: Soft pastels, pinks, purples, golds, with sparkles and magical elements.
Characters: Graceful princesses, friendly magical creatures, flowing gowns and tiaras.
Setting: Castles, enchanted forests, magical gardens.
{safety_guidelines}
Art style: Disney Princess inspired, elegant and enchanting comic panels."""

        else:  # standard
            return f"""Create a colorful, child-friendly illustration for a children's story.
Style: whimsical, educational, age-appropriate, vibrant colors, friendly characters.
{safety_guidelines}
Art style: storybook illustration, Disney/Pixar style, friendly and engaging."""

    def get_info(self) -> Dict[str, Any]:
        """Get agent information."""
        return {
            "name": self.name,
            "framework": "Google ADK",
            "model": self.model_name,
            "description": "Visual media generation agent for images and videos",
            "capabilities": [
                "Generate image prompts from stories",
                "Generate video prompts from stories",
                "Support multiple visual styles",
                "Age-appropriate content creation",
                "Integration with Gemini 2.5 Flash Image",
                "Integration with Veo 3.1"
            ]
        }
