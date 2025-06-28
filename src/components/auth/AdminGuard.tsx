
import { useAuth } from '@/hooks/useAuth'
import { Navigate } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface AdminGuardProps {
  children: React.ReactNode
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { user, loading, isAdmin } = useAuth()

  console.log('AdminGuard:', { 
    userEmail: user?.email,
    role: user?.role,
    isAdmin, 
    loading 
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    console.log('AdminGuard: No user, redirecting to login')
    return <Navigate to="/login" replace />
  }

  if (!isAdmin) {
    console.log('AdminGuard: User is not admin, showing access restricted')
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Access Restricted</h2>
            <p className="text-slate-600 mb-4">
              This area is restricted to administrators only.
            </p>
            <button 
              onClick={() => window.history.back()}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Go Back
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  console.log('AdminGuard: Admin access granted')
  return <>{children}</>
}
