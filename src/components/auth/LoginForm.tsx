import { useNavigate } from 'react-router-dom'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

import { AuthContainer } from './AuthContainer'
import { EmailField, PasswordField } from './AuthFormFields'
import { AuthButton } from './AuthButton'
import { LoginHeader } from './LoginHeader'
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
      
      // Check rate limit before attempting login
      const { data: rateLimitCheck, error: rateLimitError } = await supabase
        .rpc('check_login_rate_limit', {
          p_identifier: email.trim(),
          p_ip_address: null
        }) as { data: { allowed: boolean; attempts: number; lockout_until?: string } | null; error: any };

      if (rateLimitError) {
        console.error('Rate limit check error:', rateLimitError);
      }

      if (rateLimitCheck && !rateLimitCheck.allowed) {
        const lockoutUntil = rateLimitCheck.lockout_until ? new Date(rateLimitCheck.lockout_until) : new Date(Date.now() + 900000);
        const minutesRemaining = Math.ceil((lockoutUntil.getTime() - Date.now()) / 60000);
        const errorMsg = `Too many failed login attempts. Please try again in ${minutesRemaining} minute${minutesRemaining > 1 ? 's' : ''}.`;
        setError(errorMsg);
        toast.error(errorMsg);
        setLoading(false);
        return;
      }
      
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
        // Record successful login
        try {
          await supabase.rpc('record_successful_login', {
            p_identifier: email.trim(),
            p_ip_address: null
          });
        } catch (err) {
          console.error('Failed to record successful login:', err);
        }

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
      
      // Check rate limit before sending password reset
      const { data: rateLimitCheck, error: rateLimitError } = await supabase
        .rpc('check_password_reset_rate_limit', {
          p_email: trimmedEmail,
          p_ip_address: null
        }) as { data: { allowed: boolean; attempts: number; lockout_until?: string } | null; error: any };

      if (rateLimitError) {
        console.error('Rate limit check error:', rateLimitError);
      }

      if (rateLimitCheck && !rateLimitCheck.allowed) {
        const lockoutUntil = rateLimitCheck.lockout_until ? new Date(rateLimitCheck.lockout_until) : new Date(Date.now() + 3600000);
        const minutesRemaining = Math.ceil((lockoutUntil.getTime() - Date.now()) / 60000);
        toast.error(`Too many password reset requests. Please try again in ${minutesRemaining} minute${minutesRemaining > 1 ? 's' : ''}.`);
        setResetLoading(false);
        return;
      }
      
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
    <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex overflow-hidden">
      {/* Left Side - Simplified Value Proposition */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 flex-col justify-center items-center px-12 xl:px-16 bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 text-center max-w-lg">
          <h1 className="text-4xl xl:text-5xl font-light mb-8 leading-tight text-white">
            Transform Every Call Into Closed Deals
          </h1>
          <p className="text-xl xl:text-2xl text-blue-100 font-light">
            AI-powered sales coaching
          </p>
        </div>
      </div>

      {/* Right Side - Minimal Form */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-2">
              Access Your Sales Intelligence
            </h2>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <EmailField value={email} onChange={setEmail} />
            <PasswordField label="Password" value={password} onChange={setPassword} />

            <AuthButton 
              loading={loading} 
              loadingText="Accessing Platform..." 
              className="w-full h-12 text-base font-medium hover:shadow-lg transition-all duration-200"
            >
              Access My Sales Intelligence
            </AuthButton>

            <div className="text-center pt-4">
              <button 
                type="button"
                onClick={handlePasswordReset}
                disabled={resetLoading}
                className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
              >
                {resetLoading ? "Sending..." : "Forgot password?"}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs text-slate-400 mb-2">
              Want exclusive access?{" "}
              <a href="mailto:support@saleswhisperer.com" className="text-blue-500 hover:text-blue-600 hover:underline">
                Email support@saleswhisperer.com
              </a>
            </p>
            <p className="text-xs text-slate-400">
              Have an invite?{" "}
              <a href="/register" className="text-blue-500 hover:text-blue-600 hover:underline">
                Register here
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}