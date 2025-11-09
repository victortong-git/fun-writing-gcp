import { useEffect, useState } from 'react'
import { Loader, AlertCircle } from 'lucide-react'
import * as writingService from '../../services/writingService'

interface WritingType {
  name: string
  count: number
}

interface WritingTypeSelectorProps {
  selectedType: string | null
  onTypeSelect: (type: string) => void
}

const TYPE_ICONS: Record<string, string> = {
  creative: '📖',
  persuasive: '🎯',
  descriptive: '🎨',
  narrative: '📝',
  informative: 'ℹ️',
  poems: '✨',
}

const TYPE_COLORS: Record<string, string> = {
  creative: 'primary',
  persuasive: 'warning',
  descriptive: 'info',
  narrative: 'success',
  informative: 'secondary',
  poems: 'purple',
}

const TYPE_DESCRIPTIONS: Record<string, string> = {
  creative: 'Tell imaginative stories with themes like fairy tales, adventures, and fantasies',
  persuasive: 'Make compelling arguments and convince your readers',
  descriptive: 'Paint vivid pictures using sensory details and rich language',
  narrative: 'Share personal experiences and autobiographical stories',
  informative: 'Explain concepts, processes, and interesting facts',
  poems: 'Express yourself through poetry in various forms',
}

export const WritingTypeSelector = ({
  selectedType,
  onTypeSelect,
}: WritingTypeSelectorProps) => {
  const [types, setTypes] = useState<WritingType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadTypes = async () => {
      try {
        setLoading(true)
        const fetchedTypes = await writingService.getTypes()
        setTypes(fetchedTypes)
        setError('')
      } catch (err: any) {
        setError(err.message || 'Failed to load writing types')
        setTypes([])
      } finally {
        setLoading(false)
      }
    }

    loadTypes()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader className="w-6 h-6 animate-spin text-primary-600 mr-2" />
        <span className="text-slate-600">Loading writing types...</span>
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
      <h2 className="text-2xl font-bold text-slate-900 mb-4">Choose a Writing Type</h2>
      <p className="text-slate-600 mb-6">
        Select a writing type that interests you. Each type offers unique prompts tailored to your age group and skill level.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {types.map((type) => (
          <button
            key={type.name}
            onClick={() => onTypeSelect(type.name)}
            className={`p-6 rounded-xl border-2 transition-all text-left ${
              selectedType === type.name
                ? 'border-primary-600 bg-primary-50 shadow-lg'
                : 'border-slate-200 bg-white hover:border-primary-400 hover:shadow-md'
            }`}
          >
            <div className="text-4xl mb-3">{TYPE_ICONS[type.name] || '📚'}</div>
            <h3 className="font-semibold text-slate-900 capitalize text-lg">
              {type.name}
            </h3>
            <p className="text-xs text-slate-500 mt-2 font-medium">
              {type.count} prompt{type.count !== 1 ? 's' : ''}
            </p>
            <p className="text-xs text-slate-600 mt-3 leading-relaxed">
              {TYPE_DESCRIPTIONS[type.name]}
            </p>
            {selectedType === type.name && (
              <div className="mt-3 pt-3 border-t border-primary-200">
                <p className="text-xs font-semibold text-primary-700">✓ Selected</p>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
