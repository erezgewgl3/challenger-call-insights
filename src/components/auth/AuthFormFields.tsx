
import { Mail, Lock, Key } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface EmailFieldProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
}

export function EmailField({ value, onChange, placeholder = "Enter your email", required = true }: EmailFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="email">Email</Label>
      <div className="relative">
        <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
        <Input
          id="email"
          type="email"
          placeholder={placeholder}
          className="pl-10"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
        />
      </div>
    </div>
  )
}

interface PasswordFieldProps {
  id?: string
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
}

export function PasswordField({ 
  id = "password", 
  label, 
  value, 
  onChange, 
  placeholder = "Enter your password", 
  required = true 
}: PasswordFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
        <Input
          id={id}
          type="password"
          placeholder={placeholder}
          className="pl-10"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
        />
      </div>
    </div>
  )
}

interface TokenFieldProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
}

export function TokenField({ value, onChange, placeholder = "Enter your invite token", required = true }: TokenFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="token">Invite Token</Label>
      <div className="relative">
        <Key className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
        <Input
          id="token"
          type="text"
          placeholder={placeholder}
          className="pl-10"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
        />
      </div>
    </div>
  )
}
