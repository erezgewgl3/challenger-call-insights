
import { Button } from '@/components/ui/button'

interface LoginActionsProps {
  loading: boolean
  resetLoading: boolean
  onLogin: (e: React.FormEvent) => void
  onPasswordReset: () => void
}

export function LoginActions({ 
  loading, 
  resetLoading, 
  onLogin, 
  onPasswordReset 
}: LoginActionsProps) {
  return (
    <>
      <Button 
        type="submit" 
        className="w-full bg-blue-600 hover:bg-blue-700"
        disabled={loading}
        onClick={onLogin}
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Signing In...
          </>
        ) : (
          "Sign In"
        )}
      </Button>

      <Button 
        type="button"
        variant="outline"
        className="w-full"
        onClick={onPasswordReset}
        disabled={resetLoading}
      >
        {resetLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-600 mr-2"></div>
            Sending Reset Email...
          </>
        ) : (
          "Reset Password"
        )}
      </Button>
    </>
  )
}
