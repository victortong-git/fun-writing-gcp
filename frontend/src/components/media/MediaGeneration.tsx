import { useState, useEffect } from 'react'
import { Image, Video, Loader, AlertCircle, Sparkles, Play, Download, Trash2, ZoomIn } from 'lucide-react'
import { mediaService, type GeneratedImage, type GeneratedVideo, type ImageStyle, type VideoStyle } from '../../services/mediaService'
import { useAuth } from '../../hooks'
import { ImageLightbox } from './ImageLightbox'
import { ConfirmDialog } from '../common/ConfirmDialog'

interface MediaGenerationProps {
  submissionId: string
  submissionScore: number
  onCreditsUpdate?: (newCredits: number) => void
}

export const MediaGeneration = ({ submissionId, submissionScore, onCreditsUpdate }: MediaGenerationProps) => {
  const { user } = useAuth()
  const [images, setImages] = useState<GeneratedImage[]>([])
  const [videos, setVideos] = useState<GeneratedVideo[]>([])
  const [imageStyle, setImageStyle] = useState<ImageStyle>('standard')
  const [videoStyle, setVideoStyle] = useState<VideoStyle>('animation')
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Load existing media on component mount
  useEffect(() => {
    loadExistingMedia()
  }, [submissionId])

  const loadExistingMedia = async () => {
    try {
      setLoading(true)
      const response = await mediaService.getSubmissionMedia(submissionId)
      setImages(response.media.images)
      setVideos(response.media.videos)
    } catch (err) {
      console.error('Failed to load existing media:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateSingleImage = async () => {
    if (!user || user.aiCredits < 100) {
      setError('You need 100 credits to generate an image')
      return
    }

    try {
      setIsGeneratingImage(true)
      setError(null)

      const response = await mediaService.generateSingleImage(submissionId, imageStyle)

      // Add new image to state
      const newImage: GeneratedImage = {
        id: response.image.id,
        imageUrl: response.image.imageUrl,
        description: response.image.description,
        createdAt: new Date().toISOString(),
      }

      setImages(prev => [...prev, newImage])

      // Update user credits
      if (onCreditsUpdate) {
        onCreditsUpdate(response.remainingCredits)
      }

    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Failed to generate image'
      setError(`Image generation failed: ${errorMessage}`)
      console.error('Image generation error:', err)
    } finally {
      setIsGeneratingImage(false)
    }
  }

  const handleDeleteImage = async (imageId: string) => {
    try {
      await mediaService.deleteImage(imageId)

      // Remove image from state
      setImages(prev => prev.filter(img => img.id !== imageId))

      // Close lightbox if open
      setLightboxIndex(null)
      setDeleteConfirm(null)

    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to delete image'
      setError(`Delete failed: ${errorMessage}`)
      console.error('Image deletion error:', err)
    }
  }

  const handleDownloadImage = (imageUrl: string, filename: string) => {
    mediaService.downloadImage(imageUrl, filename)
  }

  const handleGenerateVideo = async () => {
    if (!user || user.aiCredits < 500) {
      setError('You need 500 credits to generate a video')
      return
    }

    try {
      setIsGeneratingVideo(true)
      setError(null)

      // Use text-to-video mode with selected style
      const response = await mediaService.generateVideoFromText(submissionId, videoStyle)

      const newVideo: GeneratedVideo = {
        id: response.video.id,
        videoUrl: response.video.videoUrl,
        description: response.video.description,
        duration: response.video.duration,
        videoStyle: videoStyle,
        createdAt: new Date().toISOString(),
      }

      setVideos(prev => [...prev, newVideo])

      if (onCreditsUpdate) {
        onCreditsUpdate(response.remainingCredits)
      }

    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Failed to generate video'
      setError(`Video generation failed: ${errorMessage}`)
      console.error('Video generation error:', err)
    } finally {
      setIsGeneratingVideo(false)
    }
  }

  // Lightbox navigation
  const openLightbox = (index: number) => setLightboxIndex(index)
  const closeLightbox = () => setLightboxIndex(null)
  const nextImage = () => setLightboxIndex((lightboxIndex! + 1) % images.length)
  const prevImage = () => setLightboxIndex((lightboxIndex! - 1 + images.length) % images.length)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    )
  }

  // Check if score is high enough
  if (submissionScore < 51) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-yellow-900 mb-1">Score Too Low</h3>
            <p className="text-sm text-yellow-800">
              You need a score of 51 or higher to generate images. Current score: {submissionScore}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Image Generation Section */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Image className="w-6 h-6 text-blue-600" />
              AI Generated Images
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              {images.length} {images.length === 1 ? 'image' : 'images'} generated
            </p>
          </div>
          <button
            onClick={handleGenerateSingleImage}
            disabled={isGeneratingImage || (user?.aiCredits || 0) < 100}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
          >
            {isGeneratingImage ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Generate Image (100 credits)</span>
              </>
            )}
          </button>
        </div>

        {/* Image Style Selector */}
        <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <label className="block text-sm font-semibold text-slate-700 mb-3">
            Image Style:
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              onClick={() => setImageStyle('standard')}
              className={`px-4 py-3 rounded-lg border-2 transition-all ${
                imageStyle === 'standard'
                  ? 'border-blue-600 bg-blue-50 text-blue-900'
                  : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
              }`}
            >
              <div className="font-semibold mb-1">📖 Standard</div>
              <div className="text-xs">
                Colorful storybook illustration (16:9)
              </div>
            </button>
            <button
              onClick={() => setImageStyle('comic')}
              className={`px-4 py-3 rounded-lg border-2 transition-all ${
                imageStyle === 'comic'
                  ? 'border-blue-600 bg-blue-50 text-blue-900'
                  : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
              }`}
            >
              <div className="font-semibold mb-1">🦸 Hero Comic</div>
              <div className="text-xs">
                3-4 comic panels, superhero style (2:3)
              </div>
            </button>
            <button
              onClick={() => setImageStyle('princess')}
              className={`px-4 py-3 rounded-lg border-2 transition-all ${
                imageStyle === 'princess'
                  ? 'border-blue-600 bg-blue-50 text-blue-900'
                  : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
              }`}
            >
              <div className="font-semibold mb-1">👑 Princess Comic</div>
              <div className="text-xs">
                3-4 panels, magical fairy tale (2:3)
              </div>
            </button>
            <button
              onClick={() => setImageStyle('manga')}
              className={`px-4 py-3 rounded-lg border-2 transition-all ${
                imageStyle === 'manga'
                  ? 'border-blue-600 bg-blue-50 text-blue-900'
                  : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
              }`}
            >
              <div className="font-semibold mb-1">🎌 Manga</div>
              <div className="text-xs">
                3-4 manga panels, black & white (2:3)
              </div>
            </button>
          </div>
        </div>

        {/* Images Grid */}
        {images.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((image, index) => (
              <div
                key={image.id}
                className="relative group border-2 border-slate-200 rounded-lg overflow-hidden hover:border-blue-500 transition-all"
              >
                <img
                  src={image.imageUrl}
                  alt={image.description || 'Generated image'}
                  className="w-full h-64 object-cover"
                />

                {/* Action buttons overlay */}
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openLightbox(index)}
                    className="p-2 bg-white/90 hover:bg-white rounded-lg shadow-lg transition-colors"
                    title="View fullscreen"
                  >
                    <ZoomIn className="w-4 h-4 text-slate-700" />
                  </button>
                  <button
                    onClick={() => handleDownloadImage(image.imageUrl, `image-${index + 1}.png`)}
                    className="p-2 bg-white/90 hover:bg-white rounded-lg shadow-lg transition-colors"
                    title="Download"
                  >
                    <Download className="w-4 h-4 text-slate-700" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(image.id)}
                    className="p-2 bg-white/90 hover:bg-white rounded-lg shadow-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>

                <div className="p-3 bg-slate-50">
                  <p className="text-sm text-slate-600 line-clamp-2">
                    {image.description || 'AI-generated image'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border-2 border-dashed border-slate-300 rounded-lg">
            <Image className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 mb-2">No images generated yet</p>
            <p className="text-sm text-slate-500">
              Generate AI images based on your story for 100 credits each
            </p>
          </div>
        )}

        {/* Loading placeholder for new image */}
        {isGeneratingImage && (
          <div className="mt-4 border-2 border-dashed border-blue-300 rounded-lg p-8 bg-blue-50">
            <div className="flex items-center justify-center gap-3">
              <Loader className="w-6 h-6 text-blue-600 animate-spin" />
              <p className="text-blue-700 font-medium">Generating your image... This may take 1-2 minutes</p>
            </div>
          </div>
        )}
      </div>

      {/* Video Generation Section */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Video className="w-6 h-6 text-purple-600" />
              AI Generated Videos
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Generate an 8-second video from your story (720p, 16:9)
            </p>
          </div>
          <button
            onClick={handleGenerateVideo}
            disabled={isGeneratingVideo || (user?.aiCredits || 0) < 500}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
          >
            {isGeneratingVideo ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                <span>Generate Video (500 credits)</span>
              </>
            )}
          </button>
        </div>

        {/* Video Style Selector */}
        <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <label className="block text-sm font-semibold text-slate-700 mb-3">
            Video Style:
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={() => setVideoStyle('animation')}
              className={`px-4 py-3 rounded-lg border-2 transition-all ${
                videoStyle === 'animation'
                  ? 'border-purple-600 bg-purple-50 text-purple-900'
                  : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
              }`}
            >
              <div className="font-semibold mb-1">🎨 Animation</div>
              <div className="text-xs">
                Colorful animated style video
              </div>
            </button>
            <button
              onClick={() => setVideoStyle('cinematic')}
              className={`px-4 py-3 rounded-lg border-2 transition-all ${
                videoStyle === 'cinematic'
                  ? 'border-purple-600 bg-purple-50 text-purple-900'
                  : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
              }`}
            >
              <div className="font-semibold mb-1">🎬 Cinematic</div>
              <div className="text-xs">
                Live-action style, professional cinematography
              </div>
            </button>
          </div>
        </div>

          {videos.length > 0 ? (
            <div className="space-y-4">
              {videos.map((video) => (
                <div key={video.id} className="border border-slate-200 rounded-lg overflow-hidden">
                  <video
                    src={video.videoUrl}
                    controls
                    className="w-full"
                  />
                  <div className="p-4 bg-slate-50 flex items-center justify-between">
                    <p className="text-sm text-slate-600">{video.description}</p>
                    <a
                      href={video.videoUrl}
                      download
                      className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 border-2 border-dashed border-slate-300 rounded-lg">
              <Video className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 mb-2">No videos generated yet</p>
              <p className="text-sm text-slate-500">
                Click "Generate Video" to create an 8-second animated video from your story (720p, 16:9)
              </p>
            </div>
          )}

          {/* Loading message for video generation */}
          {isGeneratingVideo && (
            <div className="mt-4 border-2 border-dashed border-purple-300 rounded-lg p-8 bg-purple-50">
              <div className="flex flex-col items-center justify-center gap-3">
                <Loader className="w-8 h-8 text-purple-600 animate-spin" />
                <p className="text-purple-700 font-medium">
                  Generating your video animation from your story...
                </p>
                <p className="text-sm text-purple-600">
                  This may take 5-10 minutes. Please be patient.
                </p>
              </div>
            </div>
          )}
        </div>

      {/* Image Lightbox */}
      {lightboxIndex !== null && (
        <ImageLightbox
          images={images}
          currentIndex={lightboxIndex}
          isOpen={true}
          onClose={closeLightbox}
          onNext={nextImage}
          onPrev={prevImage}
          onDownload={handleDownloadImage}
          onDelete={(imageId) => setDeleteConfirm(imageId)}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        title="Delete Image?"
        message="Are you sure you want to delete this image? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
        onConfirm={() => deleteConfirm && handleDeleteImage(deleteConfirm)}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  )
}
