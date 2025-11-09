import { Trophy, Zap, TrendingUp, Star, Lock } from 'lucide-react'

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  creditsReward: number
  unlockedAt?: string
}

interface AchievementsDisplayProps {
  achievements: Achievement[]
  loading?: boolean
}

const rarityColors: Record<string, { bg: string; text: string; border: string }> = {
  common: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
  rare: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  epic: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
  legendary: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' },
}

const rarityIcons: Record<string, string> = {
  common: '🏅',
  rare: '⭐',
  epic: '✨',
  legendary: '👑',
}

export const AchievementsDisplay = ({ achievements = [], loading = false }: AchievementsDisplayProps) => {
  const unlockedCount = achievements.filter((a) => a.unlockedAt).length
  const totalCount = achievements.length
  const unlockedPercentage = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0

  // Separate locked and unlocked achievements
  const unlockedAchievements = achievements.filter((a) => a.unlockedAt)
  const lockedAchievements = achievements.filter((a) => !a.unlockedAt)

  const sortByRarity = (a: Achievement, b: Achievement) => {
    const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 }
    return rarityOrder[a.rarity] - rarityOrder[b.rarity]
  }

  return (
    <div className="space-y-6">
      {/* Progress Section */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-700 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Trophy className="w-8 h-8" />
            <div>
              <p className="text-primary-100 text-sm">Achievements</p>
              <p className="text-2xl font-bold">
                {unlockedCount}/{totalCount}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold">{unlockedPercentage}%</p>
            <p className="text-primary-100 text-xs">Complete</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-white bg-opacity-20 rounded-full h-3 overflow-hidden">
          <div
            className="bg-white h-full transition-all duration-500"
            style={{ width: `${unlockedPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Unlocked Achievements */}
      {unlockedAchievements.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center space-x-2">
            <Star className="w-5 h-5 text-yellow-600" />
            <span>Unlocked ({unlockedCount})</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {unlockedAchievements.sort(sortByRarity).map((achievement) => {
              const colors = rarityColors[achievement.rarity]
              return (
                <div
                  key={achievement.id}
                  className={`${colors.bg} border-2 ${colors.border} rounded-lg p-4 relative overflow-hidden`}
                >
                  {/* Rarity indicator */}
                  <div className="absolute top-2 right-2 text-lg">{rarityIcons[achievement.rarity]}</div>

                  {/* Icon and Title */}
                  <div className="flex items-start space-x-3 mb-3">
                    <span className="text-3xl">{achievement.icon}</span>
                    <div>
                      <h4 className={`font-bold ${colors.text}`}>{achievement.name}</h4>
                      <p className={`text-xs ${colors.text} opacity-75`}>
                        {achievement.rarity.charAt(0).toUpperCase() + achievement.rarity.slice(1)}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className={`text-sm ${colors.text} mb-3`}>{achievement.description}</p>

                  {/* Reward and Date */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-1">
                      <Zap className="w-4 h-4" />
                      <span className={`font-semibold ${colors.text}`}>+{achievement.creditsReward}</span>
                    </div>
                    <span className={`${colors.text} opacity-75`}>
                      {achievement.unlockedAt && new Date(achievement.unlockedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Locked Achievements */}
      {lockedAchievements.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center space-x-2">
            <Lock className="w-5 h-5 text-slate-400" />
            <span>Locked ({lockedAchievements.length})</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {lockedAchievements.sort(sortByRarity).map((achievement) => {
              const colors = rarityColors[achievement.rarity]
              return (
                <div
                  key={achievement.id}
                  className="bg-slate-100 border-2 border-slate-300 rounded-lg p-4 opacity-60 relative"
                >
                  {/* Locked overlay */}
                  <div className="absolute top-2 right-2 text-lg">🔒</div>

                  {/* Icon and Title */}
                  <div className="flex items-start space-x-3 mb-3">
                    <span className="text-3xl opacity-50">{achievement.icon}</span>
                    <div>
                      <h4 className="font-bold text-slate-600">{achievement.name}</h4>
                      <p className="text-xs text-slate-500">
                        {achievement.rarity.charAt(0).toUpperCase() + achievement.rarity.slice(1)}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-slate-600 mb-3">{achievement.description}</p>

                  {/* Reward and Status */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-1">
                      <Zap className="w-4 h-4" />
                      <span className="font-semibold text-slate-600">+{achievement.creditsReward}</span>
                    </div>
                    <span className="text-slate-500">Locked</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {achievements.length === 0 && (
        <div className="text-center py-12">
          <Trophy className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600">No achievements yet</p>
          <p className="text-sm text-slate-500 mt-1">Complete submissions to unlock achievements!</p>
        </div>
      )}

      {/* Tips */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <h4 className="font-semibold text-blue-900 mb-2">💡 Achievement Tips</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Unlock achievements by completing writing milestones</li>
          <li>• Rare and Epic achievements give bonus credits</li>
          <li>• Legendary achievements are special rewards for dedicated writers</li>
          <li>• Check back regularly for new achievements to unlock</li>
        </ul>
      </div>
    </div>
  )
}
