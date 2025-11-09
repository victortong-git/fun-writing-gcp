import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks'

interface ProtectedRouteProps {
  component: React.ComponentType<any>
}

export const ProtectedRoute = ({ component: Component }: ProtectedRouteProps) => {
  const { isUserAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!isUserAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Component />
}
