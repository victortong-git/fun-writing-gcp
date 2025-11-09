import { Loader, AlertCircle, Lightbulb, BookOpen, Clock, TrendingUp } from 'lucide-react'
import { WritingPrompt } from '../../services/writingService'

interface PromptDisplayProps {
  prompt: WritingPrompt | null
  loading: boolean
  error: string | null
}

const difficultyColors: Record<string, string> = {
  easy: 'bg-success-100 text-success-700 border-success-300',
  medium: 'bg-warning-100 text-warning-700 border-warning-300',
  hard: 'bg-danger-100 text-danger-700 border-danger-300',
}

const typeIcons: Record<string, string> = {
  creative: '📖',
  persuasive: '🎯',
  descriptive: '🎨',
  narrative: '📝',
  informative: 'ℹ️',
  poems: '✨',
}

const typeColors: Record<string, string> = {
  creative: 'bg-purple-100 text-purple-700 border-purple-300',
  persuasive: 'bg-orange-100 text-orange-700 border-orange-300',
  descriptive: 'bg-indigo-100 text-indigo-700 border-indigo-300',
  narrative: 'bg-green-100 text-green-700 border-green-300',
  informative: 'bg-cyan-100 text-cyan-700 border-cyan-300',
  poems: 'bg-pink-100 text-pink-700 border-pink-300',
}

const typeTips: Record<string, string[]> = {
  creative: [
    '• Use vivid descriptions and engaging details',
    '• Develop unique characters with clear motivations',
    '• Create a compelling plot with clear beginning, middle, and end',
    '• Show emotions and feelings through actions and dialogue',
    '• Make your story entertaining and engaging',
  ],
  persuasive: [
    '• State your position or argument clearly upfront',
    '• Support your claims with strong evidence and examples',
    '• Address potential counterarguments',
    '• Use logical reasoning and persuasive language',
    '• End with a compelling conclusion or call to action',
  ],
  descriptive: [
    '• Use sensory details (sight, sound, smell, taste, touch)',
    '• Be specific and concrete in your descriptions',
    '• Use metaphors and similes to paint vivid pictures',
    '• Engage the reader\'s imagination with rich language',
    '• Create mood and atmosphere through description',
  ],
  narrative: [
    '• Tell your story in chronological order or use flashbacks',
    '• Include specific details and personal reflections',
    '• Show emotions and personal growth',
    '• Use dialogue to bring characters and moments to life',
    '• End with meaningful insights or lessons learned',
  ],
  informative: [
    '• Organize information logically and clearly',
    '• Explain concepts in simple, accessible language',
    '• Use examples and evidence to support your points',
    '• Define technical terms when necessary',
    '• Summarize key points in your conclusion',
  ],
  poems: [
    '• Consider the form and structure of your poem',
    '• Use imagery and figurative language effectively',
    '• Pay attention to rhythm, rhyme, and word choice',
    '• Express emotions and ideas concisely',
    '• Read your poem aloud to check how it sounds',
  ],
}

export const PromptDisplay = ({ prompt, loading, error }: PromptDisplayProps) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-6 h-6 animate-spin text-primary-600 mr-2" />
        <span className="text-slate-600">Loading your prompt...</span>
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

  if (!prompt) {
    return (
      <div className="text-center py-12">
        <Lightbulb className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <p className="text-slate-600">Select a writing type to see your personalized prompt</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-slate-900 mb-2">{prompt.title}</h2>
        <div className="flex flex-wrap gap-3">
          <span
            className={`px-3 py-1 rounded-full text-sm font-semibold border ${
              difficultyColors[prompt.difficulty]
            }`}
          >
            {prompt.difficulty.charAt(0).toUpperCase() + prompt.difficulty.slice(1)} Difficulty
          </span>
          {prompt.type && (
            <span
              className={`px-3 py-1 rounded-full text-sm font-semibold border flex items-center gap-1 ${
                typeColors[prompt.type] || 'bg-slate-100 text-slate-700 border-slate-300'
              }`}
            >
              <span>{typeIcons[prompt.type] || '📚'}</span>
              <span className="capitalize">{prompt.type}</span>
            </span>
          )}
          {prompt.theme && (
            <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-700 border border-blue-300">
              {prompt.theme}
            </span>
          )}
        </div>
      </div>

      {/* Main Prompt */}
      <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-6 border-l-4 border-primary-600">
        <p className="text-lg text-slate-900 leading-relaxed">{prompt.prompt}</p>
      </div>

      {/* Description */}
      {prompt.description && (
        <div>
          <h3 className="font-semibold text-slate-900 mb-2 flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-primary-600" />
            <span>About this prompt</span>
          </h3>
          <p className="text-slate-700">{prompt.description}</p>
        </div>
      )}

      {/* Instructions */}
      {prompt.instructions && prompt.instructions.length > 0 && (
        <div>
          <h3 className="font-semibold text-slate-900 mb-3">Instructions</h3>
          <ol className="space-y-2">
            {prompt.instructions.map((instruction, index) => (
              <li key={index} className="flex space-x-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-600 text-white flex items-center justify-center text-sm font-semibold">
                  {index + 1}
                </span>
                <span className="text-slate-700">{instruction}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Guidelines */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Word Count */}
        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h4 className="font-semibold text-slate-900">Word Count</h4>
          </div>
          <div>
            {prompt.wordCountTarget ? (
              <p className="text-sm">
                <span className="font-bold text-blue-600">{prompt.wordCountTarget}</span> words target
              </p>
            ) : (
              <p className="text-sm text-slate-600">
                {prompt.wordCountMin}-{prompt.wordCountMax} words
              </p>
            )}
          </div>
        </div>

        {/* Time Limit */}
        {prompt.timeLimit && (
          <div className="bg-white rounded-lg p-4 border border-slate-200">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="w-5 h-5 text-orange-600" />
              <h4 className="font-semibold text-slate-900">Time Limit</h4>
            </div>
            <p className="text-sm">
              <span className="font-bold text-orange-600">{prompt.timeLimit}</span> minutes
            </p>
          </div>
        )}

        {/* Category */}
        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <div className="flex items-center space-x-2 mb-2">
            <Lightbulb className="w-5 h-5 text-yellow-600" />
            <h4 className="font-semibold text-slate-900">Type</h4>
          </div>
          <p className="text-sm">
            <span className="font-bold text-yellow-600 capitalize">{prompt.category}</span>
          </p>
        </div>
      </div>

      {/* Type-Specific Tips */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <h4 className="font-semibold text-blue-900 mb-2">
          {prompt.type && typeIcons[prompt.type] || '💡'} Tips for {prompt.type ? prompt.type.charAt(0).toUpperCase() + prompt.type.slice(1) : 'Writing'} Writing
        </h4>
        <ul className="text-sm text-blue-800 space-y-1">
          {prompt.type && typeTips[prompt.type]?.map((tip, index) => (
            <li key={index}>{tip}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
