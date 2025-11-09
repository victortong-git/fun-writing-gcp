import { useState } from 'react'
import { Download, Trash2, Loader, AlertCircle, Video } from 'lucide-react'

interface VideoPlayerProps {
  videoUrl: string
  createdAt?: string
  loading?: boolean
  error?: string | null
  onDelete?: () => void
}

export const VideoPlayer = ({
  videoUrl,
  createdAt,
  loading = false,
  error = null,
  onDelete,
}: VideoPlayerProps) => {
  const [isDeleting, setIsDeleting] = useState(false)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-6 h-6 animate-spin text-primary-600 mr-2" />
        <span className="text-slate-600">Generating video...</span>
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

  if (!videoUrl) {
    return (
      <div className="text-center py-12">
        <Video className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <p className="text-slate-600">No video generated yet</p>
        <p className="text-sm text-slate-500 mt-1">Generate a video based on your story</p>
      </div>
    )
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = videoUrl
    link.download = 'story-video.mp4'
    link.click()
  }

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this video?')) {
      setIsDeleting(true)
      try {
        await onDelete?.()
      } finally {
        setIsDeleting(false)
      }
    }
  }

  return (
    <div className="space-y-4">
      {/* Video Player */}
      <div className="relative bg-black rounded-lg overflow-hidden shadow-lg">
        <video
          src={videoUrl}
          controls
          className="w-full"
          onError={() => {
            console.error('Video failed to load')
          }}
        >
          Your browser does not support the video tag.
        </video>
      </div>

      {/* Video Info and Actions */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-slate-900">Generated Video</h3>
            {createdAt && (
              <p className="text-sm text-slate-600">{new Date(createdAt).toLocaleDateString()}</p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            className="flex items-center space-x-2 flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </button>
          {onDelete && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center space-x-2 px-4 py-2 bg-danger-600 text-white rounded-lg hover:bg-danger-700 transition-colors font-medium disabled:opacity-50"
            >
              {isDeleting ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <h4 className="font-semibold text-blue-900 mb-2">💡 Video Tips</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Download your video to save it locally</li>
          <li>• Share your video on social media</li>
          <li>• Videos are stored for 30 days</li>
        </ul>
      </div>
    </div>
  )
}
