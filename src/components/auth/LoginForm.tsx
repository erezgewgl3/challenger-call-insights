
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { LoginHeader } from './LoginHeader'
import { LoginFormFields } from './LoginFormFields'
import { LoginActions } from './LoginActions'
import { LoginFooter } from './LoginFooter'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!email || !password) {
      setError('Please enter both email and password')
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <LoginHeader />

        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access Sales Whisperer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <LoginFormFields
                email={email}
                password={password}
                onEmailChange={setEmail}
                onPasswordChange={setPassword}
              />

              <LoginActions
                loading={loading}
                resetLoading={resetLoading}
                onLogin={handleLogin}
                onPasswordReset={handlePasswordReset}
              />
            </form>

            <LoginFooter />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
