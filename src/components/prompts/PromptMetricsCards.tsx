
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, History, Zap } from 'lucide-react'
import { Prompt } from '@/types/prompt'

interface PromptMetricsCardsProps {
  activePrompt: Prompt | null
  totalPrompts: number
  defaultAiProvider: string | undefined
}

export function PromptMetricsCards({ activePrompt, totalPrompts, defaultAiProvider }: PromptMetricsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-all duration-200 bg-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-700">Active Prompt</CardTitle>
          <MessageSquare className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {activePrompt ? (
              <>
                <div className="text-sm font-semibold truncate text-slate-900">
                  {activePrompt.prompt_name || 'Untitled'}
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="default" className="text-xs bg-blue-600">v{activePrompt.version_number}</Badge>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                    System-Wide
                  </Badge>
                </div>
              </>
            ) : (
              <div className="text-sm text-slate-500">No active prompt</div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-all duration-200 bg-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-700">Total Prompts</CardTitle>
          <History className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900">{totalPrompts || 0}</div>
          <p className="text-xs text-slate-500 mt-1">
            All versions available
          </p>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-all duration-200 bg-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-700">AI Provider</CardTitle>
          <Zap className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <div className="text-2xl font-bold text-slate-900">
              {defaultAiProvider?.toUpperCase() || 'Loading...'}
            </div>
            <Badge variant="outline" className="text-xs">Active</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">Global default</p>
        </CardContent>
      </Card>
    </div>
  )
}
