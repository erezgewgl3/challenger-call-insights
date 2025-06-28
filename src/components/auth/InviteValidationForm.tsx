
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { EmailField, TokenField } from './AuthFormFields'
import { AuthButton } from './AuthButton'

interface InviteValidationFormProps {
  inviteToken: string
  email: string
  error: string
  loading: boolean
  onTokenChange: (value: string) => void
  onEmailChange: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
}

export function InviteValidationForm({
  inviteToken,
  email,
  error,
  loading,
  onTokenChange,
  onEmailChange,
  onSubmit
}: InviteValidationFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <TokenField value={inviteToken} onChange={onTokenChange} />
      <EmailField value={email} onChange={onEmailChange} />

      <AuthButton loading={loading} loadingText="Validating...">
        Validate Invite
      </AuthButton>
    </form>
  )
}
