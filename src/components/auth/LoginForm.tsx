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
    <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex overflow-hidden">
      {/* Left Side - Value Proposition */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 flex-col justify-center px-6 xl:px-8 bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10">
          <div className="mb-4">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-sm font-medium mb-3">
              🏆 Invite-Only Platform
            </div>
            <h1 className="text-2xl xl:text-3xl font-bold mb-2 leading-tight">
              Transform Every Call Into 
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent"> Closed Deals</span>
            </h1>
            <p className="text-base text-blue-100 mb-3 leading-relaxed">
              AI-powered sales coaching for high-performing teams
            </p>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-5 h-5 bg-green-500/20 rounded-lg flex items-center justify-center mt-0.5">
                <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Get AI coaching after every sales conversation</h3>
                <p className="text-xs text-blue-200">Instant feedback using proven sales methodologies</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-5 h-5 bg-green-500/20 rounded-lg flex items-center justify-center mt-0.5">
                <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Transform insights into winning follow-up strategies</h3>
                <p className="text-xs text-blue-200">AI-generated next steps that actually close deals</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-blue-200">
            <div className="flex items-center space-x-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 616 0z" clipRule="evenodd" />
              </svg>
              <span>Enterprise Security</span>
            </div>
            <div className="flex items-center space-x-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Challenger Sales Methodology</span>
            </div>
            <div className="flex items-center space-x-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Powered by OpenAI & Claude</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-4">
        <AuthContainer
          title="Access Your Sales Intelligence"
          description="Welcome to your command center for closing more deals"
          header={<LoginHeader />}
        >
          <form onSubmit={handleLogin} className="space-y-3">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <EmailField value={email} onChange={setEmail} />
            <PasswordField label="Password" value={password} onChange={setPassword} />

            <AuthButton loading={loading} loadingText="Accessing Platform..." className="w-full h-11 text-base font-semibold hover:shadow-xl hover:shadow-blue-500/25 hover:bg-blue-700 transform hover:scale-[1.02] transition-all duration-200 ease-out">
              Access My Sales Intelligence
            </AuthButton>

            <div className="text-center pt-2">
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

          <div className="mt-4 text-center">
            <p className="text-xs text-slate-500 mb-2">
              Want access to Sales Whisperer?{" "}
              <a href="mailto:support@saleswhisperer.com" className="text-blue-600 hover:underline">
                Email support@saleswhisperer.com
              </a>{" "}
              to request exclusive access
            </p>
            <p className="text-xs text-slate-400">
              This platform is invite-only for serious sales professionals
            </p>
          </div>

          <div className="text-center mt-3">
            <a href="/" className="text-xs text-slate-500 hover:text-slate-700 transition-colors">
              ← Back to Home
            </a>
          </div>
        </AuthContainer>
      </div>
    </div>
  )
}