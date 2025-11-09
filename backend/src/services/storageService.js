const { Storage } = require('@google-cloud/storage');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Initialize Google Cloud Storage
const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

const bucketName = process.env.GCP_STORAGE_BUCKET;
const bucket = storage.bucket(bucketName);

/**
 * Upload profile picture to GCS
 * @param {Buffer} fileBuffer - The file buffer
 * @param {string} mimetype - The MIME type of the file
 * @param {string} userId - The user ID
 * @returns {Promise<string>} - The public URL of the uploaded file
 */
async function uploadProfilePicture(fileBuffer, mimetype, userId) {
  try {
    // Validate file size (1MB = 1048576 bytes)
    const maxSize = 1 * 1024 * 1024; // 1MB
    if (fileBuffer.length > maxSize) {
      throw new Error('File size exceeds 1MB limit');
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(mimetype)) {
      throw new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed');
    }

    // Generate unique filename
    const ext = mimetype.split('/')[1];
    const filename = `profile-pictures/${userId}/${uuidv4()}.${ext}`;

    // Create a new blob in the bucket
    const blob = bucket.file(filename);
    const blobStream = blob.createWriteStream({
      resumable: false,
      metadata: {
        contentType: mimetype,
        cacheControl: 'public, max-age=31536000', // Cache for 1 year
      },
    });

    return new Promise((resolve, reject) => {
      blobStream.on('error', (err) => {
        console.error('GCS upload error:', err);
        reject(new Error('Failed to upload file to cloud storage'));
      });

      blobStream.on('finish', async () => {
        try {
          // Make the file public
          await blob.makePublic();

          // Get the public URL
          const publicUrl = `https://storage.googleapis.com/${bucketName}/${filename}`;
          resolve(publicUrl);
        } catch (err) {
          console.error('Error making file public:', err);
          reject(new Error('Failed to make file public'));
        }
      });

      blobStream.end(fileBuffer);
    });
  } catch (error) {
    console.error('Upload profile picture error:', error);
    throw error;
  }
}

/**
 * Delete profile picture from GCS
 * @param {string} fileUrl - The public URL of the file to delete
 * @returns {Promise<void>}
 */
async function deleteProfilePicture(fileUrl) {
  try {
    if (!fileUrl) return;

    // Extract filename from URL
    const urlParts = fileUrl.split(`${bucketName}/`);
    if (urlParts.length < 2) return;

    const filename = urlParts[1];
    const file = bucket.file(filename);

    // Check if file exists before deleting
    const [exists] = await file.exists();
    if (exists) {
      await file.delete();
      console.log(`Deleted profile picture: ${filename}`);
    }
  } catch (error) {
    console.error('Delete profile picture error:', error);
    // Don't throw error, just log it
  }
}

module.exports = {
  uploadProfilePicture,
  deleteProfilePicture,
};
