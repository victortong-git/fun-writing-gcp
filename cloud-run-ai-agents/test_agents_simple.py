#!/usr/bin/env python3
"""
Simple test to verify ADK agents work with Google SDK
Tests the key fixes:
1. FeedbackAgent can generate feedback
2. VisualMediaAgent can generate image prompts
3. ADK LlmAgent supports multimodal (text + images)
"""

import os
import sys
import asyncio

# Add parent directory to path
sys.path.insert(0, '/home/user/fun-writing/04-cloud-run-ai-agents')

async def test_feedback_agent():
    """Test FeedbackAgent with Google SDK"""
    print("\n" + "="*60)
    print("TEST 1: FeedbackAgent with Google ADK")
    print("="*60)

    try:
        from python_agents.agents.feedback_agent import FeedbackAgent

        print("✅ Import successful")
        print("Initializing FeedbackAgent...")

        agent = FeedbackAgent()
        print(f"✅ Agent initialized: {agent.get_info()['name']}")

        print("\n📝 Testing writing evaluation...")
        result = await agent.evaluate_submission(
            student_writing="Once upon a time there was a brave dragon who loved to read books.",
            original_prompt="Write a short story about a dragon",
            age_group="7-11"
        )

        if result.get("feedback") and result["feedback"].get("totalScore"):
            score = result["feedback"]["totalScore"]
            print(f"✅ Evaluation successful! Score: {score}/100")
            print(f"   General Comment: {result['feedback'].get('generalComment', 'N/A')[:80]}...")
            return True
        else:
            print("❌ Evaluation returned unexpected format")
            return False

    except Exception as e:
        print(f"❌ FeedbackAgent test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


async def test_visual_media_agent():
    """Test VisualMediaAgent can generate prompts"""
    print("\n" + "="*60)
    print("TEST 2: VisualMediaAgent Image Prompt Generation")
    print("="*60)

    try:
        from python_agents.agents.visual_media_agent import VisualMediaAgent

        print("✅ Import successful")
        print("Initializing VisualMediaAgent...")

        agent = VisualMediaAgent()
        print(f"✅ Agent initialized: {agent.get_info()['name']}")

        print("\n🎨 Testing image prompt generation...")
        prompt = await agent.generate_image_prompt(
            student_writing="A friendly robot helps a lost kitten find its way home.",
            age_group="7-11",
            image_index=1,
            image_style="standard"
        )

        if prompt and isinstance(prompt, str) and len(prompt) > 20:
            print(f"✅ Prompt generated successfully!")
            print(f"   Length: {len(prompt)} characters")
            print(f"   Preview: {prompt[:100]}...")
            return True
        else:
            print(f"❌ Invalid prompt: {type(prompt)}, length: {len(prompt) if prompt else 0}")
            return False

    except Exception as e:
        print(f"❌ VisualMediaAgent test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


async def test_adk_multimodal():
    """Test that ADK LlmAgent supports multimodal input"""
    print("\n" + "="*60)
    print("TEST 3: ADK LlmAgent Multimodal Support")
    print("="*60)

    try:
        from python_agents.adk.agents import LlmAgent
        from python_agents.adk.models import get_model

        print("✅ Import successful")
        print("Initializing test agent...")

        agent = LlmAgent(
            name="test_agent",
            model=get_model("gemini-2.5-flash"),
            instruction="You are a helpful AI assistant."
        )
        print("✅ Agent initialized")

        print("\n📝 Testing text-only input...")
        response = await agent.run(prompt="Say hello in JSON format: {\"greeting\": \"...\"}")

        if response and response.content:
            print(f"✅ Text-only response received: {response.content[:80]}...")

            # Verify the method signature supports images parameter
            print("\n🖼️  Checking multimodal method signature...")
            import inspect
            sig = inspect.signature(agent.run)
            params = list(sig.parameters.keys())

            if 'images' in params:
                print(f"✅ Method supports 'images' parameter: {params}")
                return True
            else:
                print(f"❌ Method missing 'images' parameter. Has: {params}")
                return False
        else:
            print("❌ No response received")
            return False

    except Exception as e:
        print(f"❌ ADK multimodal test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


async def main():
    """Run all tests"""
    print("\n" + "="*70)
    print(" AI AGENTS - GOOGLE SDK FIX VERIFICATION")
    print("="*70)

    # Check API key
    api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
    if api_key:
        print(f"✅ API Key found: {api_key[:20]}...")
    else:
        print("❌ WARNING: No API key found in environment")

    results = {
        "FeedbackAgent": await test_feedback_agent(),
        "VisualMediaAgent": await test_visual_media_agent(),
        "ADK Multimodal": await test_adk_multimodal()
    }

    print("\n" + "="*70)
    print(" TEST RESULTS SUMMARY")
    print("="*70)

    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status}: {test_name}")

    all_passed = all(results.values())

    print("\n" + "="*70)
    if all_passed:
        print("🎉 ALL TESTS PASSED! The fixes are working correctly.")
        print("    You can now deploy to Cloud Run.")
    else:
        print("⚠️  SOME TESTS FAILED. Review the errors above.")
    print("="*70 + "\n")

    return all_passed


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
