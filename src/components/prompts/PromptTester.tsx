
import { useState } from 'react'
import { useExecutePrompt } from '@/hooks/usePromptExecution'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Play, Clock, Zap } from 'lucide-react'

interface PromptTesterProps {
  promptId: string
  aiProvider: 'openai' | 'claude'
}

export function PromptTester({ promptId, aiProvider }: PromptTesterProps) {
  const [testData, setTestData] = useState({
    conversation: `Salesperson: Hi John, thanks for taking the time to meet with me today. I wanted to discuss how we can help streamline your customer service operations.

Customer: Sure, we're always looking for ways to improve efficiency. What did you have in mind?

Salesperson: I've been researching your company and noticed you handle about 10,000 customer inquiries per month. Based on industry data, companies your size typically spend 40% more time on manual ticket routing than they need to.

Customer: That's interesting. We do struggle with getting tickets to the right departments quickly.

Salesperson: Exactly. What if I told you that our automated routing system could reduce your response time by 60% and cut manual work by half? Would that kind of improvement be valuable to your team?

Customer: Definitely. How does it work?`,
    
    account_context: `Company: TechCorp Solutions
Industry: Software Services
Size: 250 employees
Current Pain Points: Manual customer service processes, slow ticket routing
Previous Interactions: Initial discovery call 2 weeks ago, expressed interest in automation
Decision Maker: John Smith (Customer Success Director)
Budget Authority: Confirmed $50K annual budget for customer service tools`,

    user_context: `Sales Rep: Sarah Johnson
Experience: 3 years in SaaS sales
Quota: $500K annually
Current Performance: 85% of quota YTD
Strengths: Technical knowledge, relationship building
Development Areas: Challenger selling, creating urgency`
  })

  const [activeTab, setActiveTab] = useState('test')
  const [lastResult, setLastResult] = useState<any>(null)

  const executePrompt = useExecutePrompt()

  const handleTest = async () => {
    try {
      const result = await executePrompt.mutateAsync({
        promptId,
        testData
      })
      setLastResult(result)
      setActiveTab('results')
    } catch (error) {
      console.error('Test failed:', error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5" />
              <span>Prompt Tester</span>
            </CardTitle>
            <CardDescription>
              Test your prompt with sample data to see how {aiProvider === 'openai' ? 'ChatGPT' : 'Claude'} responds
            </CardDescription>
          </div>
          <Badge variant={aiProvider === 'openai' ? 'default' : 'secondary'}>
            {aiProvider === 'openai' ? 'ChatGPT' : 'Claude'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="test">Test Data</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>

          <TabsContent value="test" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="conversation">Sample Conversation</Label>
                <Textarea
                  id="conversation"
                  value={testData.conversation}
                  onChange={(e) => setTestData(prev => ({ ...prev, conversation: e.target.value }))}
                  placeholder="Enter a sample sales conversation..."
                  className="min-h-[120px] text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="account-context">Account Context</Label>
                <Textarea
                  id="account-context"
                  value={testData.account_context}
                  onChange={(e) => setTestData(prev => ({ ...prev, account_context: e.target.value }))}
                  placeholder="Enter account background information..."
                  className="min-h-[80px] text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="user-context">User Context</Label>
                <Textarea
                  id="user-context"
                  value={testData.user_context}
                  onChange={(e) => setTestData(prev => ({ ...prev, user_context: e.target.value }))}
                  placeholder="Enter sales rep context..."
                  className="min-h-[80px] text-sm"
                />
              </div>

              <Separator />

              <Button 
                onClick={handleTest}
                disabled={executePrompt.isPending}
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
            </div>
          </TabsContent>

          <TabsContent value="results" className="space-y-4">
            {lastResult ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Test Results</h3>
                  <div className="flex items-center space-x-2 text-sm text-slate-600">
                    <Clock className="h-4 w-4" />
                    <span>{lastResult.processing_time_ms}ms</span>
                    <Badge variant="outline">v{lastResult.prompt_version}</Badge>
                  </div>
                </div>

                {lastResult.response.parsing_error ? (
                  <div className="space-y-2">
                    <Badge variant="destructive">JSON Parse Error</Badge>
                    <pre className="bg-slate-100 p-4 rounded-md text-sm overflow-auto max-h-96">
                      {lastResult.response.raw_response}
                    </pre>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {lastResult.response.challenger_scores && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Challenger Scores</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-600">
                                {lastResult.response.challenger_scores.teaching || 'N/A'}
                              </div>
                              <div className="text-xs text-slate-600">Teaching</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-600">
                                {lastResult.response.challenger_scores.tailoring || 'N/A'}
                              </div>
                              <div className="text-xs text-slate-600">Tailoring</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-purple-600">
                                {lastResult.response.challenger_scores.control || 'N/A'}
                              </div>
                              <div className="text-xs text-slate-600">Control</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {lastResult.response.guidance && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Coaching Guidance</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {lastResult.response.guidance.recommendation && (
                            <div>
                              <Badge variant={
                                lastResult.response.guidance.recommendation === 'Push' ? 'default' :
                                lastResult.response.guidance.recommendation === 'Continue' ? 'secondary' : 'outline'
                              }>
                                {lastResult.response.guidance.recommendation}
                              </Badge>
                            </div>
                          )}
                          <p className="text-sm">{lastResult.response.guidance.message}</p>
                        </CardContent>
                      </Card>
                    )}

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Raw Response</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <pre className="bg-slate-50 p-3 rounded text-xs overflow-auto max-h-64">
                          {JSON.stringify(lastResult.response, null, 2)}
                        </pre>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Play className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <p>Run a test to see results here</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
