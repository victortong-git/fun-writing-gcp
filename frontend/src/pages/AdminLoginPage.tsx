import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import './AdminLoginPage.css'

const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate()
  const { adminLogin, isAdminAuthenticated, error: authError, loading: authLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    // Redirect if already logged in as admin
    if (isAdminAuthenticated) {
      navigate('/platform-admin/dashboard')
    }
  }, [isAdminAuthenticated, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      await adminLogin(email, password)
      // On success, Redux state is updated and useEffect will redirect
    } catch (err: any) {
      setError(authError || err.message || 'Login failed. Please check your credentials.')
    }
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-container">
        <div className="admin-login-header">
          <h1>Platform Admin</h1>
          <p>Login to access the admin dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="admin-login-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
              disabled={authLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={authLoading}
            />
          </div>

          <button
            type="submit"
            className="admin-login-btn"
            disabled={authLoading}
          >
            {authLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="admin-login-footer">
          <p>Admin access only. Unauthorized access is prohibited.</p>
        </div>
      </div>
    </div>
  )
}

export default AdminLoginPage
