import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from './store/store'
import { Layout } from './components/common/Layout'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'
import { StudentDashboard } from './pages/StudentDashboard'
import { WritingPage } from './pages/WritingPage'
import { SubmissionsPage } from './pages/SubmissionsPage'
import { SubmissionDetailPage } from './pages/SubmissionDetailPage'
import { AdminDashboard } from './pages/AdminDashboard'
import AdminLoginPage from './pages/AdminLoginPage'
import PlatformAdminDashboard from './pages/PlatformAdminDashboard'
import ProfilePage from './pages/ProfilePage'
import GalleryPage from './pages/GalleryPage'
import VideoGalleryPage from './pages/VideoGalleryPage'
import { ProtectedRoute } from './components/common/ProtectedRoute'
import { AdminRoute } from './components/common/AdminRoute'
import { Landing } from './pages/Landing'

export default function App() {
  return (
    <Provider store={store}>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Platform Admin Routes (No Layout) */}
          <Route path="/platform-admin" element={<Navigate to="/platform-admin/login" replace />} />
          <Route path="/platform-admin/login" element={<AdminLoginPage />} />
          <Route path="/platform-admin/dashboard" element={<AdminRoute component={PlatformAdminDashboard} />} />

          {/* Protected Routes with Layout */}
          <Route element={<Layout />}>
            {/* Student Routes */}
            <Route path="/dashboard" element={<ProtectedRoute component={StudentDashboard} />} />
            <Route path="/writing" element={<ProtectedRoute component={WritingPage} />} />
            <Route path="/submissions" element={<ProtectedRoute component={SubmissionsPage} />} />
            <Route path="/submissions/:id" element={<ProtectedRoute component={SubmissionDetailPage} />} />
            <Route path="/profile" element={<ProtectedRoute component={ProfilePage} />} />
            <Route path="/gallery" element={<ProtectedRoute component={GalleryPage} />} />
            <Route path="/video-gallery" element={<ProtectedRoute component={VideoGalleryPage} />} />

            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={<AdminRoute component={AdminDashboard} />} />

            {/* Catch all - redirect to dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </Router>
    </Provider>
  )
}
