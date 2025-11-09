import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader, AlertCircle, Sparkles } from 'lucide-react'
import { useAuth, useWriting } from '../hooks'
import { WritingTypeSelector } from '../components/writing/WritingTypeSelector'
import { TopicSelector } from '../components/writing/TopicSelector'
import { PromptDisplay } from '../components/writing/PromptDisplay'
import { WritingEditor } from '../components/writing/WritingEditor'
import { FeedbackDisplay } from '../components/writing/FeedbackDisplay'
import { WritingSubmission } from '../services/writingService'

export const WritingPage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { currentPrompt, loading, submitting, error, errorObject, loadPromptById, submitWriting } = useWriting()
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null)
  const [step, setStep] = useState<'type' | 'topic' | 'prompt' | 'write' | 'feedback'>('type')
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [feedbackData, setFeedbackData] = useState<any>(null)

  const handleTypeSelect = (type: string) => {
    setSelectedType(type)
    setSelectedTopicId(null)
    setSubmitError('')
    setSubmitSuccess(false)
    setStep('topic')
  }

  const handleTopicSelect = async (topicId: string) => {
    setSelectedTopicId(topicId)
    setSubmitError('')
    setSubmitSuccess(false)
    setStep('prompt')
    await loadPromptById(topicId)
  }

  const handleSubmitWriting = async (content: string, wordCount: number, noCopyPasteCheck: boolean) => {
    if (!currentPrompt) {
      setSubmitError('No prompt selected')
      return
    }

    try {
      const result: any = await submitWriting({
        promptId: currentPrompt.id,
        content,
        wordCount,
        noCopyPasteCheck,
      })

      if (result.success) {
        setSubmitSuccess(true)

        // Create a proper WritingSubmission object for FeedbackDisplay
        const submissionData: WritingSubmission = {
          id: result.submission.id,
          promptId: currentPrompt.id,
          promptTitle: result.submission.promptTitle || currentPrompt.title,
          theme: result.submission.theme || currentPrompt.theme || '',
          promptType: currentPrompt.type,
          content: content,
          wordCount: result.submission.wordCount || wordCount,
          score: result.submission.score,
          feedback: result.submission.feedback,
          status: result.submission.status || 'reviewing',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        // Store the submission data to display
        setFeedbackData(submissionData)

        // Move to feedback step to show results
        setStep('feedback')
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit writing')
      // Error object is already in Redux state via the thunk
    }
  }

  const handleStartNew = () => {
    setSubmitSuccess(false)
    setFeedbackData(null)
    setStep('type')
    setSelectedType(null)
    setSelectedTopicId(null)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Fun Writing</h1>
        <p className="text-slate-600">
          {user?.name}, you have <span className="font-semibold text-primary-600">{user?.aiCredits}</span> AI
          credits available.
        </p>
      </div>

      {/* Success Message */}
      {submitSuccess && (
        <div className="p-4 bg-success-50 border border-success-200 rounded-lg flex items-start space-x-3">
          <div className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5">✓</div>
          <div>
            <p className="text-sm font-medium text-success-800">
              Your submission has been received! We'll analyze it and provide feedback soon.
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {(error || submitError) && (
        <div className="p-4 bg-danger-50 border border-danger-200 rounded-lg flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-danger-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-danger-800">{error || submitError}</p>
            {errorObject && errorObject.message && (
              <p className="text-sm text-danger-700 mt-2">{errorObject.message}</p>
            )}
            {errorObject && errorObject.reason && (
              <p className="text-xs text-danger-600 mt-1 italic">Reason: {errorObject.reason}</p>
            )}
            {errorObject && errorObject.details && (
              <p className="text-xs text-danger-600 mt-1 italic">Details: {errorObject.details}</p>
            )}
            {errorObject && errorObject.indicators && Array.isArray(errorObject.indicators) && errorObject.indicators.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-danger-600 font-semibold">Issues found:</p>
                <ul className="text-xs text-danger-600 mt-1 ml-4 list-disc">
                  {errorObject.indicators.map((indicator: string, idx: number) => (
                    <li key={idx}>{indicator}</li>
                  ))}
                </ul>
              </div>
            )}
            {errorObject && errorObject.minWords !== undefined && errorObject.actualWords !== undefined && (
              <p className="text-xs text-danger-600 mt-1">
                Word count: {errorObject.actualWords} (required: {errorObject.minWords}-{errorObject.maxWords || '∞'})
              </p>
            )}
          </div>
        </div>
      )}

      {/* Step Indicator */}
      <div className="mb-8">
        {/* Mobile Step Indicator (Vertical/Compact) */}
        <div className="sm:hidden grid grid-cols-4 gap-2 text-xs">
          <button
            onClick={() => setStep('type')}
            className={`flex flex-col items-center px-2 py-2 rounded-lg transition-colors ${
              step === 'type'
                ? 'bg-primary-600 text-white font-semibold'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            <span className="text-base mb-1">1️⃣</span>
            <span>Type</span>
          </button>

          <button
            onClick={() => selectedType && setStep('topic')}
            disabled={!selectedType}
            className={`flex flex-col items-center px-2 py-2 rounded-lg transition-colors ${
              step === 'topic'
                ? 'bg-primary-600 text-white font-semibold'
                : selectedType
                  ? 'bg-slate-100 text-slate-700 cursor-pointer'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <span className="text-base mb-1">2️⃣</span>
            <span>Topic</span>
          </button>

          <button
            onClick={() => selectedTopicId && setStep('prompt')}
            disabled={!selectedTopicId}
            className={`flex flex-col items-center px-2 py-2 rounded-lg transition-colors ${
              step === 'prompt'
                ? 'bg-primary-600 text-white font-semibold'
                : selectedTopicId
                  ? 'bg-slate-100 text-slate-700 cursor-pointer'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <span className="text-base mb-1">3️⃣</span>
            <span>View</span>
          </button>

          <button
            onClick={() => currentPrompt && setStep('write')}
            disabled={!currentPrompt}
            className={`flex flex-col items-center px-2 py-2 rounded-lg transition-colors ${
              step === 'write'
                ? 'bg-primary-600 text-white font-semibold'
                : currentPrompt
                  ? 'bg-slate-100 text-slate-700 cursor-pointer'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <span className="text-base mb-1">4️⃣</span>
            <span>Write</span>
          </button>
        </div>

        {/* Desktop Step Indicator (Horizontal with Lines) */}
        <div className="hidden sm:flex items-center justify-between text-sm">
          <button
            onClick={() => setStep('type')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
              step === 'type'
                ? 'bg-primary-100 text-primary-700 font-semibold'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            <span className="text-lg">1️⃣</span>
            <span>Type</span>
          </button>

          <div className={`h-1 flex-1 mx-2 ${['topic', 'prompt', 'write'].includes(step) ? 'bg-primary-600' : 'bg-slate-300'}`}></div>

          <button
            onClick={() => selectedType && setStep('topic')}
            disabled={!selectedType}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
              step === 'topic'
                ? 'bg-primary-100 text-primary-700 font-semibold'
                : selectedType
                  ? 'bg-slate-100 text-slate-700 cursor-pointer'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <span className="text-lg">2️⃣</span>
            <span>Topic</span>
          </button>

          <div className={`h-1 flex-1 mx-2 ${['prompt', 'write'].includes(step) ? 'bg-primary-600' : 'bg-slate-300'}`}></div>

          <button
            onClick={() => selectedTopicId && setStep('prompt')}
            disabled={!selectedTopicId}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
              step === 'prompt'
                ? 'bg-primary-100 text-primary-700 font-semibold'
                : selectedTopicId
                  ? 'bg-slate-100 text-slate-700 cursor-pointer'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <span className="text-lg">3️⃣</span>
            <span>View</span>
          </button>

          <div className={`h-1 flex-1 mx-2 ${step === 'write' ? 'bg-primary-600' : 'bg-slate-300'}`}></div>

          <button
            onClick={() => currentPrompt && setStep('write')}
            disabled={!currentPrompt}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
              step === 'write'
                ? 'bg-primary-100 text-primary-700 font-semibold'
                : currentPrompt
                  ? 'bg-slate-100 text-slate-700 cursor-pointer'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <span className="text-lg">4️⃣</span>
            <span>Write</span>
          </button>
        </div>
      </div>

      {/* Content Sections */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        {/* Step 1: Type Selection */}
        {step === 'type' && (
          <div>
            <WritingTypeSelector selectedType={selectedType} onTypeSelect={handleTypeSelect} />
          </div>
        )}

        {/* Step 2: Topic Selection */}
        {step === 'topic' && selectedType && (
          <div className="space-y-6">
            <TopicSelector
              ageGroup={user?.ageGroup || '11-14'}
              writingType={selectedType}
              selectedTopicId={selectedTopicId}
              onTopicSelect={handleTopicSelect}
            />
            <div className="flex gap-4">
              <button
                onClick={() => setStep('type')}
                className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
              >
                Back to Types
              </button>
              <button
                onClick={() => selectedTopicId && setStep('prompt')}
                disabled={!selectedTopicId}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Prompt Display */}
        {step === 'prompt' && (
          <div className="space-y-6">
            <PromptDisplay prompt={currentPrompt} loading={loading} error={error} />
            <div className="flex gap-4">
              <button
                onClick={() => setStep('topic')}
                className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
              >
                Back to Topics
              </button>
              <button
                onClick={() => setStep('write')}
                disabled={!currentPrompt}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50"
              >
                Start Writing →
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Writing Editor */}
        {step === 'write' && currentPrompt && (
          <div className="space-y-6">
            {/* Show the Prompt Above the Editor */}
            <div className="mb-8 pb-8 border-b border-slate-200">
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Your Writing Prompt</h3>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold border ${
                      currentPrompt.difficulty === 'easy'
                        ? 'bg-success-100 text-success-700 border-success-300'
                        : currentPrompt.difficulty === 'medium'
                          ? 'bg-warning-100 text-warning-700 border-warning-300'
                          : 'bg-danger-100 text-danger-700 border-danger-300'
                    }`}
                  >
                    {currentPrompt.difficulty.charAt(0).toUpperCase() + currentPrompt.difficulty.slice(1)} Difficulty
                  </span>
                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-700 border border-blue-300">
                    {currentPrompt.theme}
                  </span>
                </div>
                <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-6 border-l-4 border-primary-600">
                  <h4 className="text-lg font-bold text-slate-900 mb-2">{currentPrompt.title}</h4>
                  <p className="text-lg text-slate-900 leading-relaxed">{currentPrompt.prompt}</p>
                </div>
                {currentPrompt.description && (
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-slate-700">{currentPrompt.description}</p>
                  </div>
                )}
                {currentPrompt.instructions && currentPrompt.instructions.length > 0 && (
                  <div>
                    <h5 className="font-semibold text-slate-900 mb-2">Key Points to Address:</h5>
                    <ul className="space-y-2">
                      {currentPrompt.instructions.map((instruction, index) => (
                        <li key={index} className="flex space-x-3">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs font-semibold">
                            {index + 1}
                          </span>
                          <span className="text-slate-700">{instruction}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Writing Editor */}
            <WritingEditor
              promptId={currentPrompt.id}
              writingType={currentPrompt.type}
              onSubmit={handleSubmitWriting}
              submitting={submitting}
              error={error || submitError || null}
              errorObject={errorObject}
              wordCountTarget={currentPrompt.wordCountTarget}
              wordCountMin={currentPrompt.wordCountMin}
              wordCountMax={currentPrompt.wordCountMax}
              timeLimit={currentPrompt.timeLimit}
            />
          </div>
        )}

        {/* Step 5: Feedback Display */}
        {step === 'feedback' && feedbackData && (
          <div className="space-y-6">
            {/* Success Header */}
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-success-100 rounded-full mb-4">
                <span className="text-4xl">✅</span>
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Writing Submitted Successfully!</h2>
              <p className="text-slate-600">
                {feedbackData.status === 'reviewed'
                  ? "Your writing has been analyzed. Here's your feedback:"
                  : "Your submission has been received and is being analyzed..."}
              </p>
            </div>

            {/* Use FeedbackDisplay component to handle all feedback scenarios */}
            <FeedbackDisplay submission={feedbackData} />

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-6">
              {/* Generate Media Button - Primary CTA if submission is reviewed with score */}
              {feedbackData.status === 'reviewed' && feedbackData.score !== undefined && (
                <button
                  onClick={() => navigate(`/submissions/${feedbackData.id}`)}
                  className="flex items-center justify-center space-x-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-primary-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-primary-700 transition-all shadow-lg hover:shadow-xl"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>Generate Media</span>
                </button>
              )}
              <button
                onClick={handleStartNew}
                className="px-8 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
              >
                Write Another
              </button>
              <button
                onClick={() => navigate('/submissions')}
                className="px-8 py-3 border-2 border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
              >
                View All Submissions
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-6 h-6 animate-spin text-primary-600 mr-2" />
            <span className="text-slate-600">Loading...</span>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-3">📚 Writing Tips</h3>
        <ul className="text-sm text-blue-800 space-y-2">
          <li>
            <strong>Read the prompt carefully:</strong> Understand all requirements before you start writing
          </li>
          <li>
            <strong>Plan your story:</strong> Spend time organizing your ideas before writing
          </li>
          <li>
            <strong>Use descriptive language:</strong> Paint vivid pictures with your words
          </li>
          <li>
            <strong>Proofread:</strong> Check for grammar and spelling mistakes before submitting
          </li>
          <li>
            <strong>Save your work:</strong> Our editor auto-saves as you type
          </li>
        </ul>
      </div>
    </div>
  )
}
