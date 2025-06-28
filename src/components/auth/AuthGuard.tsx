
import { useAuth } from '@/hooks/useAuth'
import { Navigate } from 'react-router-dom'
import { AuthLoading } from '@/components/ui/LoadingSpinner'
import { AUTH_MESSAGES } from '@/constants/auth'

interface AuthGuardProps {
  children: React.ReactNode
  redirectTo?: string
}

export function AuthGuard({ children, redirectTo = '/login' }: AuthGuardProps) {
  const { user, loading } = useAuth()

  if (loading) {
    return <AuthLoading message={AUTH_MESSAGES.LOADING_DASHBOARD} />
  }

  if (!user) {
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}
