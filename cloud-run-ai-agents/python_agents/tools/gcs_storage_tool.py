"""
GCS Storage Tool - Uploads media files to Google Cloud Storage
"""

import os
import uuid
from datetime import datetime
from google.cloud import storage


def upload_image_to_gcs(
    image_data: bytes,
    submission_id: str,
    image_index: int,
    file_format: str = "png"
) -> dict:
    """
    Upload image to Google Cloud Storage and return public URL.

    This tool handles image upload to GCS, generates unique filenames,
    and returns public URLs for accessing the uploaded images.

    Args:
        image_data: Raw image bytes to upload
        submission_id: Submission identifier for organizing files
        image_index: Image number (1, 2, 3...) for the submission
        file_format: File extension (e.g., "png", "jpg", "webp")

    Returns:
        dict: Upload result containing:
            - success (bool): Whether upload succeeded
            - url (str): Public URL of uploaded image
            - filename (str): Storage filename
            - bucket (str): GCS bucket name
            - size (int): File size in bytes
            - error (str|None): Error message if upload failed
    """
    try:
        print(f"\n📤 [{datetime.utcnow().isoformat()}] Image Upload to GCS")
        print(f"   Submission: {submission_id}, Index: {image_index}")
        print(f"   Size: {len(image_data)} bytes, Format: {file_format}")

        # Get bucket configuration
        bucket_name = os.getenv("GCS_BUCKET_NAME", "fun-writing-media-prod")

        # Initialize GCS client
        storage_client = storage.Client()
        bucket = storage_client.bucket(bucket_name)

        # Generate unique filename
        unique_id = str(uuid.uuid4())[:8]
        filename = f"images/{submission_id}_{unique_id}_{image_index}.{file_format}"

        # Upload to GCS
        blob = bucket.blob(filename)
        blob.upload_from_string(
            image_data,
            content_type=f"image/{file_format}"
        )

        # Make blob public (assuming bucket has public access configured)
        # blob.make_public()  # Commented out if bucket-level IAM is configured

        # Generate public URL
        public_url = f"https://storage.googleapis.com/{bucket_name}/{filename}"

        print(f"   ✅ Uploaded: {public_url}")

        return {
            "success": True,
            "url": public_url,
            "filename": filename,
            "bucket": bucket_name,
            "size": len(image_data),
            "timestamp": datetime.utcnow().isoformat()
        }

    except Exception as e:
        print(f"❌ GCS upload error: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }


def upload_video_to_gcs(
    video_data: bytes,
    submission_id: str,
    file_format: str = "mp4"
) -> dict:
    """
    Upload video to Google Cloud Storage and return public URL.

    This tool handles video upload to GCS, generates unique filenames,
    and returns public URLs for accessing the uploaded videos.

    Args:
        video_data: Raw video bytes to upload
        submission_id: Submission identifier for organizing files
        file_format: File extension (e.g., "mp4", "webm")

    Returns:
        dict: Upload result containing:
            - success (bool): Whether upload succeeded
            - url (str): Public URL of uploaded video
            - filename (str): Storage filename
            - bucket (str): GCS bucket name
            - size (int): File size in bytes
            - error (str|None): Error message if upload failed
    """
    try:
        print(f"\n📤 [{datetime.utcnow().isoformat()}] Video Upload to GCS")
        print(f"   Submission: {submission_id}")
        print(f"   Size: {len(video_data)} bytes, Format: {file_format}")

        # Get bucket configuration
        bucket_name = os.getenv("GCS_BUCKET_NAME", "fun-writing-media-prod")

        # Initialize GCS client
        storage_client = storage.Client()
        bucket = storage_client.bucket(bucket_name)

        # Generate unique filename
        unique_id = str(uuid.uuid4())[:8]
        filename = f"videos/{submission_id}_{unique_id}.{file_format}"

        # Upload to GCS
        blob = bucket.blob(filename)
        blob.upload_from_string(
            video_data,
            content_type=f"video/{file_format}"
        )

        # Generate public URL
        public_url = f"https://storage.googleapis.com/{bucket_name}/{filename}"

        print(f"   ✅ Uploaded: {public_url}")

        return {
            "success": True,
            "url": public_url,
            "filename": filename,
            "bucket": bucket_name,
            "size": len(video_data),
            "timestamp": datetime.utcnow().isoformat()
        }

    except Exception as e:
        print(f"❌ GCS upload error: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }
