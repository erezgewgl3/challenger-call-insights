
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, Mail, Key } from 'lucide-react'

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
            onChange={(e) => onTokenChange(e.target.value)}
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
            onChange={(e) => onEmailChange(e.target.value)}
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
    </form>
  )
}
