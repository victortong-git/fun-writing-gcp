"""
ADK Models - Model name helper for backwards compatibility
"""

def get_model(model_name: str = "gemini-2.5-flash"):
    """
    Return the model name.
    Google ADK agents accept model names as strings directly.
    This function exists for backwards compatibility with our existing code.
    """
    return model_name

__all__ = ['get_model']
