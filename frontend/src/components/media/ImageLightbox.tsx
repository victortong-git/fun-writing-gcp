import { useEffect } from 'react'
import { X, ChevronLeft, ChevronRight, Download, Trash2 } from 'lucide-react'
import { GeneratedImage } from '../../services/mediaService'

interface ImageLightboxProps {
  images: GeneratedImage[]
  currentIndex: number
  isOpen: boolean
  onClose: () => void
  onNext: () => void
  onPrev: () => void
  onDownload: (imageUrl: string, filename: string) => void
  onDelete: (imageId: string) => void
}

export const ImageLightbox = ({
  images,
  currentIndex,
  isOpen,
  onClose,
  onNext,
  onPrev,
  onDownload,
  onDelete,
}: ImageLightboxProps) => {
  const currentImage = images[currentIndex]

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onPrev()
      if (e.key === 'ArrowRight') onNext()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, onNext, onPrev])

  if (!isOpen || !currentImage) return null

  const handleDownload = () => {
    const filename = `image-${currentIndex + 1}.png`
    onDownload(currentImage.imageUrl, filename)
  }

  const handleDelete = () => {
    onDelete(currentImage.id)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
        aria-label="Close"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Previous button */}
      {images.length > 1 && (
        <button
          onClick={onPrev}
          className="absolute left-4 p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
          aria-label="Previous image"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
      )}

      {/* Next button */}
      {images.length > 1 && (
        <button
          onClick={onNext}
          className="absolute right-4 p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
          aria-label="Next image"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      )}

      {/* Image */}
      <div className="max-w-7xl max-h-[90vh] mx-4">
        <img
          src={currentImage.imageUrl}
          alt={currentImage.description || 'Generated image'}
          className="max-w-full max-h-[90vh] object-contain rounded-lg"
        />
      </div>

      {/* Bottom toolbar */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-4 bg-black/50 backdrop-blur-sm rounded-lg px-6 py-3">
        {/* Image counter */}
        <span className="text-white text-sm font-medium">
          {currentIndex + 1} / {images.length}
        </span>

        {/* Divider */}
        <div className="h-6 w-px bg-white/20" />

        {/* Download button */}
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-3 py-2 text-white hover:bg-white/10 rounded-lg transition-colors"
          title="Download image"
        >
          <Download className="w-5 h-5" />
          <span className="text-sm">Download</span>
        </button>

        {/* Delete button */}
        <button
          onClick={handleDelete}
          className="flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          title="Delete image"
        >
          <Trash2 className="w-5 h-5" />
          <span className="text-sm">Delete</span>
        </button>
      </div>
    </div>
  )
}
