
import { useState } from 'react'
import { useExecutePrompt } from '@/hooks/usePromptExecution'
import { useDefaultAiProvider } from '@/hooks/useSystemSettings'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { TestTube, Copy, Download } from 'lucide-react'

interface PromptTesterProps {
  prompt: any
  isOpen: boolean
  onClose: () => void
}

export function PromptTester({ prompt, isOpen, onClose }: PromptTesterProps) {
  const [testConversation, setTestConversation] = useState('')
  const [testAccountContext, setTestAccountContext] = useState('')
  const [testUserContext, setTestUserContext] = useState('')
  
  const executePrompt = useExecutePrompt()
  const { data: aiProvider } = useDefaultAiProvider()

  const handleTest = async () => {
    if (!testConversation.trim()) return

    await executePrompt.mutateAsync({
      promptId: prompt.id,
      testData: {
        conversation: testConversation,
        account_context: testAccountContext || undefined,
        user_context: testUserContext || undefined
      }
    })
  }

  const loadSampleData = () => {
    setTestConversation(`Sales Rep: Hi John, thanks for taking the time to meet with me today. I understand you're looking into solutions for your customer support workflow?

Customer: Yes, we're having some challenges. Our team is spending way too much time on repetitive tasks, and our response times are suffering. We're looking at about 500 tickets per day right now.

Sales Rep: That's a significant volume. Tell me, what's your current process when a ticket comes in? Walk me through a typical day.

Customer: Well, first our agents have to manually categorize each ticket. Then they search through our knowledge base - which isn't very organized - to find the right response. It takes about 15 minutes per ticket on average.

Sales Rep: So with 500 tickets daily, that's roughly 125 hours of manual work just on categorization and research. What would happen if you could cut that time in half?

Customer: That would be huge. We could handle more volume or maybe even reduce our team size. But I'm not sure how realistic that is.

Sales Rep: Here's the thing - companies similar to yours have seen 60-70% reduction in handling time using intelligent automation. What if I told you that instead of 15 minutes per ticket, your team could handle most tickets in under 5 minutes?`)

    setTestAccountContext(`Previous conversations:
- Initial discovery call 2 weeks ago
- Demo scheduled for next week
- Budget range: $50K-100K annually
- Decision timeline: End of quarter
- Key stakeholders: John (IT Director), Sarah (Support Manager)
- Current pain points: Manual processes, slow response times, team burnout`)

    setTestUserContext(`Selling style: Challenger approach
Focus areas: Business impact, operational efficiency
Industry expertise: SaaS customer support solutions
Preferred approach: Data-driven insights, ROI-focused discussions`)
  }

  const copyResults = () => {
    if (executePrompt.data) {
      navigator.clipboard.writeText(JSON.stringify(executePrompt.data.response, null, 2))
    }
  }

  const exportResults = () => {
    if (executePrompt.data) {
      const exportData = {
        prompt_name: prompt.prompt_name,
        version_number: prompt.version_number,
        test_conversation: testConversation,
        test_results: executePrompt.data.response,
        test_metadata: {
          ai_provider: executePrompt.data.ai_provider,
          processing_time_ms: executePrompt.data.processing_time_ms,
          tested_at: new Date().toISOString()
        }
      }
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `prompt-test-${prompt.prompt_name || 'untitled'}-${Date.now()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <TestTube className="h-5 w-5 text-blue-600" />
            <span>Test Prompt: {prompt.prompt_name || 'Untitled'}</span>
            <Badge variant="outline">v{prompt.version_number}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">
                Test this prompt with sample data to see how it performs
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="flex items-center space-x-1">
                <span>{aiProvider?.toUpperCase() || 'Loading...'}</span>
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={loadSampleData}
                className="text-blue-600 hover:text-blue-700"
              >
                Load Sample Data
              </Button>
            </div>
          </div>

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

          <Button 
            onClick={handleTest}
            disabled={!testConversation.trim() || executePrompt.isPending}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {executePrompt.isPending ? (
              <>
                <TestTube className="h-4 w-4 mr-2 animate-spin" />
                Testing Prompt...
              </>
            ) : (
              <>
                <TestTube className="h-4 w-4 mr-2" />
                Test Prompt
              </>
            )}
          </Button>

          {executePrompt.data && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Test Results</span>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyResults}
                      className="flex items-center space-x-1"
                    >
                      <Copy className="h-4 w-4" />
                      <span>Copy</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportResults}
                      className="flex items-center space-x-1"
                    >
                      <Download className="h-4 w-4" />
                      <span>Export</span>
                    </Button>
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
      </DialogContent>
    </Dialog>
  )
}
