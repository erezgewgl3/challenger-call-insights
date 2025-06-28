
import { SystemSettingsPanel } from './SystemSettingsPanel'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Info } from 'lucide-react'

export function PromptSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">System Configuration</h2>
        <p className="text-slate-600">
          Configure global AI provider and default prompt settings
        </p>
      </div>

      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-blue-900">
            <Info className="h-5 w-5" />
            <span>How System Settings Work</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800 text-sm space-y-2">
          <p>• <strong>AI Provider:</strong> Choose between OpenAI GPT-4 or Anthropic Claude for all analyses</p>
          <p>• <strong>Default Prompt:</strong> Select which prompt content to use when analyzing conversations</p>
          <p>• <strong>Global Configuration:</strong> These settings apply to all users and all analyses</p>
          <p>• <strong>Separation of Concerns:</strong> Prompt content and AI provider are managed independently</p>
        </CardContent>
      </Card>

      <SystemSettingsPanel />
    </div>
  )
}
