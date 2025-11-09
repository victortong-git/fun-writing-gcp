import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, BookOpen, Trophy, TrendingUp, ArrowRight } from 'lucide-react'
import { useAuth, useWriting } from '../hooks'

export const StudentDashboard = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { submissions, pagination, loadSubmissions } = useWriting()

  useEffect(() => {
    loadSubmissions(1, 5)
  }, [])

  const recentSubmissions = submissions.slice(0, 5)

  const stats = [
    {
      icon: <BookOpen className="w-6 h-6" />,
      label: 'Total Submissions',
      value: pagination.total,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      icon: <Zap className="w-6 h-6" />,
      label: 'AI Credits',
      value: user?.aiCredits || 0,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      icon: <Trophy className="w-6 h-6" />,
      label: 'Current Level',
      value: user?.level || 1,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      label: 'Total Score',
      value: user?.totalScore || 0,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-700 rounded-2xl shadow-lg p-8 text-white">
        <h1 className="text-4xl font-bold mb-2">Welcome back, {user?.name || 'Writer'}! 👋</h1>
        <p className="text-primary-100">
          You have {user?.aiCredits || 0} AI credits available for generating feedback and media.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className={`${stat.bgColor} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
              <div className={stat.color}>{stat.icon}</div>
            </div>
            <p className="text-slate-600 text-sm font-medium mb-1">{stat.label}</p>
            <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Action */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-md p-6 border-l-4 border-blue-600">
          <h3 className="text-lg font-bold text-slate-900 mb-2">Start Writing</h3>
          <p className="text-slate-600 mb-4">Choose a theme and get a personalized writing prompt</p>
          <button
            onClick={() => navigate('/writing')}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-md p-6 border-l-4 border-green-600">
          <h3 className="text-lg font-bold text-slate-900 mb-2">View Submissions</h3>
          <p className="text-slate-600 mb-4">Review your past submissions and feedback</p>
          <button
            onClick={() => navigate('/submissions')}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            <span>View History</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Recent Submissions */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Recent Submissions</h2>
        {recentSubmissions.length > 0 ? (
          <div className="space-y-3">
            {recentSubmissions.map((submission) => (
              <div
                key={submission.id}
                className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => navigate(`/submissions/${submission.id}`)}
              >
                <div>
                  <h3 className="font-medium text-slate-900">{submission.promptTitle}</h3>
                  <p className="text-sm text-slate-600">{submission.wordCount} words</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-900">
                    {submission.score ? `${submission.score}/100` : 'Pending review'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(submission.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-600">No submissions yet. Start writing to see your work here!</p>
            <button
              onClick={() => navigate('/writing')}
              className="mt-4 text-primary-600 font-medium hover:text-primary-700"
            >
              Create your first submission →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
