import { useState, useEffect } from 'react'
import { Save, X, AlertCircle, Loader, Info } from 'lucide-react'

interface WritingEditorProps {
  promptId: string
  writingType?: 'creative' | 'persuasive' | 'descriptive' | 'narrative' | 'informative' | 'poems'
  onSubmit: (content: string, wordCount: number, noCopyPasteCheck: boolean) => Promise<void>
  submitting: boolean
  error: string | null
  errorObject?: any
  wordCountTarget?: number
  wordCountMin?: number
  wordCountMax?: number
  timeLimit?: number
}

const TYPE_PLACEHOLDERS: Record<string, string> = {
  creative: 'Start writing your story here... Use vivid descriptions and engaging details!',
  persuasive: 'Present your argument clearly... Support your claims with strong evidence!',
  descriptive: 'Paint a picture with words... Use sensory details to bring your description to life!',
  narrative: 'Share your personal story... Include emotions and meaningful reflections!',
  informative: 'Explain your topic clearly... Organize information logically and use examples!',
  poems: 'Express yourself through poetry... Use imagery and figurative language!',
}

const TYPE_LABELS: Record<string, string> = {
  creative: 'Your Story',
  persuasive: 'Your Argument',
  descriptive: 'Your Description',
  narrative: 'Your Story',
  informative: 'Your Explanation',
  poems: 'Your Poem',
}

export const WritingEditor = ({
  promptId,
  writingType = 'creative',
  onSubmit,
  submitting,
  error,
  errorObject,
  wordCountTarget,
  wordCountMin,
  wordCountMax,
  timeLimit,
}: WritingEditorProps) => {
  const [content, setContent] = useState('')
  const [wordCount, setWordCount] = useState(0)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [validationError, setValidationError] = useState('')
  const [noCopyPasteCheck, setNoCopyPasteCheck] = useState(true)

  // Calculate word count
  useEffect(() => {
    const words = content.trim() ? content.trim().split(/\s+/).length : 0
    setWordCount(words)
  }, [content])

  // Timer
  useEffect(() => {
    if (submitting) {
      return
    }
    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [submitting])

  const validateSubmission = () => {
    if (!content.trim()) {
      setValidationError('Please write something before submitting')
      return false
    }

    if (wordCountMin && wordCount < wordCountMin) {
      setValidationError(`Your submission is too short. Minimum ${wordCountMin} words required.`)
      return false
    }

    if (wordCountMax && wordCount > wordCountMax) {
      setValidationError(`Your submission is too long. Maximum ${wordCountMax} words allowed.`)
      return false
    }

    return true
  }

  const handleSubmit = async () => {
    setValidationError('')

    if (!validateSubmission()) {
      return
    }

    await onSubmit(content, wordCount, noCopyPasteCheck)
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    }
    return `${minutes}m ${secs}s`
  }

  const isWordCountOk = !wordCountMin || !wordCountMax || (wordCount >= wordCountMin && wordCount <= wordCountMax)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">{TYPE_LABELS[writingType]}</h2>
        <div className="flex items-center space-x-4">
          {timeLimit && (
            <div className="text-right">
              <p className="text-xs text-slate-600">Time Elapsed</p>
              <p className="text-lg font-bold text-slate-900">{formatTime(elapsedTime)}</p>
            </div>
          )}
          <div className="text-right">
            <p className="text-xs text-slate-600">Word Count</p>
            <p className={`text-lg font-bold ${isWordCountOk ? 'text-primary-600' : 'text-danger-600'}`}>
              {wordCount} words
            </p>
          </div>
        </div>
      </div>

      {/* Word Count Guidance */}
      {(wordCountMin || wordCountMax || wordCountTarget) && (
        <div className="flex items-start space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            {wordCountTarget ? (
              <p className="text-blue-800">
                Target: <span className="font-semibold">{wordCountTarget} words</span>
              </p>
            ) : (
              <p className="text-blue-800">
                Expected length: <span className="font-semibold">{wordCountMin}-{wordCountMax} words</span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Error Messages */}
      {(error || validationError) && (
        <div className="p-4 bg-danger-50 border border-danger-200 rounded-lg flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-danger-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-danger-800">{error || validationError}</p>
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

      {/* Text Editor */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={TYPE_PLACEHOLDERS[writingType]}
        className="w-full h-96 p-4 border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none font-mono text-slate-900 placeholder-slate-400"
        disabled={submitting}
      />

      {/* Character Info */}
      <div className="text-sm text-slate-600">
        <p>{content.length} characters</p>
      </div>

      {/* No Copy Paste Check Toggle */}
      <div className="flex items-center justify-start mb-4">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={noCopyPasteCheck}
            onChange={() => setNoCopyPasteCheck(!noCopyPasteCheck)}
            className="form-checkbox h-5 w-5 text-primary-600 rounded"
          />
          <span className="text-slate-700">No copy and paste checking</span>
        </label>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setContent('')}
          className="flex items-center space-x-2 px-4 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          disabled={submitting}
        >
          <X className="w-4 h-4" />
          <span>Clear</span>
        </button>

        <button
          onClick={handleSubmit}
          disabled={submitting || !content.trim()}
          className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              <span>Submitting...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Submit</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
