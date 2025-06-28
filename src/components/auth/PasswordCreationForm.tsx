
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, CheckCircle } from 'lucide-react'
import { PasswordField } from './AuthFormFields'
import { AuthButton } from './AuthButton'

interface PasswordCreationFormProps {
  email: string
  password: string
  confirmPassword: string
  error: string
  loading: boolean
  onPasswordChange: (value: string) => void
  onConfirmPasswordChange: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
  onBack: () => void
}

export function PasswordCreationForm({
  email,
  password,
  confirmPassword,
  error,
  loading,
  onPasswordChange,
  onConfirmPasswordChange,
  onSubmit,
  onBack
}: PasswordCreationFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
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

      <PasswordField 
        label="Password"
        value={password} 
        onChange={onPasswordChange}
        placeholder="Create a password"
      />
      <p className="text-sm text-slate-500">
        Password must be at least 6 characters long
      </p>

      <PasswordField 
        id="confirmPassword"
        label="Confirm Password"
        value={confirmPassword} 
        onChange={onConfirmPasswordChange}
        placeholder="Confirm your password"
      />

      <AuthButton loading={loading} loadingText="Creating Account...">
        Create Account
      </AuthButton>

      <AuthButton 
        type="button"
        variant="outline"
        loading={false}
        loadingText=""
        onClick={onBack}
      >
        ← Back to Token Validation
      </AuthButton>
    </form>
  )
}
