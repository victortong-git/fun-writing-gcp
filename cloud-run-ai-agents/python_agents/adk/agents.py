"""
ADK Agents - Wrapper around google.adk with compatibility layer
"""

from google.adk.agents import LlmAgent as _GoogleLlmAgent, Agent as _GoogleAgent
import google.generativeai as genai
import os
from typing import Any, Dict, Optional
import json


class AgentResponse:
    """Simple response wrapper"""
    def __init__(self, text: str):
        self.content = text
        self.text = text


class LlmAgent:
    """
    Wrapper around Google ADK LlmAgent that provides a simple run() interface
    for backwards compatibility with our existing code.
    """

    def __init__(self, name: str, model: str, instruction: Optional[str] = None, **kwargs):
        self.name = name
        self.model_name = model
        self.instruction = instruction

        # Configure genai
        api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
        if api_key:
            genai.configure(api_key=api_key)

        # Map model names to actual Gemini model IDs
        model_mapping = {
            "gemini-2.5-flash": "gemini-2.5-flash",
            "gemini-flash": "gemini-2.5-flash",
            "gemini-pro": "gemini-2.5-flash"
        }
        actual_model = model_mapping.get(model, model)

        # Create underlying Gemini model
        self.gemini_model = genai.GenerativeModel(
            actual_model,
            system_instruction=instruction
        )

    async def run(self, prompt: str = None, message: str = None, context: Optional[Dict[str, Any]] = None, images: Optional[list] = None) -> AgentResponse:
        """
        Run the agent with a prompt and return response.
        Supports multimodal input with images.

        Args:
            prompt: Input prompt (legacy parameter)
            message: Input message (alternative to prompt)
            context: Optional context dict (unused for now)
            images: Optional list of image data (bytes) for multimodal analysis

        Returns:
            AgentResponse with .content and .text attributes
        """
        try:
            # Support both 'prompt' and 'message' parameters
            text_input = prompt or message
            if not text_input:
                raise ValueError("Either 'prompt' or 'message' parameter must be provided")

            # Build content for generate_content
            if images and len(images) > 0:
                # Multimodal input with images
                from PIL import Image
                import io

                content_parts = [text_input]

                # Add images to content
                for image_data in images:
                    if isinstance(image_data, bytes):
                        # Convert bytes to PIL Image
                        pil_image = Image.open(io.BytesIO(image_data))
                        content_parts.append(pil_image)
                    else:
                        # Assume it's already a PIL Image
                        content_parts.append(image_data)

                response = self.gemini_model.generate_content(content_parts)
            else:
                # Text-only input
                response = self.gemini_model.generate_content(text_input)

            # Safely extract text from response
            try:
                text = response.text
            except Exception as text_error:
                # If .text fails, try to get candidates or prompt feedback
                if hasattr(response, 'prompt_feedback'):
                    error_msg = f"Response blocked: {response.prompt_feedback}"
                elif hasattr(response, 'candidates') and response.candidates:
                    error_msg = f"Response generation issue with candidates: {response.candidates}"
                else:
                    error_msg = f"Failed to extract text from response: {str(text_error)}"

                error_response = json.dumps({"error": error_msg, "success": False})
                return AgentResponse(error_response)

            # Clean up the response - remove markdown code blocks if present
            text = text.strip()
            if text.startswith('```json'):
                text = text[7:]  # Remove ```json
            elif text.startswith('```'):
                text = text[3:]  # Remove ```
            if text.endswith('```'):
                text = text[:-3]  # Remove closing ```
            text = text.strip()

            return AgentResponse(text)
        except Exception as e:
            # Return error as JSON
            error_response = json.dumps({"error": str(e), "success": False})
            return AgentResponse(error_response)

    def get_info(self) -> Dict[str, Any]:
        """Get agent information"""
        return {
            "name": self.name,
            "model": self.model_name,
            "has_instruction": self.instruction is not None
        }


# Also export the original classes
Agent = _GoogleAgent

__all__ = ['LlmAgent', 'Agent']
