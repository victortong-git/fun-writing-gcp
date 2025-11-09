#!/usr/bin/env python3
"""
Startup script for Fun Writing AI Agents Cloud Run service
"""
import os
import sys

def validate_environment():
    """Validate required environment variables and configuration."""
    print("🔍 Validating environment...")

    # Check PORT
    port = os.getenv("PORT", "8080")
    print(f"   ✓ PORT: {port}")

    # Check API key (warn but don't fail)
    api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
    if api_key:
        print(f"   ✓ GOOGLE_API_KEY: {'*' * 10} (configured)")
    else:
        print(f"   ⚠ GOOGLE_API_KEY: not set (API calls will fail)")

    # Check GCS bucket
    gcs_bucket = os.getenv("GCS_BUCKET_NAME", "not set")
    print(f"   ✓ GCS_BUCKET_NAME: {gcs_bucket}")

    # Check project ID
    project_id = os.getenv("GCP_PROJECT_ID", "not set")
    print(f"   ✓ GCP_PROJECT_ID: {project_id}")

    print("✅ Environment validation complete\n")
    return port

def main():
    """Start the FastAPI application with uvicorn."""
    print("\n" + "="*60)
    print("🚀 Fun Writing AI Agents - Starting")
    print("   Framework: Google ADK (Tools)")
    print("   Version: 3.0.0")
    print("="*60 + "\n")

    try:
        # Validate environment
        port = validate_environment()

        # Import uvicorn
        print("📦 Loading uvicorn...")
        import uvicorn

        # Import the app
        print("📦 Loading FastAPI application...")
        from python_agents.main import app

        print(f"🌐 Starting server on 0.0.0.0:{port}...")
        print(f"📊 Health check will be available at: http://0.0.0.0:{port}/health\n")

        # Start uvicorn
        uvicorn.run(
            app,
            host="0.0.0.0",
            port=int(port),
            log_level="info",
            access_log=True
        )

    except ImportError as e:
        print(f"❌ Import error: {e}", file=sys.stderr)
        print(f"   Make sure all dependencies are installed", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"❌ Startup error: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
