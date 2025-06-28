
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase, authHelpers } from '@/lib/supabase'
import { toast } from 'sonner'

import { AuthContainer } from './AuthContainer'
import { RegisterHeader } from './RegisterHeader'
import { InviteValidationForm } from './InviteValidationForm'
import { PasswordCreationForm } from './PasswordCreationForm'
import { RegisterFooter } from './RegisterFooter'
import { useAuthForm } from '@/hooks/useAuthForm'

export function RegisterForm() {
  const [searchParams] = useSearchParams()
  const [step, setStep] = useState<'token' | 'register'>('token')
  const [validatedInvite, setValidatedInvite] = useState<any>(null)
  const navigate = useNavigate()

  const {
    email,
    password,
    confirmPassword,
    inviteToken,
    loading,
    error,
    setEmail,
    setPassword,
    setConfirmPassword,
    setInviteToken,
    setLoading,
    setError,
    validateRequired,
    validatePasswordMatch,
    validatePasswordLength
  } = useAuthForm({
    initialToken: searchParams.get('token') || ''
  })

  const handleValidateToken = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!validateRequired({ inviteToken, email }, ['inviteToken', 'email'])) {
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

    if (!validateRequired({ password, confirmPassword }, ['password', 'confirmPassword']) ||
        !validatePasswordMatch() ||
        !validatePasswordLength()) {
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
    <AuthContainer
      title={step === 'token' ? 'Validate Invite' : 'Create Account'}
      description={step === 'token' 
        ? 'Enter your invite token and email to continue'
        : 'Set up your password to complete registration'
      }
      header={<RegisterHeader />}
    >
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
    </AuthContainer>
  )
}
