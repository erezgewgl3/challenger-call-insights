import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface DealBlockersProps {
  dealBlockers: string | null
  analysis: any
}

export function DealBlockersCard({ dealBlockers, analysis }: DealBlockersProps) {
  // Only show if we have real blockers (not placeholders)
  const isRealBlocker = dealBlockers && 
                        dealBlockers !== null && 
                        !dealBlockers.includes('Analysis incomplete') &&
                        !dealBlockers.includes('not provided')

  if (!isRealBlocker) {
    return null // Don't render empty card
  }

  // Extract recommended actions from analysis
  const nextBestActions = analysis?.recommendations?.nextBestActions || []
  const topActions = nextBestActions.slice(0, 3)

  return (
    <Card className="border-red-300 bg-gradient-to-br from-red-50 to-orange-50 mb-6 lg:mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-900">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          🚧 Deal Blockers
        </CardTitle>
        <CardDescription className="text-red-700 font-medium">
          Critical obstacles to deal closure
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Main Blockers */}
        <div className="bg-white/70 rounded-lg p-4 border border-red-200">
          <p className="text-sm text-slate-800 leading-relaxed">
            {dealBlockers}
          </p>
        </div>

        {/* Recommended Actions */}
        {topActions.length > 0 && (
          <div>
            <h4 className="font-semibold text-orange-900 flex items-center gap-2 mb-3">
              <ArrowRight className="w-4 h-4 text-orange-600" />
              💡 Recommended Actions
            </h4>
            <ul className="space-y-2">
              {topActions.map((action: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2">
                  <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300 mt-0.5">
                    {idx + 1}
                  </Badge>
                  <span className="text-sm text-slate-700 flex-1">
                    {action}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
