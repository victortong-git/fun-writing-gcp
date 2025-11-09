import { useEffect } from 'react'
import { useAuth, useWriting } from '../hooks'
import { SubmissionHistory } from '../components/writing/SubmissionHistory'
import { CreditsDisplay } from '../components/common/CreditsDisplay'

export const SubmissionsPage = () => {
  const { user } = useAuth()
  const { loadSubmissions } = useWriting()

  useEffect(() => {
    loadSubmissions(1, 10)
  }, [])

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Your Submissions</h1>
        <p className="text-slate-600">Review all your writing submissions and feedback</p>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <SubmissionHistory />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Credits Display */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <CreditsDisplay
              credits={user?.aiCredits || 0}
              totalScore={user?.totalScore || 0}
              level={user?.level || 1}
            />
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Writing Stats</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-600 mb-1">Email</p>
                <p className="font-semibold text-slate-900 break-all">{user?.email}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Age Group</p>
                <p className="font-semibold text-slate-900 capitalize">{user?.ageGroup?.replace(/_/g, ' ')}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Member Since</p>
                <p className="font-semibold text-slate-900">Now</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
