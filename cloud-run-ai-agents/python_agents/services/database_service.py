"""
Database Service for Python ADK Agents
Handles Cloud SQL PostgreSQL operations
"""

import psycopg2
from psycopg2.extras import RealDictCursor
import os
from typing import Dict, Any, Optional
import json


class DatabaseService:
    """Service for interacting with Cloud SQL PostgreSQL database."""

    def __init__(self):
        self.connection = None
        # Use simplified environment variables
        # For Cloud Run, database connection will be configured in deployment
        self.db_config = {
            "host": os.getenv("DB_HOST", "localhost"),
            "port": int(os.getenv("DB_PORT", 5432)),
            "database": os.getenv("DB_NAME", "postgres"),
            "user": os.getenv("DB_USER", "postgres"),
            "password": os.getenv("DB_PASSWORD", "")
        }

    async def connect(self):
        """Establish database connection."""
        try:
            self.connection = psycopg2.connect(**self.db_config)
            print(f"✅ Database connected: {self.db_config['database']}")
        except Exception as e:
            print(f"❌ Database connection error: {str(e)}")
            raise

    async def disconnect(self):
        """Close database connection."""
        if self.connection:
            self.connection.close()
            print("✅ Database disconnected")

    async def health_check(self) -> bool:
        """Check database health."""
        try:
            if not self.connection:
                return False

            cursor = self.connection.cursor()
            cursor.execute("SELECT 1")
            cursor.close()
            return True
        except Exception:
            return False

    async def update_submission_feedback(
        self,
        submission_id: str,
        feedback: Dict[str, Any],
        score: int
    ):
        """Update submission with feedback and score."""
        try:
            cursor = self.connection.cursor()

            query = """
                UPDATE "WritingSubmissions"
                SET feedback = %s,
                    score = %s,
                    status = 'feedback_complete',
                    updated_at = NOW()
                WHERE id = %s
            """

            cursor.execute(query, (json.dumps(feedback), score, submission_id))
            self.connection.commit()
            cursor.close()

            print(f"✅ Feedback saved for submission: {submission_id}")

        except Exception as e:
            print(f"❌ Failed to save feedback: {str(e)}")
            if self.connection:
                self.connection.rollback()
            raise

    async def create_media_record(
        self,
        submission_id: str,
        media_type: str,
        gcs_url: str,
        file_name: str,
        prompt: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> str:
        """Create a generated media record."""
        try:
            cursor = self.connection.cursor(cursor_factory=RealDictCursor)

            # Set imageUrl or videoUrl depending on type
            if media_type == 'image':
                query = """
                    INSERT INTO "GeneratedMedia"
                    (id, submission_id, user_id, media_type, "imageUrl", gcs_url, file_name, prompt, generation_status, created_at)
                    VALUES (gen_random_uuid(), %s, %s, %s, %s, %s, %s, %s, 'completed', NOW())
                    RETURNING id
                """
                cursor.execute(query, (submission_id, user_id, media_type, gcs_url, gcs_url, file_name, prompt))
            else:  # video
                query = """
                    INSERT INTO "GeneratedMedia"
                    (id, submission_id, user_id, media_type, "videoUrl", gcs_url, file_name, prompt, generation_status, created_at)
                    VALUES (gen_random_uuid(), %s, %s, %s, %s, %s, %s, %s, 'completed', NOW())
                    RETURNING id
                """
                cursor.execute(query, (submission_id, user_id, media_type, gcs_url, gcs_url, file_name, prompt))

            result = cursor.fetchone()
            self.connection.commit()

            media_id = result["id"] if result else None
            cursor.close()

            print(f"✅ Media record created: {media_id}")
            return media_id

        except Exception as e:
            print(f"❌ Failed to create media record: {str(e)}")
            if self.connection:
                self.connection.rollback()
            raise
