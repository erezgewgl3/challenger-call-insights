
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
        navigate('/dashboard')
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
    if (!email) {
      toast.error('Please enter your email address first')
      return
    }

    setResetLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`
      })

      if (error) {
        toast.error('Failed to send reset email: ' + error.message)
      } else {
        toast.success('Password reset email sent! Check your inbox.')
      }
    } catch (error) {
      toast.error('Failed to send reset email')
    } finally {
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
