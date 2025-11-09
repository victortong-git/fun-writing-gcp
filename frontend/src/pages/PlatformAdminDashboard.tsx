import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAdminStats, getUsers, type AdminStats, type User } from '../services/adminService'
import { logoutAdmin, getStoredAdmin } from '../services/authService'
import UserManagement from '../components/UserManagement'
import './PlatformAdminDashboard.css'

const PlatformAdminDashboard: React.FC = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [recentUsers, setRecentUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'overview' | 'users'>('overview')
  const admin = getStoredAdmin()

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError('')

      // Fetch stats and recent users in parallel
      const [statsData, usersData] = await Promise.all([
        getAdminStats(),
        getUsers({ page: 1, limit: 5 }),
      ])

      setStats(statsData)
      setRecentUsers(usersData.data.users || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logoutAdmin()
    navigate('/platform-admin/login')
  }

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <header className="admin-header">
        <div className="admin-header-content">
          <div className="admin-title">
            <h1>Platform Admin</h1>
            <p>Welcome, {admin?.name || admin?.email}</p>
          </div>
          <div className="admin-actions">
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="admin-tabs">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          User Management
        </button>
      </div>

      {/* Content */}
      <div className="admin-content">
        {error && (
          <div className="error-banner">
            {error}
            <button onClick={loadDashboardData}>Retry</button>
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="overview-tab">
            {/* Stats Grid */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-info">
                  <h3>Total Users</h3>
                  <p className="stat-value">{stats?.totalUsers || 0}</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">✅</div>
                <div className="stat-info">
                  <h3>Active Users</h3>
                  <p className="stat-value">{stats?.activeUsers || 0}</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">🎯</div>
                <div className="stat-info">
                  <h3>Trial Users</h3>
                  <p className="stat-value">{stats?.trialUsers || 0}</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">📝</div>
                <div className="stat-info">
                  <h3>Total Submissions</h3>
                  <p className="stat-value">{stats?.totalSubmissions || 0}</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">💡</div>
                <div className="stat-info">
                  <h3>Writing Prompts</h3>
                  <p className="stat-value">{stats?.totalPrompts || 0}</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">📊</div>
                <div className="stat-info">
                  <h3>Avg Submissions/User</h3>
                  <p className="stat-value">{stats?.avgSubmissionsPerUser || 0}</p>
                </div>
              </div>
            </div>

            {/* Recent Users */}
            <div className="recent-users-section">
              <div className="section-header">
                <h2>Recent Users</h2>
                <button
                  onClick={() => setActiveTab('users')}
                  className="view-all-btn"
                >
                  View All
                </button>
              </div>

              <div className="recent-users-table">
                {recentUsers.length === 0 ? (
                  <p className="no-data">No users found</p>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>AI Credits</th>
                        <th>Status</th>
                        <th>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentUsers.map((user) => (
                        <tr key={user.id}>
                          <td>{user.name || 'N/A'}</td>
                          <td>{user.email}</td>
                          <td>{user.aiCredits}</td>
                          <td>
                            <span className={`status-badge ${user.subscriptionStatus}`}>
                              {user.subscriptionStatus}
                            </span>
                          </td>
                          <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <UserManagement onRefresh={loadDashboardData} />
        )}
      </div>
    </div>
  )
}

export default PlatformAdminDashboard
