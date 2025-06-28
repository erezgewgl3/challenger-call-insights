
import { useAuth } from '@/hooks/useAuth'
import { Navigate, useLocation } from 'react-router-dom'
import { Brain } from 'lucide-react'

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading, isAdmin } = useAuth()
  const location = useLocation()

  console.log('AuthGuard:', { 
    path: location.pathname, 
    userEmail: user?.email,
    role: user?.role,
    isAdmin, 
    loading 
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center animate-pulse">
              <Brain className="h-7 w-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-slate-900">Sales Whisperer</span>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    console.log('AuthGuard: No user, redirecting to login')
    return <Navigate to="/login" replace />
  }

  // Auto-redirect admins to admin dashboard if they hit /dashboard
  if (isAdmin && location.pathname === '/dashboard') {
    console.log('AuthGuard: Admin user accessing /dashboard, redirecting to /admin')
    return <Navigate to="/admin" replace />
  }

  console.log('AuthGuard: Allowing access to', location.pathname)
  return <>{children}</>
}
