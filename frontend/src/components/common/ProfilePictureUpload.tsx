import { useState, useRef, useCallback } from 'react'
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { Upload, X, Check } from 'lucide-react'

interface ProfilePictureUploadProps {
  currentImageUrl?: string
  onUpload: (file: File) => Promise<void>
  onDelete?: () => Promise<void>
}

export const ProfilePictureUpload = ({
  currentImageUrl,
  onUpload,
  onDelete,
}: ProfilePictureUploadProps) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 90,
    height: 90,
    x: 5,
    y: 5,
  })
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/)) {
      setError('Please select a valid image file (JPEG, PNG, or WebP)')
      return
    }

    // Validate file size (1MB)
    if (file.size > 1024 * 1024) {
      setError('File size must be less than 1MB')
      return
    }

    setError(null)
    const reader = new FileReader()
    reader.onload = () => {
      setSelectedImage(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const getCroppedImg = useCallback(
    async (image: HTMLImageElement, crop: PixelCrop): Promise<Blob> => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        throw new Error('No 2d context')
      }

      // Set canvas size to desired output size (circular, so use min dimension)
      const size = Math.min(crop.width, crop.height)
      canvas.width = size
      canvas.height = size

      // Draw circular clipped image
      ctx.beginPath()
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
      ctx.closePath()
      ctx.clip()

      ctx.drawImage(
        image,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        0,
        0,
        size,
        size
      )

      return new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas is empty'))
              return
            }
            resolve(blob)
          },
          'image/jpeg',
          0.95
        )
      })
    },
    []
  )

  const handleUpload = async () => {
    if (!imgRef.current || !completedCrop) {
      setError('Please select and crop an image first')
      return
    }

    try {
      setUploading(true)
      setError(null)

      const croppedBlob = await getCroppedImg(imgRef.current, completedCrop)
      const croppedFile = new File([croppedBlob], 'profile-picture.jpg', {
        type: 'image/jpeg',
      })

      await onUpload(croppedFile)
      setSelectedImage(null)
      setCompletedCrop(null)
    } catch (err: any) {
      setError(err.message || 'Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  const handleCancel = () => {
    setSelectedImage(null)
    setCompletedCrop(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDelete = async () => {
    if (!onDelete) return
    try {
      setUploading(true)
      await onDelete()
    } catch (err: any) {
      setError(err.message || 'Failed to delete image')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Current Profile Picture */}
      {!selectedImage && currentImageUrl && (
        <div className="flex flex-col items-center space-y-2">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary-200">
            <img
              src={currentImageUrl}
              alt="Current profile"
              className="w-full h-full object-cover"
            />
          </div>
          {onDelete && (
            <button
              onClick={handleDelete}
              disabled={uploading}
              className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
            >
              Remove Photo
            </button>
          )}
        </div>
      )}

      {/* Image Cropper */}
      {selectedImage && (
        <div className="space-y-4">
          <div className="flex justify-center">
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={1}
              circularCrop
            >
              <img
                ref={imgRef}
                src={selectedImage}
                alt="Crop preview"
                style={{ maxHeight: '400px' }}
              />
            </ReactCrop>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleUpload}
              disabled={uploading || !completedCrop}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4" />
              <span>{uploading ? 'Uploading...' : 'Upload'}</span>
            </button>
            <button
              onClick={handleCancel}
              disabled={uploading}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 disabled:opacity-50"
            >
              <X className="w-4 h-4" />
              <span>Cancel</span>
            </button>
          </div>
        </div>
      )}

      {/* File Input */}
      {!selectedImage && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
            id="profile-picture-input"
          />
          <label
            htmlFor="profile-picture-input"
            className="flex items-center justify-center space-x-2 px-4 py-3 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors"
          >
            <Upload className="w-5 h-5 text-slate-500" />
            <span className="text-sm text-slate-600">
              Choose a photo (Max 1MB, JPEG/PNG/WebP)
            </span>
          </label>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Instructions */}
      {selectedImage && (
        <div className="text-xs text-slate-500 text-center">
          Drag the corners to adjust the crop area. The image will be centered in a circle.
        </div>
      )}
    </div>
  )
}
