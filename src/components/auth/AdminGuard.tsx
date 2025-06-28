
import { useAuth } from '@/hooks/useAuth'
import { Navigate } from 'react-router-dom'
import { AuthLoading } from '@/components/ui/LoadingSpinner'
import { AccessDenied } from '@/components/ui/AccessDenied'
import { AUTH_MESSAGES } from '@/constants/auth'

interface AdminGuardProps {
  children: React.ReactNode
  redirectTo?: string
}

export function AdminGuard({ children, redirectTo = '/login' }: AdminGuardProps) {
  const { user, loading, isAdmin } = useAuth()

  if (loading) {
    return <AuthLoading />
  }

  if (!user) {
    return <Navigate to={redirectTo} replace />
  }

  if (!isAdmin) {
    return (
      <AccessDenied 
        title={AUTH_MESSAGES.ACCESS_RESTRICTED}
        message={AUTH_MESSAGES.ADMIN_ONLY}
      />
    )
  }

  return <>{children}</>
}
