
import { useState } from 'react'
import { useExecutePrompt } from '@/hooks/usePromptExecution'
import { useDefaultAiProvider } from '@/hooks/useSystemSettings'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Play, Zap, Clock } from 'lucide-react'

interface PromptTesterProps {
  promptId: string
}

export function PromptTester({ promptId }: PromptTesterProps) {
  const [testConversation, setTestConversation] = useState('')
  const [testAccountContext, setTestAccountContext] = useState('')
  const [testUserContext, setTestUserContext] = useState('')
  
  const executePrompt = useExecutePrompt()
  const { data: aiProvider } = useDefaultAiProvider()

  const handleTest = async () => {
    if (!testConversation.trim()) return

    await executePrompt.mutateAsync({
      promptId,
      testData: {
        conversation: testConversation,
        account_context: testAccountContext || undefined,
        user_context: testUserContext || undefined
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Test Prompt</h3>
          <p className="text-sm text-slate-600">
            Test this prompt with sample data to see how it performs
          </p>
        </div>
        <Badge variant="secondary" className="flex items-center space-x-1">
          <Zap className="h-3 w-3" />
          <span>{aiProvider?.toUpperCase() || 'Loading...'}</span>
        </Badge>
      </div>

      {/* Test Inputs */}
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="test-conversation">Sample Conversation *</Label>
          <Textarea
            id="test-conversation"
            value={testConversation}
            onChange={(e) => setTestConversation(e.target.value)}
            placeholder="Enter a sample sales conversation to test the prompt..."
            className="min-h-[200px]"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="test-account-context">Account Context (Optional)</Label>
            <Textarea
              id="test-account-context"
              value={testAccountContext}
              onChange={(e) => setTestAccountContext(e.target.value)}
              placeholder="Previous conversation history, account details..."
              className="h-20"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="test-user-context">User Context (Optional)</Label>
            <Textarea
              id="test-user-context"
              value={testUserContext}
              onChange={(e) => setTestUserContext(e.target.value)}
              placeholder="User preferences, selling style..."
              className="h-20"
            />
          </div>
        </div>
      </div>

      {/* Test Button */}
      <Button 
        onClick={handleTest}
        disabled={!testConversation.trim() || executePrompt.isPending}
        className="w-full bg-blue-600 hover:bg-blue-700"
      >
        {executePrompt.isPending ? (
          <>
            <Clock className="h-4 w-4 mr-2 animate-spin" />
            Testing Prompt...
          </>
        ) : (
          <>
            <Play className="h-4 w-4 mr-2" />
            Test Prompt
          </>
        )}
      </Button>

      {/* Results */}
      {executePrompt.data && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Test Results</span>
              <div className="flex items-center space-x-2 text-sm">
                <Badge variant="outline">
                  {executePrompt.data.processing_time_ms}ms
                </Badge>
                <Badge variant="secondary">
                  {executePrompt.data.ai_provider.toUpperCase()}
                </Badge>
              </div>
            </CardTitle>
            <CardDescription>
              Prompt execution completed successfully
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-50 p-4 rounded-lg">
              <pre className="text-sm whitespace-pre-wrap">
                {JSON.stringify(executePrompt.data.response, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {executePrompt.error && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Test Failed</CardTitle>
            <CardDescription className="text-red-600">
              An error occurred while testing the prompt
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-700">
              {executePrompt.error.message}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
