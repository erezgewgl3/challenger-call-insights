
import { Button } from '@/components/ui/button'

interface AuthButtonProps {
  type?: 'submit' | 'button'
  variant?: 'default' | 'outline'
  loading: boolean
  children: React.ReactNode
  loadingText: string
  onClick?: () => void
  disabled?: boolean
  className?: string
}

export function AuthButton({ 
  type = 'submit',
  variant = 'default',
  loading, 
  children, 
  loadingText, 
  onClick,
  disabled = false,
  className = "w-full"
}: AuthButtonProps) {
  const buttonClassName = variant === 'default' 
    ? `${className} bg-blue-600 hover:bg-blue-700`
    : className

  return (
    <Button 
      type={type}
      variant={variant}
      className={buttonClassName}
      disabled={loading || disabled}
      onClick={onClick}
    >
      {loading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          {loadingText}
        </>
      ) : (
        children
      )}
    </Button>
  )
}
