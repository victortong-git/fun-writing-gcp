import { useEffect, useState } from 'react'
import { Loader, AlertCircle, ChevronRight } from 'lucide-react'
import * as writingService from '../../services/writingService'

interface Topic {
  id: string
  title: string
  theme?: string
  difficulty: 'easy' | 'medium' | 'hard'
}

interface TopicSelectorProps {
  ageGroup: string
  writingType: string
  selectedTopicId: string | null
  onTopicSelect: (topicId: string) => void
}

const difficultyColors: Record<string, string> = {
  easy: 'bg-success-100 text-success-700 border-success-300',
  medium: 'bg-warning-100 text-warning-700 border-warning-300',
  hard: 'bg-danger-100 text-danger-700 border-danger-300',
}

export const TopicSelector = ({
  ageGroup,
  writingType,
  selectedTopicId,
  onTopicSelect,
}: TopicSelectorProps) => {
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadTopics = async () => {
      try {
        setLoading(true)
        const fetchedTopics = await writingService.getTopics(ageGroup, writingType)
        setTopics(fetchedTopics)
        setError('')
      } catch (err: any) {
        setError(err.message || 'Failed to load topics')
        setTopics([])
      } finally {
        setLoading(false)
      }
    }

    loadTopics()
  }, [ageGroup, writingType])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader className="w-6 h-6 animate-spin text-primary-600 mr-2" />
        <span className="text-slate-600">Loading topics...</span>
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

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Choose a Topic</h2>
      <p className="text-slate-600 mb-6">
        Select a topic for your {writingType} writing. Each topic will give you a unique prompt tailored to your age group.
      </p>

      <div className="space-y-3">
        {topics.map((topic) => (
          <button
            key={topic.id}
            onClick={() => onTopicSelect(topic.id)}
            className={`w-full p-4 rounded-lg border-2 transition-all text-left flex items-center justify-between group ${
              selectedTopicId === topic.id
                ? 'border-primary-600 bg-primary-50 shadow-lg'
                : 'border-slate-200 bg-white hover:border-primary-400 hover:shadow-md'
            }`}
          >
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900 group-hover:text-primary-600 transition-colors">
                {topic.title}
              </h3>
              {topic.theme && (
                <p className="text-sm text-slate-500 mt-1">
                  Theme: <span className="font-medium text-slate-600">{topic.theme}</span>
                </p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold border ${
                    difficultyColors[topic.difficulty]
                  }`}
                >
                  {topic.difficulty.charAt(0).toUpperCase() + topic.difficulty.slice(1)}
                </span>
              </div>
            </div>

            <div className="ml-4 flex-shrink-0">
              {selectedTopicId === topic.id ? (
                <div className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center">
                  <span className="text-white text-sm font-bold">✓</span>
                </div>
              ) : (
                <ChevronRight className="w-6 h-6 text-slate-400 group-hover:text-primary-400" />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
