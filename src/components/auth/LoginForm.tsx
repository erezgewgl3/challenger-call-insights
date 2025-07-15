
import { useNavigate } from 'react-router-dom'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

import { AuthContainer } from './AuthContainer'
import { EmailField, PasswordField } from './AuthFormFields'
import { AuthButton } from './AuthButton'
import { LoginHeader } from './LoginHeader'
import { LoginFooter } from './LoginFooter'
import { useAuthForm } from '@/hooks/useAuthForm'
import { useAuth } from '@/hooks/useAuth'
import { authService } from '@/services/authService'
import { AUTH_ROLES } from '@/constants/auth'
import { resetPasswordForUser } from '@/utils/passwordResetUtils'

export function LoginForm() {
  const {
    email,
    password,
    loading,
    resetLoading,
    error,
    setEmail,
    setPassword,
    setLoading,
    setResetLoading,
    setError,
    validateRequired
  } = useAuthForm()
  
  const navigate = useNavigate()

  const getRedirectPath = (userRole: string) => {
    return userRole === AUTH_ROLES.ADMIN ? '/admin' : '/dashboard'
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!validateRequired({ email, password }, ['email', 'password'])) {
      setLoading(false)
      return
    }

    try {
      await supabase.auth.signOut()
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      })

      if (error) {
        if (error.message === 'Invalid login credentials') {
          setError('Invalid email or password. Try resetting your password if the issue persists.')
        } else {
          setError(error.message)
        }
        toast.error('Login failed: ' + error.message)
      } else if (data.user) {
        toast.success('Welcome back!')
        
        // Get user role and redirect appropriately
        try {
          const userRole = await authService.fetchUserRole(data.user.id)
          const redirectPath = getRedirectPath(userRole)
          navigate(redirectPath)
        } catch (roleError) {
          console.error('Failed to fetch user role:', roleError)
          // Fallback to dashboard on role fetch error
          navigate('/dashboard')
        }
      } else {
        setError('Login failed - no user data returned')
        toast.error('Login failed')
      }
    } catch (error) {
      setError('An unexpected error occurred')
      toast.error('Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordReset = async () => {
    // Input validation guardrail
    if (!email || !email.trim()) {
      toast.error('Please enter your email address first')
      return
    }

    const trimmedEmail = email.trim().toLowerCase()
    
    // Email format validation guardrail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmedEmail)) {
      toast.error('Please enter a valid email address')
      return
    }

    setResetLoading(true)
    
    try {
      console.log('Initiating password reset for:', trimmedEmail)
      
      // Use custom password reset function for consistent branding
      const result = await resetPasswordForUser(trimmedEmail)
      
      if (result.success) {
        toast.success('Password reset email sent! Check your inbox and spam folder.')
        console.log('Password reset email sent successfully')
      } else {
        // Error handling guardrail - map specific errors to user-friendly messages
        let errorMessage = 'Failed to send reset email'
        
        if (result.error?.includes('rate limit')) {
          errorMessage = 'Too many reset attempts. Please wait before trying again.'
        } else if (result.error?.includes('not found') || result.error?.includes('invalid')) {
          errorMessage = 'If this email is registered, you will receive a reset link shortly.'
        } else if (result.error?.includes('network') || result.error?.includes('connection')) {
          errorMessage = 'Network error. Please check your connection and try again.'
        }
        
        toast.error(errorMessage)
        console.error('Password reset failed:', result.error)
      }
    } catch (error: any) {
      // Comprehensive error handling guardrail
      console.error('Password reset error:', error)
      
      let errorMessage = 'Failed to send reset email'
      if (error?.message?.includes('network') || error?.name === 'NetworkError') {
        errorMessage = 'Network error. Please check your connection and try again.'
      } else if (error?.message?.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.'
      }
      
      toast.error(errorMessage)
    } finally {
      // State management guardrail
      setResetLoading(false)
    }
  }

  return (
    <AuthContainer
      title="Sign In"
      description="Enter your credentials to access Sales Whisperer"
      header={<LoginHeader />}
    >
      <form onSubmit={handleLogin} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <EmailField value={email} onChange={setEmail} />
        <PasswordField label="Password" value={password} onChange={setPassword} />

        <AuthButton loading={loading} loadingText="Signing In...">
          Sign In
        </AuthButton>

        <AuthButton 
          type="button"
          variant="outline"
          loading={resetLoading}
          loadingText="Sending Reset Email..."
          onClick={handlePasswordReset}
        >
          Reset Password
        </AuthButton>
      </form>

      <LoginFooter />
    </AuthContainer>
  )
}
