
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex">
      {/* Left Side - Value Proposition */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 flex-col justify-center px-12 xl:px-16 bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10">
          <div className="mb-8">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-sm font-medium mb-6">
              🏆 Invite-Only Platform
            </div>
            <h1 className="text-4xl xl:text-5xl font-bold mb-4 leading-tight">
              Transform Every Call Into 
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent"> Closed Deals</span>
            </h1>
            <p className="text-xl text-blue-100 mb-8 leading-relaxed">
              AI-powered Challenger Sales coaching trusted by elite B2B sales professionals
            </p>
          </div>

          <div className="space-y-6 mb-8">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">AI Challenger Sales Analysis</h3>
                <p className="text-blue-200">Every conversation analyzed using proven Challenger methodology</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Personalized Coaching</h3>
                <p className="text-blue-200">Get instant, actionable feedback after every sales call</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Winning Follow-up Strategies</h3>
                <p className="text-blue-200">Transform insights into compelling next steps that close deals</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center space-x-4 mb-3">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full border-2 border-white"></div>
                <div className="w-8 h-8 bg-indigo-500 rounded-full border-2 border-white"></div>
                <div className="w-8 h-8 bg-purple-500 rounded-full border-2 border-white"></div>
              </div>
              <div className="text-blue-100">
                <div className="font-semibold">Trusted by 500+ top performers</div>
                <div className="text-sm opacity-90">Average 23% increase in close rates</div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center space-x-6 text-sm text-blue-200">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <span>Enterprise Security</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Challenger Sales Certified</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-8">
        <AuthContainer
          title="Access Your Sales Intelligence"
          description="Welcome to your command center for closing more deals"
          header={<LoginHeader />}
        >
          <div className="mb-6 text-center">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-sm font-medium">
              🔒 Secure Professional Access
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <EmailField value={email} onChange={setEmail} />
            <PasswordField label="Password" value={password} onChange={setPassword} />

            <AuthButton loading={loading} loadingText="Accessing Platform..." className="w-full h-12 text-lg font-semibold hover:shadow-xl hover:shadow-blue-500/25 hover:bg-blue-700 transform hover:scale-[1.02] transition-all duration-200 ease-out">
              Access My Sales Intelligence
            </AuthButton>

            <AuthButton 
              type="button"
              variant="outline"
              loading={resetLoading}
              loadingText="Sending Secure Reset..."
              onClick={handlePasswordReset}
              className="w-full h-11"
            >
              Reset Password
            </AuthButton>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-600 mb-4">
              New to Sales Whisperer?{" "}
              <span className="font-medium text-slate-800">Contact your sales manager for exclusive access</span>
            </p>
            <p className="text-xs text-slate-500">
              This platform is invite-only for enterprise customers
            </p>
          </div>

          <div className="text-center mt-8">
            <a href="/" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
              ← Back to Home
            </a>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="flex items-center justify-center space-x-6 text-xs text-slate-500">
              <div className="flex items-center space-x-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <span>SOC2 Compliant</span>
              </div>
              <div className="flex items-center space-x-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Powered by OpenAI & Claude</span>
              </div>
            </div>
          </div>
        </AuthContainer>
      </div>
    </div>
  )
}
