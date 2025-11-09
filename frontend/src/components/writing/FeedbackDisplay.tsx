import { useState } from 'react'
import { AlertCircle, CheckCircle, MessageSquare, TrendingUp, Award, RefreshCw } from 'lucide-react'
import { WritingSubmission, reanalyzeSubmission } from '../../services/writingService'

interface FeedbackDisplayProps {
  submission: WritingSubmission
  onReanalyzeSuccess?: (updatedSubmission: WritingSubmission) => void
}

const getFeedbackColor = (score: number): string => {
  if (score >= 80) return 'text-success-600'
  if (score >= 60) return 'text-warning-600'
  return 'text-danger-600'
}

const getScoreLabel = (score: number): string => {
  if (score >= 90) return 'Excellent'
  if (score >= 80) return 'Very Good'
  if (score >= 70) return 'Good'
  if (score >= 60) return 'Satisfactory'
  return 'Needs Improvement'
}

export const FeedbackDisplay = ({ submission, onReanalyzeSuccess }: FeedbackDisplayProps) => {
  const feedback = submission.feedback
  const [reanalyzing, setReanalyzing] = useState(false)
  const [reanalyzeError, setReanalyzeError] = useState<string | null>(null)

  // Check if feedback has issues (grammar or spelling evaluation failed)
  const hasIssues = feedback && (
    (feedback.breakdown?.grammar === 0 && feedback.grammarFeedback === 'Unable to evaluate') ||
    (feedback.breakdown?.spelling === 0 && feedback.spellingFeedback === 'Unable to evaluate') ||
    (feedback.breakdown?.relevance === 0 && feedback.relevanceFeedback === 'Unable to evaluate') ||
    (feedback.breakdown?.creativity === 0 && feedback.creativityFeedback === 'Unable to evaluate')
  )

  // Check if feedback is severely corrupted (multiple sections failed)
  const isSeverelyCorrupted = feedback && feedback.breakdown && (
    [
      feedback.breakdown.grammar === 0 && feedback.grammarFeedback === 'Unable to evaluate',
      feedback.breakdown.spelling === 0 && feedback.spellingFeedback === 'Unable to evaluate',
      feedback.breakdown.relevance === 0 && feedback.relevanceFeedback === 'Unable to evaluate',
      feedback.breakdown.creativity === 0 && feedback.creativityFeedback === 'Unable to evaluate'
    ].filter(Boolean).length >= 2
  )

  const handleReanalyze = async () => {
    try {
      setReanalyzing(true)
      setReanalyzeError(null)

      const result = await reanalyzeSubmission(submission.id)

      if (onReanalyzeSuccess && result.submission) {
        onReanalyzeSuccess(result.submission)
      }
    } catch (error: any) {
      setReanalyzeError(error.message || 'Failed to re-analyze submission')
      console.error('Re-analysis error:', error)
    } finally {
      setReanalyzing(false)
    }
  }

  if (submission.status === 'submitted' || submission.status === 'reviewing') {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <TrendingUp className="w-8 h-8 text-blue-600 animate-pulse" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Feedback in Progress</h3>
        <p className="text-slate-600">
          Our AI is analyzing your submission. Check back soon for detailed feedback on your writing!
        </p>
      </div>
    )
  }

  if (!feedback || submission.status !== 'reviewed') {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <p className="text-slate-600">No feedback available yet</p>
      </div>
    )
  }

  // If feedback is severely corrupted, show prominent error message and hide details
  if (isSeverelyCorrupted) {
    return (
      <div className="space-y-6">
        {/* Prominent Error Banner */}
        <div className="bg-gradient-to-br from-danger-50 to-warning-50 rounded-xl border-2 border-warning-300 p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-warning-100 rounded-full mb-4">
            <AlertCircle className="w-8 h-8 text-warning-600" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-3">Feedback Generation Failed</h3>
          <p className="text-slate-700 mb-6 max-w-2xl mx-auto">
            Our AI encountered an issue while analyzing your writing and couldn't generate complete feedback. 
            This sometimes happens due to temporary service issues. Please click the button below to re-analyze your submission.
          </p>
          <button
            onClick={handleReanalyze}
            disabled={reanalyzing}
            className="inline-flex items-center space-x-2 px-8 py-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold text-lg shadow-lg"
          >
            <RefreshCw className={`w-5 h-5 ${reanalyzing ? 'animate-spin' : ''}`} />
            <span>{reanalyzing ? 'Re-analyzing Your Writing...' : 'Re-Analyze Now'}</span>
          </button>
          {reanalyzeError && (
            <div className="mt-4 p-4 bg-danger-50 border border-danger-200 rounded-lg max-w-md mx-auto">
              <p className="text-sm text-danger-800 font-medium">{reanalyzeError}</p>
            </div>
          )}
        </div>

        {/* Show basic score if available */}
        {submission.score !== undefined && (
          <div className="bg-slate-50 rounded-lg border border-slate-200 p-6 text-center">
            <p className="text-slate-600 mb-2">Current Score (may be inaccurate)</p>
            <p className="text-4xl font-bold text-slate-400">{submission.score}/100</p>
            <p className="text-sm text-slate-500 mt-2">Re-analyze to get accurate feedback</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Warning Banner for Partial Issues */}
      {hasIssues && !isSeverelyCorrupted && (
        <div className="bg-warning-50 rounded-lg border-2 border-warning-300 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start space-x-3 flex-1">
              <AlertCircle className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-warning-900 mb-1">Some feedback sections are incomplete</p>
                <p className="text-sm text-warning-800">
                  The AI had trouble analyzing some aspects of your writing. Click "Re-Analyze" to regenerate complete feedback.
                </p>
              </div>
            </div>
            <button
              onClick={handleReanalyze}
              disabled={reanalyzing}
              className="flex items-center space-x-2 px-5 py-2.5 bg-warning-600 text-white rounded-lg hover:bg-warning-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold whitespace-nowrap shadow-md"
            >
              <RefreshCw className={`w-4 h-4 ${reanalyzing ? 'animate-spin' : ''}`} />
              <span>{reanalyzing ? 'Re-analyzing...' : 'Re-Analyze'}</span>
            </button>
          </div>
          {reanalyzeError && (
            <div className="mt-3 p-3 bg-danger-50 border border-danger-200 rounded-lg">
              <p className="text-sm text-danger-800 font-medium">{reanalyzeError}</p>
            </div>
          )}
        </div>
      )}

      {/* Re-Analyze Option for All Submissions */}
      {!hasIssues && !isSeverelyCorrupted && (
        <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start space-x-3 flex-1">
              <RefreshCw className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-900 mb-1">Want fresh feedback?</p>
                <p className="text-sm text-slate-600">
                  Re-analyze your submission to get new AI-generated feedback and insights.
                </p>
              </div>
            </div>
            <button
              onClick={handleReanalyze}
              disabled={reanalyzing}
              className="flex items-center space-x-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold whitespace-nowrap shadow-md"
            >
              <RefreshCw className={`w-4 h-4 ${reanalyzing ? 'animate-spin' : ''}`} />
              <span>{reanalyzing ? 'Re-analyzing...' : 'Re-Analyze'}</span>
            </button>
          </div>
          {reanalyzeError && (
            <div className="mt-3 p-3 bg-danger-50 border border-danger-200 rounded-lg">
              <p className="text-sm text-danger-800 font-medium">{reanalyzeError}</p>
            </div>
          )}
        </div>
      )}

      {/* Overall Score */}
      <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-8 text-center border-l-4 border-primary-600">
        <p className="text-slate-600 mb-2">Overall Score</p>
        <div className="flex items-center justify-center space-x-4">
          <div>
            <p className={`text-5xl font-bold ${getFeedbackColor(submission.score || 0)}`}>
              {submission.score}
            </p>
            <p className="text-slate-600">/100</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{getScoreLabel(submission.score || 0)}</p>
            <p className="text-slate-600 text-sm">
              {(submission.score || 0) >= 51 ? '🎉 Media generation unlocked!' : 'Score 51+ to unlock media generation'}
            </p>
          </div>
        </div>
      </div>

      {/* 4-Area Scoring Breakdown */}
      {feedback.breakdown && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Grammar & Sentence Structure */}
          {feedback.breakdown.grammar !== undefined && 
           !(feedback.breakdown.grammar === 0 && feedback.grammarFeedback === 'Unable to evaluate') && (
            <div className="bg-white rounded-lg border border-slate-200 p-5">
              <div className="flex items-center space-x-2 mb-3">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-slate-900">Grammar & Sentence Structure</h3>
              </div>
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">Score</span>
                  <span className={`font-bold text-lg ${getFeedbackColor(feedback.breakdown.grammar)}`}>
                    {feedback.breakdown.grammar}/25
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-full rounded-full"
                    style={{ width: `${(feedback.breakdown.grammar / 25) * 100}%` }}
                  ></div>
                </div>
              </div>
              {feedback.grammarFeedback && feedback.grammarFeedback !== 'Unable to evaluate' && (
                <p className="text-sm text-slate-700 mt-2">{feedback.grammarFeedback}</p>
              )}
            </div>
          )}

          {/* Spelling & Vocabulary */}
          {feedback.breakdown.spelling !== undefined && 
           !(feedback.breakdown.spelling === 0 && feedback.spellingFeedback === 'Unable to evaluate') && (
            <div className="bg-white rounded-lg border border-slate-200 p-5">
              <div className="flex items-center space-x-2 mb-3">
                <MessageSquare className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-slate-900">Spelling & Vocabulary</h3>
              </div>
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">Score</span>
                  <span className={`font-bold text-lg ${getFeedbackColor(feedback.breakdown.spelling)}`}>
                    {feedback.breakdown.spelling}/25
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-full rounded-full"
                    style={{ width: `${(feedback.breakdown.spelling / 25) * 100}%` }}
                  ></div>
                </div>
              </div>
              {feedback.spellingFeedback && feedback.spellingFeedback !== 'Unable to evaluate' && (
                <p className="text-sm text-slate-700 mt-2">{feedback.spellingFeedback}</p>
              )}
            </div>
          )}

          {/* Relevance & Content */}
          {feedback.breakdown.relevance !== undefined && 
           !(feedback.breakdown.relevance === 0 && feedback.relevanceFeedback === 'Unable to evaluate') && (
            <div className="bg-white rounded-lg border border-slate-200 p-5">
              <div className="flex items-center space-x-2 mb-3">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-slate-900">Relevance & Content</h3>
              </div>
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">Score</span>
                  <span className={`font-bold text-lg ${getFeedbackColor(feedback.breakdown.relevance)}`}>
                    {feedback.breakdown.relevance}/25
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-purple-500 h-full rounded-full"
                    style={{ width: `${(feedback.breakdown.relevance / 25) * 100}%` }}
                  ></div>
                </div>
              </div>
              {feedback.relevanceFeedback && feedback.relevanceFeedback !== 'Unable to evaluate' && (
                <p className="text-sm text-slate-700 mt-2">{feedback.relevanceFeedback}</p>
              )}
            </div>
          )}

          {/* Creativity & Voice */}
          {feedback.breakdown.creativity !== undefined && 
           !(feedback.breakdown.creativity === 0 && feedback.creativityFeedback === 'Unable to evaluate') && (
            <div className="bg-white rounded-lg border border-slate-200 p-5">
              <div className="flex items-center space-x-2 mb-3">
                <Award className="w-5 h-5 text-orange-600" />
                <h3 className="font-semibold text-slate-900">Creativity & Voice</h3>
              </div>
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">Score</span>
                  <span className={`font-bold text-lg ${getFeedbackColor(feedback.breakdown.creativity)}`}>
                    {feedback.breakdown.creativity}/25
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-orange-500 h-full rounded-full"
                    style={{ width: `${(feedback.breakdown.creativity / 25) * 100}%` }}
                  ></div>
                </div>
              </div>
              {feedback.creativityFeedback && feedback.creativityFeedback !== 'Unable to evaluate' && (
                <p className="text-sm text-slate-700 mt-2">{feedback.creativityFeedback}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* General Comment */}
      {feedback.generalComment && (
        <div className="bg-slate-50 rounded-lg border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-3">💬 General Comment</h3>
          <p className="text-slate-700">{feedback.generalComment}</p>
        </div>
      )}

      {/* Strengths */}
      {feedback.strengths && Array.isArray(feedback.strengths) && feedback.strengths.length > 0 && (
        <div className="bg-success-50 rounded-lg border border-success-200 p-5">
          <h3 className="font-semibold text-success-900 mb-3">✨ Strengths</h3>
          <ul className="space-y-2">
            {feedback.strengths.map((strength: string, idx: number) => (
              <li key={idx} className="flex space-x-3 text-success-800">
                <span className="text-success-600 font-bold">✓</span>
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Areas for Improvement */}
      {feedback.areasForImprovement && Array.isArray(feedback.areasForImprovement) && feedback.areasForImprovement.length > 0 && (
        <div className="bg-warning-50 rounded-lg border border-warning-200 p-5">
          <h3 className="font-semibold text-warning-900 mb-3">🎯 Areas for Improvement</h3>
          <ul className="space-y-2">
            {feedback.areasForImprovement.map((area: string, idx: number) => (
              <li key={idx} className="flex space-x-3 text-warning-800">
                <span className="text-warning-600 font-bold">→</span>
                <span>{area}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Next Steps */}
      {feedback.nextSteps && Array.isArray(feedback.nextSteps) && feedback.nextSteps.length > 0 && (
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-5">
          <h3 className="font-semibold text-blue-900 mb-3">📚 Next Steps</h3>
          <ul className="space-y-2">
            {feedback.nextSteps.map((step: string, idx: number) => (
              <li key={idx} className="flex space-x-3 text-blue-800">
                <span className="text-blue-600 font-bold">→</span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
