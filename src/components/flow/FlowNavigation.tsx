
import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Upload, BarChart3 } from 'lucide-react'

interface FlowNavigationProps {
  currentView: 'dashboard' | 'progress' | 'results'
  onBackToDashboard: () => void
  onUploadAnother: () => void
  showUploadAnother?: boolean
}

export function FlowNavigation({ 
  currentView, 
  onBackToDashboard, 
  onUploadAnother,
  showUploadAnother = true
}: FlowNavigationProps) {
  const getStepInfo = () => {
    switch (currentView) {
      case 'dashboard':
        return { step: 1, title: 'Upload', icon: Upload }
      case 'progress':
        return { step: 2, title: 'Analysis', icon: BarChart3 }
      case 'results':
        return { step: 3, title: 'Insights', icon: BarChart3 }
      default:
        return { step: 1, title: 'Upload', icon: Upload }
    }
  }

  const stepInfo = getStepInfo()
  const StepIcon = stepInfo.icon

  return (
    <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            onClick={onBackToDashboard}
            className="text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
          
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="flex items-center space-x-1">
              <StepIcon className="w-4 h-4" />
              <span>Step {stepInfo.step}: {stepInfo.title}</span>
            </Badge>
          </div>
        </div>
        
        {showUploadAnother && (
          <Button 
            onClick={onUploadAnother}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Upload className="w-4 h-4 mr-2" />
            Analyze Another Call
          </Button>
        )}
      </div>
    </div>
  )
}
