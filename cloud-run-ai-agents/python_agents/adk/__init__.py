"""
ADK (Agent Development Kit) - Re-exports from google.adk
"""

from google.adk.agents import LlmAgent, Agent

# For backwards compatibility with our existing code
def get_model(model_name: str = "gemini-2.5-flash"):
    """Return the model name - ADK agents take model name as string"""
    return model_name

__all__ = ['LlmAgent', 'Agent', 'get_model']
