
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Settings, Database, Zap, Shield } from 'lucide-react'

export function PromptSettings() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* AI Provider Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-blue-600" />
              <span>AI Provider Settings</span>
            </CardTitle>
            <CardDescription>
              Configure AI providers and their default behaviors
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">OpenAI GPT-4</h4>
                <p className="text-sm text-slate-600">Primary analysis provider</p>
              </div>
              <Badge variant="default">Active</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Anthropic Claude</h4>
                <p className="text-sm text-slate-600">Secondary analysis provider</p>
              </div>
              <Badge variant="secondary">Active</Badge>
            </div>
            <div className="pt-4 border-t">
              <p className="text-xs text-slate-500">
                Future versions will allow configuring API keys, rate limits, and fallback behavior.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Security & Access */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-green-600" />
              <span>Security & Access</span>
            </CardTitle>
            <CardDescription>
              Row-level security and access controls
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Admin Access</span>
                <Badge variant="default">Full Access</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">User Prompts</span>
                <Badge variant="outline">Own Only</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Default Prompts</span>
                <Badge variant="secondary">Read Only</Badge>
              </div>
            </div>
            <div className="pt-4 border-t">
              <p className="text-xs text-slate-500">
                Admins can manage all prompts. Users can only create and edit their own custom prompts.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Database Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5 text-purple-600" />
              <span>Database Status</span>
            </CardTitle>
            <CardDescription>
              Prompt storage and versioning system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-600">✓</div>
                <p className="text-xs font-medium text-green-800">Versioning</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-600">✓</div>
                <p className="text-xs font-medium text-green-800">Audit Trail</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-600">✓</div>
                <p className="text-xs font-medium text-green-800">Rollback</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-600">✓</div>
                <p className="text-xs font-medium text-green-800">Backup</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-slate-600" />
              <span>System Configuration</span>
            </CardTitle>
            <CardDescription>
              Global prompt system settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Default Prompt Timeout</span>
                <Badge variant="outline">30 seconds</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Max Prompt Length</span>
                <Badge variant="outline">10,000 chars</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Version Retention</span>
                <Badge variant="outline">Unlimited</Badge>
              </div>
            </div>
            <div className="pt-4 border-t">
              <p className="text-xs text-slate-500">
                These settings will be configurable in future versions.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Coming Soon Features */}
      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            Features planned for future releases
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Advanced Features</h4>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• A/B testing for prompt performance</li>
                <li>• Prompt usage analytics and metrics</li>
                <li>• Template library and sharing</li>
                <li>• Automated prompt optimization</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Integration</h4>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• CRM integration for context variables</li>
                <li>• Webhook notifications for prompt changes</li>
                <li>• API access for external systems</li>
                <li>• Bulk import/export capabilities</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
