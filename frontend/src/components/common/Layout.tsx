import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Menu, X, LogOut, BookOpen, Zap } from 'lucide-react'
import { useAuth } from '../../hooks'
import { Avatar } from './Avatar'

export const Layout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { isUserAuthenticated, isAdminAuthenticated, user, admin, logout, logoutAdmin } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const currentUser = isAdminAuthenticated ? admin : user
  const isAuthenticated = isUserAuthenticated || isAdminAuthenticated

  const handleLogout = () => {
    if (isAdminAuthenticated) {
      logoutAdmin()
    } else {
      logout()
    }
    navigate('/login')
    setIsMobileMenuOpen(false)
  }

  const isActive = (path: string) => location.pathname === path

  const navigationLinks = isAdminAuthenticated
    ? [
        { path: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
        { path: '/admin/users', label: 'Users', icon: '👥' },
        { path: '/admin/prompts', label: 'Prompts', icon: '📝' },
      ]
    : isUserAuthenticated
      ? [
          { path: '/dashboard', label: 'Dashboard', icon: '🏠' },
          { path: '/writing', label: 'Writing', icon: '✍️' },
          { path: '/submissions', label: 'Submissions', icon: '📚' },
          { path: '/gallery', label: 'Image Gallery', icon: '🖼️' },
          { path: '/video-gallery', label: 'Video Gallery', icon: '🎬' },
          { path: '/profile', label: 'Profile', icon: '👤' },
        ]
      : []

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white shadow-md border-b border-slate-200">
        <div className="max-w-[95vw] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div
              className="flex items-center space-x-2 cursor-pointer"
              onClick={() => navigate(isAuthenticated ? (isAdminAuthenticated ? '/admin/dashboard' : '/dashboard') : '/')}
            >
              <BookOpen className="w-8 h-8 text-primary-600" />
              <span className="text-xl font-bold text-slate-900">Fun Writing</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navigationLinks.map((link) => (
                <button
                  key={link.path}
                  onClick={() => navigate(link.path)}
                  className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                    isActive(link.path)
                      ? 'bg-primary-600 text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="mr-2">{link.icon}</span>
                  {link.label}
                </button>
              ))}
            </div>

            {/* Right side menu */}
            <div className="hidden md:flex items-center space-x-4">
              {isAuthenticated && currentUser && (
                <>
                  {isUserAuthenticated && user && (
                    <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 text-white">
                      <Zap className="w-4 h-4" />
                      <span className="text-sm font-bold">{user.aiCredits || 0}</span>
                    </div>
                  )}
                  <Avatar
                    name={currentUser.name || currentUser.email}
                    profilePictureUrl={(currentUser as any).profilePictureUrl}
                    size="md"
                  />
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 px-4 py-2 bg-danger-600 text-white rounded-lg hover:bg-danger-700 transition-colors font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </>
              )}
              {!isAuthenticated && (
                <>
                  <button
                    onClick={() => navigate('/login')}
                    className="px-4 py-2 text-primary-600 font-medium hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => navigate('/signup')}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium hidden"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden pb-4 space-y-2">
              {isUserAuthenticated && user && (
                <div className="flex items-center justify-center space-x-2 px-4 py-3 rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 text-white">
                  <Zap className="w-5 h-5" />
                  <span className="text-lg font-bold">{user.aiCredits || 0} Credits</span>
                </div>
              )}
              {navigationLinks.map((link) => (
                <button
                  key={link.path}
                  onClick={() => {
                    navigate(link.path)
                    setIsMobileMenuOpen(false)
                  }}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    isActive(link.path)
                      ? 'bg-primary-600 text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="mr-2">{link.icon}</span>
                  {link.label}
                </button>
              ))}

              {isAuthenticated && (
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-danger-600 hover:bg-danger-50 rounded-lg transition-colors font-medium"
                >
                  <LogOut className="w-4 h-4 inline mr-2" />
                  Logout
                </button>
              )}

              {!isAuthenticated && (
                <>
                  <button
                    onClick={() => {
                      navigate('/login')
                      setIsMobileMenuOpen(false)
                    }}
                    className="w-full text-left px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => {
                      navigate('/signup')
                      setIsMobileMenuOpen(false)
                    }}
                    className="w-full text-left px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium hidden"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-[95vw] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12">
        <div className="max-w-[95vw] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-slate-600">
            <p>&copy; {new Date().getFullYear()} C6 Fun Writing. All rights reserved.</p>
            <p className="text-sm mt-2">Transforming stories into visual art.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
