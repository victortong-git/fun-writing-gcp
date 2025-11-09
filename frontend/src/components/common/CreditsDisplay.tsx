import { Zap, TrendingUp, AlertCircle, Heart } from 'lucide-react'

interface CreditsDisplayProps {
  credits: number
  totalScore?: number
  level?: number
  trialEndDate?: string
  isTrialActive?: boolean
}

export const CreditsDisplay = ({
  credits,
  totalScore = 0,
  level = 1,
  trialEndDate,
  isTrialActive,
}: CreditsDisplayProps) => {
  const isLowOnCredits = credits < 300

  const getCreditStatus = (): { message: string; color: string } => {
    if (credits >= 2000) return { message: '✨ Plenty of credits', color: 'text-green-100' }
    if (credits >= 1000) return { message: '📊 Good supply', color: 'text-white' }
    if (credits >= 300) return { message: '⚠️ Running low', color: 'text-yellow-100' }
    return { message: '🚨 Critical level', color: 'text-red-200' }
  }

  const status = getCreditStatus()

  const daysUntilTrialEnd = trialEndDate
    ? Math.ceil((new Date(trialEndDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div className="space-y-4">
      {/* Main Credits Card */}
      <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <p className="text-white text-opacity-80 text-sm font-medium">AI Credits</p>
              <p className="text-3xl font-bold text-white">{credits.toLocaleString()}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-white text-opacity-80 text-xs">Status</p>
            <p className={`text-lg font-semibold ${status.color}`}>{status.message}</p>
          </div>
        </div>

        {/* Credit Costs Info */}
        <div className="text-sm text-white text-opacity-90 border-t border-white border-opacity-20 pt-3">
          <p className="font-medium">💡 Use credits for: Images (100) • Videos (500)</p>
        </div>
      </div>

      {/* Trial Status (if applicable) */}
      {isTrialActive && trialEndDate && (
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
          <div className="flex items-start space-x-3">
            <Heart className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-900">Free Trial Active</p>
              <p className="text-sm text-blue-800">
                {daysUntilTrialEnd && daysUntilTrialEnd > 0
                  ? `${daysUntilTrialEnd} day${daysUntilTrialEnd !== 1 ? 's' : ''} remaining`
                  : 'Trial ending soon!'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Low Credits Warning */}
      {isLowOnCredits && !isTrialActive && (
        <div className="bg-warning-50 rounded-lg border border-warning-200 p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-warning-900">Running Low on Credits</p>
              <p className="text-sm text-warning-800">
                Complete more submissions to earn additional credits and keep using AI features!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-5 h-5 text-primary-600" />
            <p className="text-sm text-slate-600">Total Score</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">{totalScore.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-xl">⭐</span>
            <p className="text-sm text-slate-600">Level</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">{level}</p>
        </div>
      </div>

      {/* Credit Info */}
      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
        <h4 className="font-semibold text-slate-900 mb-3">How Credits Work</h4>
        <ul className="text-sm text-slate-700 space-y-2">
          <li className="flex space-x-2">
            <span className="text-success-600 font-bold">✓</span>
            <span>Submit writing to earn credits</span>
          </li>
          <li className="flex space-x-2">
            <span className="text-success-600 font-bold">✓</span>
            <span>AI feedback is FREE (no credits needed)</span>
          </li>
          <li className="flex space-x-2">
            <span className="text-primary-600 font-bold">•</span>
            <span>Generate images: 100 credits each</span>
          </li>
          <li className="flex space-x-2">
            <span className="text-primary-600 font-bold">•</span>
            <span>Generate videos: 500 credits each</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
