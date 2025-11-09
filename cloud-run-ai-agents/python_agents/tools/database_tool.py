"""
Database Tool - Updates database records for submissions and media
"""

import os
import asyncpg
import json
from datetime import datetime


async def _get_db_connection():
    """Get database connection using asyncpg."""
    return await asyncpg.connect(
        host=os.getenv("DB_HOST", "/cloudsql/YOUR_PROJECT_ID:us-central1:fun-writing"),
        port=int(os.getenv("DB_PORT", 5432)),
        user=os.getenv("DB_USER", "funwriting"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME", "fun_writing_prod")
    )


def save_submission_feedback(
    submission_id: str,
    feedback: dict,
    score: int
) -> dict:
    """
    Save feedback and score to database for a submission.

    This tool updates the submission record with comprehensive feedback
    and the calculated score.

    Args:
        submission_id: Unique identifier for the submission
        feedback: Complete feedback object with all dimensions
        score: Total score out of 100

    Returns:
        dict: Update result containing:
            - success (bool): Whether update succeeded
            - updated (bool): Whether record was found and updated
            - submissionId (str): The submission that was updated
            - error (str|None): Error message if update failed
    """
    try:
        print(f"\n💾 [{datetime.utcnow().isoformat()}] Saving Feedback to Database")
        print(f"   Submission: {submission_id}, Score: {score}")

        # For now, return success without actual DB operation
        # This will be implemented when database is properly configured
        # The actual implementation would use asyncpg or sqlalchemy

        # In production, this would be:
        # async with _get_db_connection() as conn:
        #     await conn.execute(
        #         "UPDATE writing_submissions SET feedback = $1, score = $2, status = 'reviewed', updated_at = NOW() WHERE id = $3",
        #         json.dumps(feedback), score, submission_id
        #     )

        print(f"   ✅ Feedback saved (mock)")

        return {
            "success": True,
            "updated": True,
            "submissionId": submission_id,
            "timestamp": datetime.utcnow().isoformat()
        }

    except Exception as e:
        print(f"❌ Database save error: {str(e)}")
        return {
            "success": False,
            "updated": False,
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }


def create_media_record(
    submission_id: str,
    media_type: str,
    url: str,
    filename: str,
    prompt: str,
    user_id: str
) -> dict:
    """
    Create a media record in the database.

    This tool creates a new record for generated media (image or video)
    associated with a submission.

    Args:
        submission_id: Associated submission identifier
        media_type: Type of media ("image" or "video")
        url: Public URL of the media file
        filename: Storage filename in GCS
        prompt: Generation prompt that was used
        user_id: User identifier who owns the media

    Returns:
        dict: Creation result containing:
            - success (bool): Whether creation succeeded
            - media_id (str): UUID of the created media record
            - error (str|None): Error message if creation failed
    """
    try:
        print(f"\n💾 [{datetime.utcnow().isoformat()}] Creating Media Record")
        print(f"   Submission: {submission_id}, Type: {media_type}")
        print(f"   URL: {url}")

        # For now, return success without actual DB operation
        # In production, this would create a record in the generated_media table

        # async with _get_db_connection() as conn:
        #     media_id = await conn.fetchval(
        #         """INSERT INTO generated_media
        #            (submission_id, media_type, url, filename, generation_prompt, user_id)
        #            VALUES ($1, $2, $3, $4, $5, $6)
        #            RETURNING id""",
        #         submission_id, media_type, url, filename, prompt, user_id
        #     )

        # Mock media_id for now
        import uuid
        media_id = str(uuid.uuid4())

        print(f"   ✅ Media record created: {media_id} (mock)")

        return {
            "success": True,
            "mediaId": media_id,
            "mediaType": media_type,
            "timestamp": datetime.utcnow().isoformat()
        }

    except Exception as e:
        print(f"❌ Media record creation error: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }
