
import { AlertTriangle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AUTH_MESSAGES } from '@/constants/auth'

interface AccessDeniedProps {
  title?: string
  message?: string
  onGoBack?: () => void
}

export function AccessDenied({ 
  title = AUTH_MESSAGES.ACCESS_RESTRICTED,
  message = AUTH_MESSAGES.ADMIN_ONLY,
  onGoBack
}: AccessDeniedProps) {
  const handleGoBack = () => {
    if (onGoBack) {
      onGoBack()
    } else {
      window.history.back()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">{title}</h2>
          <p className="text-slate-600 mb-4">{message}</p>
          <Button 
            variant="outline"
            onClick={handleGoBack}
            className="text-blue-600 hover:text-blue-700"
          >
            {AUTH_MESSAGES.GO_BACK}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
