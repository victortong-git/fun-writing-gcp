"""
GCS Storage Service for Python ADK Agents
Handles Google Cloud Storage operations for media files
"""

from google.cloud import storage
import os
from typing import Tuple
import uuid
from datetime import timedelta


class GCSStorageService:
    """Service for uploading media files to Google Cloud Storage."""

    def __init__(self):
        self.bucket_name = os.getenv("GCS_BUCKET_NAME")
        if not self.bucket_name:
            raise ValueError("GCS_BUCKET_NAME environment variable is required")

        # Use project from environment
        project_id = os.getenv("GCP_PROJECT_ID")
        self.client = storage.Client(project=project_id) if project_id else storage.Client()
        self.bucket = self.client.bucket(self.bucket_name)

    async def bucket_exists(self) -> bool:
        """Check if bucket exists."""
        try:
            return self.bucket.exists()
        except Exception:
            return False

    async def upload_image(
        self,
        image_data: bytes,
        submission_id: str,
        image_index: int,
        extension: str = "png"
    ) -> Tuple[str, str]:
        """
        Upload image to GCS.

        Args:
            image_data: Image bytes
            submission_id: Submission ID
            image_index: Image index (1, 2, 3)
            extension: File extension

        Returns:
            Tuple of (public_url, file_name)
        """
        try:
            print(f"   📦 Preparing upload: {len(image_data)} bytes of image data")
            print(f"   📍 Bucket: {self.bucket_name}")

            unique_id = str(uuid.uuid4())[:8]
            file_name = f"{submission_id}_{unique_id}_{image_index}.{extension}"
            blob_name = f"images/{file_name}"

            print(f"   📄 File name: {blob_name}")

            blob = self.bucket.blob(blob_name)
            blob.upload_from_string(image_data, content_type=f"image/{extension}")

            print(f"   ✅ Upload complete, making public...")

            # Make public
            blob.make_public()

            public_url = blob.public_url
            print(f"✅ Image uploaded: {public_url}")

            return public_url, file_name

        except Exception as e:
            import traceback
            print(f"❌ Failed to upload image: {str(e)}")
            print(f"   Stack trace:\n{traceback.format_exc()}")
            raise

    async def upload_video(
        self,
        video_data: bytes,
        submission_id: str,
        extension: str = "mp4"
    ) -> Tuple[str, str]:
        """
        Upload video to GCS.

        Args:
            video_data: Video bytes
            submission_id: Submission ID
            extension: File extension

        Returns:
            Tuple of (public_url, file_name)
        """
        try:
            print(f"   📦 Preparing upload: {len(video_data)} bytes of video data")
            print(f"   📍 Bucket: {self.bucket_name}")

            unique_id = str(uuid.uuid4())[:8]
            file_name = f"{submission_id}_{unique_id}.{extension}"
            blob_name = f"videos/{file_name}"

            print(f"   📄 File name: {blob_name}")

            blob = self.bucket.blob(blob_name)
            blob.upload_from_string(video_data, content_type=f"video/{extension}")

            print(f"   ✅ Upload complete, making public...")

            # Make public
            blob.make_public()

            public_url = blob.public_url
            print(f"✅ Video uploaded: {public_url}")

            return public_url, file_name

        except Exception as e:
            import traceback
            print(f"❌ Failed to upload video: {str(e)}")
            print(f"   Stack trace:\n{traceback.format_exc()}")
            raise
