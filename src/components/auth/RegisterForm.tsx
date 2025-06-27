
import { useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Brain, Mail, Lock, AlertCircle, CheckCircle, Key } from 'lucide-react'
import { supabase, authHelpers } from '@/lib/supabase'
import { toast } from 'sonner'

export function RegisterForm() {
  const [searchParams] = useSearchParams()
  const [inviteToken, setInviteToken] = useState(searchParams.get('token') || '')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'token' | 'register'>('token')
  const [validatedInvite, setValidatedInvite] = useState<any>(null)
  const navigate = useNavigate()

  const handleValidateToken = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!inviteToken || !email) {
      setError('Please enter both invite token and email')
      setLoading(false)
      return
    }

    try {
      const { valid, invite, error: validationError } = await authHelpers.validateInviteToken(inviteToken, email)

      if (!valid) {
        setError(validationError || 'Invalid invite token')
        toast.error('Invalid invite token')
      } else {
        setValidatedInvite(invite)
        setStep('register')
        toast.success('Invite token validated! Please create your password.')
      }
    } catch (error) {
      console.error('Token validation error:', error)
      setError('Failed to validate invite token')
      toast.error('Failed to validate invite token')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!password || !confirmPassword) {
      setError('Please enter and confirm your password')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      setLoading(false)
      return
    }

    try {
      // Register the user
      const redirectUrl = `${window.location.origin}/dashboard`
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl
        }
      })

      if (error) {
        console.error('Registration error:', error)
        setError(error.message)
        toast.error('Registration failed: ' + error.message)
      } else if (data.user) {
        // Mark invite as used
        if (validatedInvite) {
          const { success } = await authHelpers.markInviteAsUsed(validatedInvite.id)
          if (!success) {
            console.warn('Failed to mark invite as used, but registration succeeded')
          }
        }

        toast.success('Registration successful! Please check your email to verify your account.')
        navigate('/login')
      }
    } catch (error) {
      console.error('Registration error:', error)
      setError('An unexpected error occurred')
      toast.error('Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <Brain className="h-7 w-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-slate-900">Sales Whisperer</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Join Sales Whisperer</h1>
          <p className="text-slate-600">Create your account with an invite token</p>
        </div>

        {/* Registration Form */}
        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">
              {step === 'token' ? 'Validate Invite' : 'Create Account'}
            </CardTitle>
            <CardDescription>
              {step === 'token' 
                ? 'Enter your invite token and email to continue'
                : 'Set up your password to complete registration'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 'token' ? (
              <form onSubmit={handleValidateToken} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="token">Invite Token</Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="token"
                      type="text"
                      placeholder="Enter your invite token"
                      className="pl-10"
                      value={inviteToken}
                      onChange={(e) => setInviteToken(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Validating...
                    </>
                  ) : (
                    "Validate Invite"
                  )}
                </Button>

                <div className="text-center">
                  <p className="text-xs text-slate-500">
                    Use token: <code className="bg-slate-100 px-1 rounded">test-invite-2024</code> with email: <code className="bg-slate-100 px-1 rounded">test@saleswhisperer.com</code>
                  </p>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Invite validated for <strong>{email}</strong>
                  </AlertDescription>
                </Alert>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Create a password"
                      className="pl-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      className="pl-10"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating Account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>

                <Button 
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setStep('token')}
                >
                  ← Back to Token Validation
                </Button>
              </form>
            )}

            <div className="mt-6 text-center">
              <p className="text-sm text-slate-600">
                Already have an account?{" "}
                <Link to="/login" className="text-blue-600 hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <Link to="/" className="text-sm text-slate-600 hover:text-slate-900">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
