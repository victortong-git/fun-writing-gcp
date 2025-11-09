import apiClient from './api'

export interface GeneratedImage {
  id: string
  imageUrl: string
  description?: string
  createdAt: string
}

export interface GeneratedVideo {
  id: string
  videoUrl: string
  description?: string
  duration?: number
  videoStyle?: string
  sourceImageId?: string
  createdAt: string
}

export interface MediaData {
  images: GeneratedImage[]
  videos: GeneratedVideo[]
}

export interface GenerateImagesResponse {
  success: boolean
  message: string
  creditsUsed: number
  remainingCredits: number
  images: Array<{
    id: string
    imageUrl: string
    description: string
  }>
  submission: {
    id: string
    score: number
  }
}

export interface GenerateVideoResponse {
  success: boolean
  message: string
  creditsUsed: number
  remainingCredits: number
  video: {
    id: string
    videoUrl: string
    description: string
    duration: number
  }
  sourceImage: {
    id: string
    imageUrl: string
  }
  submission: {
    id: string
    score: number
  }
}

export interface SingleImageResponse {
  success: boolean
  message: string
  creditsUsed: number
  remainingCredits: number
  image: {
    id: string
    imageUrl: string
    description: string
    imageIndex: number
    imageStyle?: string
  }
  submission: {
    id: string
    score: number
  }
}

export type ImageStyle = 'standard' | 'comic' | 'manga' | 'princess'
export type VideoStyle = 'animation' | 'cinematic'

export const mediaService = {
  /**
   * Generate 1 AI image for a submission (100 credits)
   * @param submissionId - The submission ID
   * @param imageStyle - The image style: 'standard', 'comic', or 'manga'
   */
  async generateSingleImage(submissionId: string, imageStyle: ImageStyle = 'standard'): Promise<SingleImageResponse> {
    const response = await apiClient.post('/media/generate-single-image', {
      submissionId,
      imageStyle,
    }, {
      timeout: 180000 // 3 minutes for image generation
    })
    return response.data
  },

  /**
   * Delete a generated image
   */
  async deleteImage(imageId: string): Promise<{
    success: boolean
    message: string
    imageId: string
  }> {
    const response = await apiClient.delete(`/media/image/${imageId}`)
    return response.data
  },

  /**
   * Download an image
   */
  downloadImage(imageUrl: string, filename: string): void {
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = filename
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  },

  /**
   * Generate 1 AI video from text (text-to-video mode)
   * @param submissionId - The submission ID
   * @param videoStyle - The video style: 'animation' or 'cinematic'
   */
  async generateVideoFromText(submissionId: string, videoStyle: VideoStyle = 'animation'): Promise<GenerateVideoResponse> {
    const response = await apiClient.post('/media/generate-video', {
      submissionId,
      mode: 'text-to-video',
      videoStyle,
    }, {
      timeout: 600000 // 10 minutes for video generation (Veo 3.1 polling)
    })
    return response.data
  },

  /**
   * Get all media for a submission
   */
  async getSubmissionMedia(submissionId: string): Promise<{
    success: boolean
    submission: {
      id: string
      score: number
      status: string
    }
    media: MediaData
  }> {
    const response = await apiClient.get(`/media/submission/${submissionId}`)
    return response.data
  },
}

/**
 * Gallery service
 */
export interface GalleryItem {
  id: string
  imageUrl: string
  topic: string
  writingType: string
  theme: string | null
  studentWriting: string
  submissionId: string
  createdAt: string
}

export interface GalleryResponse {
  success: boolean
  gallery: GalleryItem[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export async function getGallery(page: number = 1, limit: number = 20): Promise<GalleryResponse> {
  const response = await apiClient.get<GalleryResponse>('/media/gallery', {
    params: { page, limit },
  })
  return response.data
}

/**
 * Video Gallery service
 */
export interface VideoGalleryItem {
  id: string
  videoUrl: string
  topic: string
  writingType: string
  theme: string | null
  studentWriting: string
  submissionId: string
  createdAt: string
  duration: number
}

export interface VideoGalleryResponse {
  success: boolean
  gallery: VideoGalleryItem[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export async function getVideoGallery(page: number = 1, limit: number = 20): Promise<VideoGalleryResponse> {
  const response = await apiClient.get<VideoGalleryResponse>('/media/video-gallery', {
    params: { page, limit },
  })
  return response.data
}