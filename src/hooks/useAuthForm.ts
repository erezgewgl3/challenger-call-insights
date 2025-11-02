
import { useState } from 'react'

interface UseAuthFormProps {
  initialEmail?: string
  initialPassword?: string
  initialToken?: string
}

export function useAuthForm({ 
  initialEmail = '', 
  initialPassword = '', 
  initialToken = '' 
}: UseAuthFormProps = {}) {
  const [email, setEmail] = useState(initialEmail)
  const [password, setPassword] = useState(initialPassword)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [inviteToken, setInviteToken] = useState(initialToken)
  const [loading, setLoading] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [error, setError] = useState('')

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setInviteToken('')
    setError('')
    setLoading(false)
    setResetLoading(false)
  }

  const validateRequired = (fields: { [key: string]: string }, fieldNames: string[]) => {
    const missing = fieldNames.filter(field => !fields[field])
    if (missing.length > 0) {
      setError(`Please enter ${missing.join(' and ')}`)
      return false
    }
    return true
  }

  const validatePasswordMatch = () => {
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return false
    }
    return true
  }

  const validatePasswordLength = (minLength = 12) => {
    if (password.length < minLength) {
      setError(`Password must be at least ${minLength} characters long`)
      return false
    }
    return true
  }

  return {
    // State
    email,
    password,
    confirmPassword,
    inviteToken,
    loading,
    resetLoading,
    error,
    
    // Setters
    setEmail,
    setPassword,
    setConfirmPassword,
    setInviteToken,
    setLoading,
    setResetLoading,
    setError,
    
    // Utilities
    resetForm,
    validateRequired,
    validatePasswordMatch,
    validatePasswordLength
  }
}
