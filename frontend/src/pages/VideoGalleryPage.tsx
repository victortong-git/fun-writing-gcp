import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getVideoGallery } from '../services/mediaService';

interface VideoGalleryItem {
  id: string;
  videoUrl: string;
  topic: string;
  writingType: string;
  theme: string | null;
  studentWriting: string;
  submissionId: string;
  createdAt: string;
  duration: number;
}

const VideoGalleryPage = () => {
  const navigate = useNavigate();
  const [gallery, setGallery] = useState<VideoGalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    loadGallery();
  }, [pagination.page]);

  const loadGallery = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getVideoGallery(pagination.page, pagination.limit);
      setGallery(response.gallery);
      setPagination(prev => ({
        ...prev,
        ...response.pagination,
      }));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load video gallery');
    } finally {
      setLoading(false);
    }
  };

  const getWritingTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      creative: 'bg-purple-100 text-purple-800',
      persuasive: 'bg-blue-100 text-blue-800',
      descriptive: 'bg-green-100 text-green-800',
      narrative: 'bg-orange-100 text-orange-800',
      informative: 'bg-teal-100 text-teal-800',
      poems: 'bg-pink-100 text-pink-800',
    };
    return colors[type] || 'bg-slate-100 text-slate-800';
  };

  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const handleVideoClick = (submissionId: string) => {
    navigate(`/submissions/${submissionId}`);
  };

  if (loading && gallery.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
          <p className="mt-4 text-slate-600">Loading video gallery...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">My Video Gallery</h1>
          <p className="text-slate-600 mt-2">
            Browse all your generated videos with their associated writing
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Empty State */}
        {!loading && gallery.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-slate-100 rounded-full mb-6">
              <svg
                className="w-12 h-12 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">No Videos Yet</h2>
            <p className="text-slate-600 mb-6">
              Start writing and generate videos to build your video gallery!
            </p>
            <button
              onClick={() => navigate('/writing')}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              Start Writing
            </button>
          </div>
        )}

        {/* Gallery Grid */}
        {gallery.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {gallery.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                  onClick={() => handleVideoClick(item.submissionId)}
                >
                  {/* Section 1: Video */}
                  <div className="relative aspect-video bg-slate-900">
                    <video
                      src={item.videoUrl}
                      className="w-full h-full object-cover"
                      preload="metadata"
                      controls
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-semibold">
                      {item.duration}s
                    </div>
                  </div>

                  {/* Section 2: Topic with Writing Type */}
                  <div className="p-4 border-b border-slate-200">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-lg font-bold text-slate-900 line-clamp-2 flex-1">
                        {item.topic}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getWritingTypeColor(
                          item.writingType
                        )}`}
                      >
                        {item.writingType.charAt(0).toUpperCase() + item.writingType.slice(1)}
                      </span>
                      {item.theme && (
                        <span className="text-xs text-slate-500">
                          {item.theme}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Section 3: Student Writing */}
                  <div className="p-4">
                    <h4 className="text-sm font-semibold text-slate-700 mb-2">Your Writing:</h4>
                    <p className="text-sm text-slate-600 line-clamp-4">
                      {truncateText(item.studentWriting)}
                    </p>
                    <div className="mt-3 text-xs text-slate-400">
                      {new Date(item.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="w-full sm:w-auto px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                >
                  Previous
                </button>

                {/* Mobile: Simple page info */}
                <div className="flex sm:hidden items-center gap-3">
                  <span className="text-sm font-medium text-slate-700">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                </div>

                {/* Desktop: Full pagination */}
                <div className="hidden sm:flex items-center gap-2 flex-wrap justify-center">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                    .filter(
                      page =>
                        page === 1 ||
                        page === pagination.totalPages ||
                        Math.abs(page - pagination.page) <= 1
                    )
                    .map((page, index, array) => (
                      <div key={page} className="flex items-center gap-2">
                        {index > 0 && array[index - 1] !== page - 1 && (
                          <span className="text-slate-400 px-1">...</span>
                        )}
                        <button
                          onClick={() => setPagination(prev => ({ ...prev, page }))}
                          className={`w-10 h-10 rounded-lg font-semibold transition-colors text-sm ${
                            pagination.page === page
                              ? 'bg-primary-600 text-white'
                              : 'border border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          {page}
                        </button>
                      </div>
                    ))}
                </div>

                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.totalPages}
                  className="w-full sm:w-auto px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                >
                  Next
                </button>
              </div>
            )}

            {/* Results Count */}
            <div className="text-center mt-4 text-sm text-slate-600">
              Showing {gallery.length} of {pagination.total} videos
            </div>
          </>
        )}
    </div>
  );
};

export default VideoGalleryPage;
