
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
      const { valid, invite, requiresPasswordReset, existingUser, error: validationError } = await authHelpers.validateInviteToken(inviteToken, email)

      if (!valid) {
        setError(validationError || 'Invalid invite token')
        toast.error(validationError || 'Invalid invite token')
      } else if (requiresPasswordReset && existingUser) {
        // Handle password reset for existing user with pending_deletion status
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email)

        if (resetError) {
          // Check for rate limiting error
          if (resetError.message.includes('For security purposes, you can only request this after')) {
            const match = resetError.message.match(/after (\d+) seconds/)
            const seconds = match ? match[1] : 'a few'
            setError(`Rate limited. Please wait ${seconds} seconds before requesting another password reset.`)
            toast.error(`Please wait ${seconds} seconds before trying again`)
          } else {
            setError('Failed to send password reset email: ' + resetError.message)
            toast.error('Failed to send password reset email')
          }
        } else {
          // Mark invite as used after successful password reset email
          const { success } = await authHelpers.markInviteAsUsed(invite.id)
          
          if (!success) {
            console.warn('Could not mark invite as used, but password reset was sent')
          }

          // Update user status back to active
          await supabase
            .from('users')
            .update({ status: 'active' })
            .eq('id', existingUser.id)

          toast.success('Password reset email sent! Check your email and follow the link to reset your password.')
          navigate('/login')
        }
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
      // Validate password strength before signup
      const { data: passwordValidation, error: validationError } = await supabase
        .rpc('validate_password_strength', { password }) as { 
          data: { 
            valid: boolean; 
            requirements: Record<string, { met: boolean; message: string }> 
          } | null; 
          error: any 
        };

      if (validationError) {
        console.error('Password validation error:', validationError);
        setError('Failed to validate password strength');
        toast.error('Failed to validate password strength');
        setLoading(false);
        return;
      }

      if (!passwordValidation?.valid) {
        const unmetRequirements = Object.entries(passwordValidation?.requirements || {})
          .filter(([_, req]) => !req.met)
          .map(([_, req]) => req.message);
        
        const errorMsg = `Password requirements not met:\n${unmetRequirements.join('\n')}`;
        setError(errorMsg);
        toast.error('Password does not meet security requirements');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password
      })

      if (error) {
        // Check if user already exists
        if (error.message.includes('User already registered')) {
          // Switch to password reset mode for existing users
          const { error: resetError } = await supabase.auth.resetPasswordForEmail(email)

          if (resetError) {
            setError('Failed to send password reset email: ' + resetError.message)
            toast.error('Failed to send password reset email')
            return
          }

          // Mark invite as used since we're treating this as a password reset
          if (validatedInvite) {
            const { success, error: markError } = await authHelpers.markInviteAsUsed(validatedInvite.id)
            
            if (!success) {
              toast.error('Warning: Invite token could not be marked as used. Please contact support.')
            }
          }

          toast.success('Password reset email sent! Check your email and follow the link to reset your password.')
          navigate('/login')
          return
        }

        setError(error.message)
        toast.error('Registration failed: ' + error.message)
        return
      }

      if (data.user) {
        // Validate that both auth and public user records were created
        const validationResult = await validateUserRegistration(data.user.id, email)
        
        if (!validationResult.isValid) {
          console.error('User registration validation failed:', validationResult.issue)
          toast.error('Registration partially failed. Please contact support if you cannot log in.')
        }

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
      console.error('Registration error:', error)
      setError('An unexpected error occurred')
      toast.error('Registration failed')
    } finally {
      setLoading(false)
    }
  }

  // Helper function to validate user registration
  const validateUserRegistration = async (userId: string, email: string) => {
    try {
      // Check if public user record exists
      const { data: publicUser, error } = await supabase
        .from('users')
        .select('id, email, role, status')
        .eq('id', userId)
        .single()

      if (error || !publicUser) {
        console.error('Public user record missing for:', userId, error)
        return {
          isValid: false,
          issue: 'Public user record not created'
        }
      }

      if (publicUser.email !== email) {
        console.error('Email mismatch in public user record:', publicUser.email, 'vs', email)
        return {
          isValid: false,
          issue: 'Email mismatch in public user record'
        }
      }

      return { isValid: true }
    } catch (error) {
      console.error('Error validating user registration:', error)
      return {
        isValid: false,
        issue: 'Validation check failed'
      }
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
