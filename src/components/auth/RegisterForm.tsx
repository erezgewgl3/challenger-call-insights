
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase, authHelpers } from '@/lib/supabase'
import { toast } from 'sonner'
import { RegisterHeader } from './RegisterHeader'
import { InviteValidationForm } from './InviteValidationForm'
import { PasswordCreationForm } from './PasswordCreationForm'
import { RegisterFooter } from './RegisterFooter'

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
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      })

      if (error) {
        setError(error.message)
        toast.error('Registration failed: ' + error.message)
        return
      }

      if (data.user) {
        if (validatedInvite) {
          const { success, error: markError } = await authHelpers.markInviteAsUsed(validatedInvite.id)
          
          if (!success) {
            toast.error('Warning: Invite token could not be marked as used. Please contact support.')
          }
        }

        toast.success('Registration successful! You can now log in.')
        navigate('/login')
      }
    } catch (error) {
      setError('An unexpected error occurred')
      toast.error('Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <RegisterHeader />

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
              <InviteValidationForm
                inviteToken={inviteToken}
                email={email}
                error={error}
                loading={loading}
                onTokenChange={setInviteToken}
                onEmailChange={setEmail}
                onSubmit={handleValidateToken}
              />
            ) : (
              <PasswordCreationForm
                email={email}
                password={password}
                confirmPassword={confirmPassword}
                error={error}
                loading={loading}
                onPasswordChange={setPassword}
                onConfirmPasswordChange={setConfirmPassword}
                onSubmit={handleRegister}
                onBack={() => setStep('token')}
              />
            )}

            <RegisterFooter />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
