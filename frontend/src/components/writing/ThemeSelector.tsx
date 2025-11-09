import { useEffect } from 'react'
import { Loader, AlertCircle } from 'lucide-react'
import { useWriting } from '../../hooks'

interface ThemeSelectorProps {
  selectedTheme: string | null
  onThemeSelect: (theme: string) => void
}

const THEME_ICONS: Record<string, string> = {
  adventure: '⚔️',
  mystery: '🔍',
  fantasy: '🏰',
  science_fiction: '🚀',
  romance: '💕',
  horror: '👻',
  comedy: '😂',
  drama: '🎭',
  historical: '📜',
  contemporary: '🌆',
  animal_tales: '🦁',
  nature: '🌿',
  sports: '⚽',
  school_life: '🏫',
  friendship: '👫',
  family: '👨‍👩‍👧‍👦',
  superheroes: '🦸',
  travel: '✈️',
  time_travel: '⏰',
  cultural: '🌍',
}

export const ThemeSelector = ({ selectedTheme, onThemeSelect }: ThemeSelectorProps) => {
  const { themes, loading, error } = useWriting()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader className="w-6 h-6 animate-spin text-primary-600 mr-2" />
        <span className="text-slate-600">Loading themes...</span>
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
      <h2 className="text-2xl font-bold text-slate-900 mb-4">Choose a Theme</h2>
      <p className="text-slate-600 mb-6">
        Select a writing theme that interests you. Each theme will give you a unique prompt tailored to your age group.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {themes.map((theme) => (
          <button
            key={theme}
            onClick={() => onThemeSelect(theme)}
            className={`p-6 rounded-xl border-2 transition-all text-left ${
              selectedTheme === theme
                ? 'border-primary-600 bg-primary-50 shadow-lg'
                : 'border-slate-200 bg-white hover:border-primary-400 hover:shadow-md'
            }`}
          >
            <div className="text-4xl mb-3">{THEME_ICONS[theme] || '📖'}</div>
            <h3 className="font-semibold text-slate-900 capitalize">{theme.replace(/_/g, ' ')}</h3>
            <p className="text-xs text-slate-600 mt-1">
              {selectedTheme === theme && '✓ Selected'}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}
