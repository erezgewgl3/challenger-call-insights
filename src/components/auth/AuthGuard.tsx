
import { useAuth } from '@/hooks/useAuth'
import { Navigate } from 'react-router-dom'
import { AuthLoading } from '@/components/ui/LoadingSpinner'
import { AUTH_MESSAGES } from '@/constants/auth'

interface AuthGuardProps {
  children: React.ReactNode
  redirectTo?: string
}

export function AuthGuard({ children, redirectTo = '/login' }: AuthGuardProps) {
  const { user, session, loading } = useAuth()

  // Wait if still loading or if session exists but user data hasn't loaded yet
  if (loading || (session && !user)) {
    return <AuthLoading message="Securing your session..." />
  }

  // Only redirect to login if we're done loading and there's no session
  if (!session) {
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}
