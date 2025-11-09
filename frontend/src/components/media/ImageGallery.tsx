import { useState } from 'react'
import { Download, Trash2, Loader, AlertCircle, Image as ImageIcon } from 'lucide-react'

interface Image {
  id: string
  url: string
  createdAt: string
}

interface ImageGalleryProps {
  images: Image[]
  loading: boolean
  error: string | null
  onDelete?: (imageId: string) => void
}

export const ImageGallery = ({ images, loading, error, onDelete }: ImageGalleryProps) => {
  const [selectedImage, setSelectedImage] = useState<Image | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDelete = async (imageId: string) => {
    setDeleting(imageId)
    try {
      await onDelete?.(imageId)
    } finally {
      setDeleting(null)
    }
  }

  const handleDownload = (url: string, imageId: string) => {
    const link = document.createElement('a')
    link.href = url
    link.download = `image-${imageId}.png`
    link.click()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-6 h-6 animate-spin text-primary-600 mr-2" />
        <span className="text-slate-600">Generating images...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-danger-50 border border-danger-200 rounded-lg flex items-start space-x-3">
        <AlertCircle className="w-5 h-5 text-danger-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-danger-800">{error}</p>
        </div>
      </div>
    )
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-12">
        <ImageIcon className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <p className="text-slate-600">No images generated yet</p>
        <p className="text-sm text-slate-500 mt-1">Generate images based on your story</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Modal for selected image */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setSelectedImage(null)}
        >
          <div className="bg-white rounded-lg max-w-2xl w-full cursor-default" onClick={(e) => e.stopPropagation()}>
            <div className="relative">
              <img src={selectedImage.url} alt="Generated" className="w-full rounded-t-lg" />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 bg-slate-900 bg-opacity-70 text-white p-2 rounded-lg hover:bg-opacity-90 transition-all"
              >
                ✕
              </button>
            </div>
            <div className="p-4 flex gap-2">
              <button
                onClick={() => handleDownload(selectedImage.url, selectedImage.id)}
                className="flex items-center space-x-2 flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
              {onDelete && (
                <button
                  onClick={() => {
                    handleDelete(selectedImage.id)
                    setSelectedImage(null)
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-danger-600 text-white rounded-lg hover:bg-danger-700 transition-colors font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Gallery Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {images.map((image) => (
          <div
            key={image.id}
            className="group relative rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow bg-slate-100 aspect-square"
          >
            <img
              src={image.url}
              alt="Generated"
              className="w-full h-full object-cover"
              onError={(e) => {
                ;(e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22400%22%3E%3Crect fill=%22%23e2e8f0%22 width=%22400%22 height=%22400%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 font-size=%2224%22 fill=%22%239ca3af%22 text-anchor=%22middle%22 dy=%22.3em%22%3EImage not available%3C/text%3E%3C/svg%3E'
              }}
            />

            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
              <button
                onClick={() => setSelectedImage(image)}
                className="bg-white text-slate-900 p-2 rounded-lg hover:bg-slate-100 transition-colors"
                title="View"
              >
                🔍
              </button>
              <button
                onClick={() => handleDownload(image.url, image.id)}
                className="bg-primary-600 text-white p-2 rounded-lg hover:bg-primary-700 transition-colors"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </button>
              {onDelete && (
                <button
                  onClick={() => handleDelete(image.id)}
                  disabled={deleting === image.id}
                  className="bg-danger-600 text-white p-2 rounded-lg hover:bg-danger-700 transition-colors disabled:opacity-50"
                  title="Delete"
                >
                  {deleting === image.id ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>

            {/* Image info */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-xs text-white">
                {new Date(image.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
