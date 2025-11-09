"""
Fun Writing AI Agents - Main Application (ADK Version)
Google ADK-based AI agents service with FastAPI
Uses ADK tools directly for deterministic workflows
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
from contextlib import asynccontextmanager
import os
from datetime import datetime

# Import ADK tools
from .tools import (
    check_content_safety,
    analyze_student_writing,
    generate_image_from_writing,
    generate_video_from_writing,
    upload_image_to_gcs,
    upload_video_to_gcs,
    validate_image_safety
)


# Lifespan context manager for startup/shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("\n🚀 Initializing Fun Writing AI Agents (Google ADK - Tools Version)...\n")
    print("✅ ADK tools loaded:")
    print("   • check_content_safety")
    print("   • analyze_student_writing")
    print("   • generate_image_from_writing")
    print("   • generate_video_from_writing")
    print("   • upload_image_to_gcs")
    print("   • upload_video_to_gcs")
    print("   • validate_image_safety")
    print("\n✅ Service ready!\n")
    yield
    # Shutdown
    print("\n👋 Shutting down AI Agents service...\n")


# Initialize FastAPI app with lifespan
app = FastAPI(
    title="Fun Writing AI Agents",
    description="Google ADK-based AI agents for creative writing platform",
    version="3.0.0",
    lifespan=lifespan
)


# Pydantic models
class AnalyzeWritingRequest(BaseModel):
    submissionId: str
    userId: str
    studentWriting: str
    originalPrompt: str
    ageGroup: str


class GenerateImageRequest(BaseModel):
    submissionId: str
    userId: str
    studentWriting: str
    ageGroup: str
    imageIndex: int
    imageStyle: Optional[str] = "standard"


class GenerateVideoRequest(BaseModel):
    submissionId: str
    userId: str
    studentWriting: str
    ageGroup: str
    videoStyle: Optional[str] = "animation"


class ValidateImageRequest(BaseModel):
    imageUrl: str
    ageGroup: str
    context: Optional[str] = None


@app.get("/")
async def root():
    """Root endpoint - service info."""
    return {
        "service": "Fun Writing AI Agents",
        "version": "3.0.0",
        "framework": "Google ADK (Tools)",
        "status": "running",
        "endpoints": {
            "health": "/health",
            "analyze_writing": "/analyze-writing",
            "generate_image": "/generate-image",
            "generate_video": "/generate-video",
            "validate_image": "/validate-image"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "OK",
        "service": "fun-writing-ai-agents-adk",
        "framework": "Google ADK (Tools)",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "3.0.0",
        "tools": [
            "check_content_safety",
            "analyze_student_writing",
            "generate_image_from_writing",
            "generate_video_from_writing",
            "upload_image_to_gcs",
            "upload_video_to_gcs",
            "validate_image_safety"
        ]
    }


@app.post("/analyze-writing")
async def analyze_writing(request: AnalyzeWritingRequest):
    """
    Analyze student writing with safety check and feedback.

    This endpoint:
    1. Validates content safety
    2. Evaluates writing if safe
    3. Returns feedback in format expected by backend

    Backend is responsible for:
    - Saving feedback to database
    - Updating user scores and levels
    - Handling transactions
    """
    try:
        print(f"\n📝 Writing Analysis Request")
        print(f"   Submission ID: {request.submissionId}")
        print(f"   User ID: {request.userId}")
        print(f"   Age Group: {request.ageGroup}")

        # Use ADK tool for analysis (includes safety check)
        result = analyze_student_writing(
            student_writing=request.studentWriting,
            original_prompt=request.originalPrompt,
            age_group=request.ageGroup,
            submission_id=request.submissionId,
            user_id=request.userId
        )

        # Tool returns exactly what we need
        if not result["success"]:
            # Content was unsafe or analysis failed
            return JSONResponse(
                status_code=200,
                content={
                    "success": False,
                    "blocked": result.get("blocked", False),
                    "safetyCheck": result.get("safetyCheck", {}),
                    "alertMessage": result.get("alertMessage"),
                    "recommendation": result.get("recommendation")
                }
            )

        # Success - return feedback
        print(f"\n✅ Analysis Complete - Score: {result['score']}/100\n")

        return {
            "success": True,
            "score": result["score"],
            "feedback": result["feedback"],
            "safetyCheck": result.get("safetyCheck", {})
        }

    except Exception as e:
        print(f"❌ Writing analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate-image")
async def generate_image(request: GenerateImageRequest):
    """
    Generate AI image with Gemini 2.5 Flash Image.

    This endpoint:
    1. Generates image from student writing
    2. Uploads to Google Cloud Storage
    3. (Optional) Validates image safety
    4. Returns image URL

    Backend is responsible for:
    - Creating database media record
    - Handling credit deduction and refunds
    - Verifying submission score
    """
    try:
        print(f"\n🖼️  Image Generation Request")
        print(f"   Submission: {request.submissionId}")
        print(f"   Style: {request.imageStyle}, Index: {request.imageIndex}")

        # Step 1: Generate image using ADK tool
        print(f"\n🎨 Step 1: Generating image...")
        image_result = generate_image_from_writing(
            student_writing=request.studentWriting,
            age_group=request.ageGroup,
            image_index=request.imageIndex,
            image_style=request.imageStyle,
            submission_id=request.submissionId
        )

        if not image_result["success"]:
            print(f"❌ Image generation failed: {image_result.get('error')}")
            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "error": image_result.get("error", "Image generation failed"),
                    "imageIndex": request.imageIndex
                }
            )

        # Step 2: Upload to GCS using ADK tool
        print(f"\n📤 Step 2: Uploading to GCS...")
        upload_result = upload_image_to_gcs(
            image_data=image_result["image_data"],
            submission_id=request.submissionId,
            image_index=request.imageIndex,
            file_format="png"
        )

        if not upload_result["success"]:
            print(f"❌ Upload failed: {upload_result.get('error')}")
            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "error": upload_result.get("error", "Upload failed"),
                    "imageIndex": request.imageIndex
                }
            )

        image_url = upload_result["url"]
        print(f"✅ Image uploaded: {image_url}")

        # Step 3: Validate image safety (OPTIONAL - can enable/disable)
        print(f"\n🛡️  Step 3: Image safety validation...")

        # OPTION A: Enable safety validation
        safety_enabled = os.getenv("ENABLE_IMAGE_SAFETY", "false").lower() == "true"

        if safety_enabled:
            safety_result = validate_image_safety(
                image_url=image_url,
                age_group=request.ageGroup,
                context=request.studentWriting[:200]
            )

            if not safety_result["isSafe"]:
                print(f"⚠️  Image flagged as unsafe: {safety_result['riskLevel']}")
                return JSONResponse(
                    status_code=200,
                    content={
                        "success": False,
                        "error": "Image failed safety validation",
                        "alertMessage": safety_result.get("alertMessage"),
                        "safetyCheck": safety_result,
                        "imageIndex": request.imageIndex
                    }
                )

            print(f"✅ Image safety validated")
            safety_check = safety_result
        else:
            # OPTION B: Safety disabled (faster, for testing)
            print(f"⏭️  Image safety validation disabled")
            safety_check = {
                "isSafe": True,
                "riskLevel": "none",
                "reasoning": "Safety validation disabled",
                "timestamp": datetime.utcnow().isoformat()
            }

        # Return success with image URL
        # Backend will create the database record
        print(f"\n✅ Image generation complete\n")

        return {
            "success": True,
            "mediaId": "created-by-backend",  # Backend creates DB record
            "imageUrl": image_url,
            "imageIndex": request.imageIndex,
            "imageStyle": request.imageStyle,
            "prompt": image_result.get("prompt", ""),
            "safetyCheck": safety_check
        }

    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"❌ Image generation error: {str(e)}")
        print(f"   Stack trace:\n{error_trace}")

        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": str(e),
                "imageIndex": request.imageIndex,
                "details": error_trace if os.getenv("NODE_ENV") == "development" else str(e)
            }
        )


@app.post("/generate-video")
async def generate_video(request: GenerateVideoRequest):
    """
    Generate AI video with Veo 3.1.

    This endpoint:
    1. Generates video from student writing
    2. Uploads to Google Cloud Storage
    3. Returns video URL

    Backend is responsible for:
    - Creating database media record
    - Handling credit deduction and refunds
    - Verifying submission score
    """
    try:
        print(f"\n🎬 Video Generation Request")
        print(f"   Submission: {request.submissionId}")
        print(f"   Style: {request.videoStyle}")

        # Step 1: Generate video using ADK tool
        print(f"\n🎬 Step 1: Generating video...")
        video_result = generate_video_from_writing(
            student_writing=request.studentWriting,
            age_group=request.ageGroup,
            video_style=request.videoStyle,
            submission_id=request.submissionId
        )

        if not video_result["success"]:
            print(f"❌ Video generation failed: {video_result.get('error')}")
            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "error": video_result.get("error", "Video generation failed")
                }
            )

        # Step 2: Upload to GCS using ADK tool
        print(f"\n📤 Step 2: Uploading video to GCS...")
        upload_result = upload_video_to_gcs(
            video_data=video_result["video_data"],
            submission_id=request.submissionId,
            file_format="mp4"
        )

        if not upload_result["success"]:
            print(f"❌ Upload failed: {upload_result.get('error')}")
            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "error": upload_result.get("error", "Upload failed")
                }
            )

        video_url = upload_result["url"]
        print(f"✅ Video uploaded: {video_url}")

        # Return success with video URL
        # Backend will create the database record
        print(f"\n✅ Video generation complete\n")

        return {
            "success": True,
            "mediaId": "created-by-backend",  # Backend creates DB record
            "videoUrl": video_url,
            "description": f"AI-generated {request.videoStyle} style video based on your story",
            "duration": video_result.get("duration", 8),
            "videoStyle": request.videoStyle,
            "prompt": video_result.get("prompt", "")
        }

    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"❌ Video generation error: {str(e)}")
        print(f"   Stack trace:\n{error_trace}")

        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": str(e),
                "details": error_trace if os.getenv("NODE_ENV") == "development" else str(e)
            }
        )


@app.post("/validate-image")
async def validate_image(request: ValidateImageRequest):
    """
    Validate generated image for safety issues.

    Uses Gemini vision to detect inappropriate content.
    """
    try:
        print(f"\n🖼️  Image Safety Validation Request")
        print(f"   Image URL: {request.imageUrl}")
        print(f"   Age Group: {request.ageGroup}")

        # Use ADK tool for validation
        safety_result = validate_image_safety(
            image_url=request.imageUrl,
            age_group=request.ageGroup,
            context=request.context or ""
        )

        # Return result
        response = {
            "success": True,
            "safetyCheck": safety_result,
            "isSafe": safety_result["isSafe"],
            "blocked": not safety_result["isSafe"]
        }

        if not safety_result["isSafe"]:
            response["alertMessage"] = safety_result.get(
                "alertMessage",
                "⚠️ This image has been flagged and will be reviewed."
            )
            print(f"   🚨 Image blocked: {safety_result['riskLevel']} risk\n")
        else:
            print(f"   ✅ Image approved\n")

        return response

    except Exception as e:
        print(f"❌ Image validation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
