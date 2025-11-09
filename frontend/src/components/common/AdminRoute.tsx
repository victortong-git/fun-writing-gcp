import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks'

interface AdminRouteProps {
  component: React.ComponentType<any>
}

export const AdminRoute = ({ component: Component }: AdminRouteProps) => {
  const { isAdminAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!isAdminAuthenticated) {
    return <Navigate to="/platform-admin/login" replace />
  }

  return <Component />
}
