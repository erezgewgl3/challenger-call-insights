
import { DefaultPromptSettings } from './DefaultPromptSettings'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Crown, Info } from 'lucide-react'

export function PromptSettings() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Prompt System Settings</h2>
        <p className="text-slate-600">
          Configure the global default prompt and AI provider settings
        </p>
      </div>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-blue-900">
            <Info className="h-5 w-5" />
            <span>How Default Prompts Work</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800 text-sm space-y-2">
          <p>• Only one prompt can be set as the global default at a time</p>
          <p>• The default prompt is used when analyzing sales conversations</p>
          <p>• You can choose which AI provider (OpenAI or Claude) to use with the default prompt</p>
          <p>• Setting a new default will automatically remove the default flag from the previous one</p>
        </CardContent>
      </Card>

      {/* Default Prompt Settings */}
      <DefaultPromptSettings />
    </div>
  )
}
