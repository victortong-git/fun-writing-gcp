import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader, AlertCircle } from 'lucide-react'
import { useWriting, useAuth } from '../hooks'
import { FeedbackDisplay } from '../components/writing/FeedbackDisplay'
import { MediaGeneration } from '../components/media/MediaGeneration'
import { WritingSubmission } from '../services/writingService'

export const SubmissionDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { selectedSubmission, loading, error, loadSubmissionDetails } = useWriting()
  const { user, updateUser } = useAuth()
  const [localSubmission, setLocalSubmission] = useState<WritingSubmission | null>(null)

  useEffect(() => {
    if (id) {
      loadSubmissionDetails(id)
    }
  }, [id])

  useEffect(() => {
    if (selectedSubmission) {
      setLocalSubmission(selectedSubmission)
    }
  }, [selectedSubmission])

  const handleReanalyzeSuccess = (updatedSubmission: WritingSubmission) => {
    setLocalSubmission(updatedSubmission)
    // Reload from server to ensure consistency
    if (id) {
      loadSubmissionDetails(id)
    }
  }

  const handleCreditsUpdate = (newCredits: number) => {
    updateUser({ aiCredits: newCredits })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-primary-600 mr-3" />
        <span className="text-lg text-slate-600">Loading submission...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate('/submissions')}
          className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Submissions</span>
        </button>
        <div className="p-4 bg-danger-50 border border-danger-200 rounded-lg flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-danger-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-danger-800">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!selectedSubmission && !localSubmission) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate('/submissions')}
          className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Submissions</span>
        </button>
        <div className="text-center py-12">
          <p className="text-slate-600">Submission not found</p>
        </div>
      </div>
    )
  }

  const displaySubmission = localSubmission || selectedSubmission

  if (!displaySubmission) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/submissions')}
        className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Submissions</span>
      </button>

      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-6 gap-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">{displaySubmission.promptTitle}</h1>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {displaySubmission.theme && (
                <span className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold bg-blue-100 text-blue-700 border border-blue-300">
                  {displaySubmission.theme}
                </span>
              )}
              {displaySubmission.promptType && (
                <span className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold bg-purple-100 text-purple-700 border border-purple-300">
                  {displaySubmission.promptType.charAt(0).toUpperCase() + displaySubmission.promptType.slice(1)}
                </span>
              )}
              <span
                className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${
                  displaySubmission.status === 'reviewed'
                    ? 'bg-success-100 text-success-700 border border-success-300'
                    : 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                }`}
              >
                {displaySubmission.status === 'reviewed' ? '✅ Reviewed' :
                 displaySubmission.status === 'reviewing' ? '⏳ Reviewing' :
                 displaySubmission.status.charAt(0).toUpperCase() + displaySubmission.status.slice(1)}
              </span>
            </div>
          </div>
          <div className="flex gap-4 sm:gap-6 justify-center md:justify-end">
            {displaySubmission.score !== undefined && (
              <div className="text-center md:text-right">
                <p className="text-xs sm:text-sm text-slate-600 mb-1">Score</p>
                <p className="text-3xl sm:text-4xl font-bold text-primary-600">{displaySubmission.score}</p>
                <p className="text-xs sm:text-sm text-slate-600">/100</p>
              </div>
            )}
            <div className="text-center md:text-right">
              <p className="text-xs sm:text-sm text-slate-600 mb-1">Credits</p>
              <p className="text-3xl sm:text-4xl font-bold text-blue-600">{user?.aiCredits || 0}</p>
              <p className="text-xs sm:text-sm text-slate-600">available</p>
            </div>
          </div>
        </div>

        {/* Submission Info */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-6 border-t border-slate-200">
          <div>
            <p className="text-xs text-slate-600 font-medium mb-1">Word Count</p>
            <p className="text-lg font-bold text-slate-900">{displaySubmission.wordCount}</p>
          </div>
          <div>
            <p className="text-xs text-slate-600 font-medium mb-1">Submitted</p>
            <p className="text-lg font-bold text-slate-900">
              {new Date(displaySubmission.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-600 font-medium mb-1">Time Spent</p>
            <p className="text-lg font-bold text-slate-900">
              {displaySubmission.timeSpent ?
                displaySubmission.timeSpent >= 60
                  ? `${Math.floor(displaySubmission.timeSpent / 60)}m ${displaySubmission.timeSpent % 60}s`
                  : `${displaySubmission.timeSpent}s`
                : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-600 font-medium mb-1">Last Updated</p>
            <p className="text-lg font-bold text-slate-900">
              {new Date(displaySubmission.updatedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Your Writing */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Your Writing</h2>
        <div className="bg-slate-50 rounded-lg p-6 border border-slate-200 max-h-96 overflow-y-auto">
          <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">{displaySubmission.content}</p>
        </div>
      </div>

      {/* Feedback */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Detailed Feedback</h2>
        <FeedbackDisplay
          submission={displaySubmission}
          onReanalyzeSuccess={handleReanalyzeSuccess}
        />
      </div>

      {/* Media Generation */}
      {displaySubmission.status === 'reviewed' && displaySubmission.score !== undefined && (
        <MediaGeneration
          submissionId={displaySubmission.id}
          submissionScore={displaySubmission.score}
          onCreditsUpdate={handleCreditsUpdate}
        />
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={() => navigate('/writing')}
          className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
        >
          Write Another Story
        </button>
        <button
          onClick={() => navigate('/submissions')}
          className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
        >
          Back to Submissions
        </button>
      </div>
    </div>
  )
}
