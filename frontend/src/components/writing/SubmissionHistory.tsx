import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader, AlertCircle, BookOpen, ChevronRight, Trash2, Eye } from 'lucide-react'
import { useWriting } from '../../hooks'
import { WritingSubmission } from '../../services/writingService'

interface SubmissionHistoryProps {
  onSubmissionSelect?: (submissionId: string) => void
}

const getStatusBadge = (
  status: WritingSubmission['status']
): { color: string; label: string } => {
  switch (status) {
    case 'submitted':
      return { color: 'bg-blue-100 text-blue-800 border-blue-300', label: '⏳ Submitted' }
    case 'reviewing':
      return { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', label: '🔄 Reviewing' }
    case 'reviewed':
      return { color: 'bg-green-100 text-green-800 border-green-300', label: '✅ Reviewed' }
    case 'revised':
      return { color: 'bg-purple-100 text-purple-800 border-purple-300', label: '📝 Revised' }
  }
}

export const SubmissionHistory = ({ onSubmissionSelect }: SubmissionHistoryProps) => {
  const navigate = useNavigate()
  const { submissions, pagination, loading, error, loadSubmissions, deleteSubmission } = useWriting()
  const [currentPage, setCurrentPage] = useState(1)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    loadSubmissions(currentPage, 10)
  }, [currentPage])

  const handleDelete = async (submissionId: string) => {
    if (window.confirm('Are you sure you want to delete this submission? This action cannot be undone.')) {
      setDeleting(submissionId)
      try {
        await deleteSubmission(submissionId)
      } finally {
        setDeleting(null)
      }
    }
  }

  const handleView = (submissionId: string) => {
    if (onSubmissionSelect) {
      onSubmissionSelect(submissionId)
    } else {
      navigate(`/submissions/${submissionId}`)
    }
  }

  if (loading && submissions.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-6 h-6 animate-spin text-primary-600 mr-2" />
        <span className="text-slate-600">Loading submissions...</span>
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

  if (submissions.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <p className="text-slate-600">No submissions yet</p>
        <p className="text-sm text-slate-500 mt-1">Start by creating your first submission</p>
        <button
          onClick={() => navigate('/writing')}
          className="mt-4 text-primary-600 font-medium hover:text-primary-700"
        >
          Create submission →
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Submissions List */}
      <div className="space-y-3">
        {submissions.map((submission) => {
          const statusInfo = getStatusBadge(submission.status)
          return (
            <div
              key={submission.id}
              className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                {/* Left content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-slate-900 truncate">{submission.promptTitle}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ml-2 ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-slate-600">Words</p>
                      <p className="font-semibold text-slate-900">{submission.wordCount}</p>
                    </div>

                    {submission.score !== undefined && (
                      <div>
                        <p className="text-slate-600">Score</p>
                        <p className="font-semibold text-slate-900">{submission.score}/100</p>
                      </div>
                    )}

                    <div>
                      <p className="text-slate-600">Type</p>
                      <p className="font-semibold text-slate-900 capitalize">{submission.promptType || submission.theme}</p>
                    </div>

                    <div>
                      <p className="text-slate-600">Date</p>
                      <p className="font-semibold text-slate-900">
                        {new Date(submission.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleView(submission.id)}
                    className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    title="View submission"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(submission.id)}
                    disabled={deleting === submission.id}
                    className="p-2 text-danger-600 hover:bg-danger-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Delete submission"
                  >
                    {deleting === submission.id ? (
                      <Loader className="w-5 h-5 animate-spin" />
                    ) : (
                      <Trash2 className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => handleView(submission.id)}
                    className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>

          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                currentPage === page
                  ? 'bg-primary-600 text-white'
                  : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={currentPage === pagination.totalPages}
            className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {/* Info */}
      <div className="text-center text-sm text-slate-600 mt-4">
        Showing {(currentPage - 1) * 10 + 1} to {Math.min(currentPage * 10, pagination.total)} of{' '}
        {pagination.total} submissions
      </div>
    </div>
  )
}
