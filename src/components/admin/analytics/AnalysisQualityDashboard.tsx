import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, CheckCircle, FileWarning, TrendingUp, ExternalLink } from 'lucide-react'
import { useAnalysisQuality } from '@/hooks/useAnalysisQuality'
import { Link } from 'react-router-dom'

export function AnalysisQualityDashboard() {
  const { qualityFlags, stats, isLoading, resolveFlag } = useAnalysisQuality()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading quality monitoring data...</div>
      </div>
    )
  }

  const flagTypeLabels: Record<string, { label: string; icon: any; color: string }> = {
    fabricated_quotes: { 
      label: 'Fabricated Quotes', 
      icon: AlertTriangle, 
      color: 'text-red-600' 
    },
    missing_fields: { 
      label: 'Missing Fields', 
      icon: FileWarning, 
      color: 'text-orange-600' 
    },
    schema_invalid: { 
      label: 'Schema Invalid', 
      icon: AlertTriangle, 
      color: 'text-purple-600' 
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Issues (7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalIssues || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.unresolvedIssues || 0} unresolved
            </p>
          </CardContent>
        </Card>

        {Object.entries(stats?.byType || {}).map(([type, data]) => {
          const config = flagTypeLabels[type]
          const Icon = config?.icon || AlertTriangle
          
          return (
            <Card key={type}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${config?.color}`} />
                  {config?.label || type}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data.total}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {((data.unresolved / data.total) * 100).toFixed(1)}% unresolved
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recent Issues Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            Recent Quality Issues
          </CardTitle>
          <CardDescription>
            Unresolved quality flags requiring attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {qualityFlags && qualityFlags.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                <p>No unresolved quality issues</p>
              </div>
            ) : (
              qualityFlags?.map((flag: any) => {
                const config = flagTypeLabels[flag.flag_type]
                const Icon = config?.icon || AlertTriangle
                const transcript = flag.conversation_analysis?.transcripts
                
                return (
                  <div 
                    key={flag.id} 
                    className="border rounded-lg p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Icon className={`w-3 h-3 ${config?.color}`} />
                            {config?.label || flag.flag_type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(flag.flagged_at).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <h4 className="font-semibold text-sm mb-1">
                          {transcript?.title || 'Unknown Transcript'}
                        </h4>
                        
                        {flag.details && (
                          <p className="text-xs text-muted-foreground">
                            {typeof flag.details === 'object' 
                              ? JSON.stringify(flag.details).slice(0, 100) + '...'
                              : flag.details
                            }
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {transcript && (
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                          >
                            <Link to={`/analysis/${transcript.id}`}>
                              <ExternalLink className="w-4 h-4 mr-1" />
                              View
                            </Link>
                          </Button>
                        )}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => resolveFlag.mutate(flag.id)}
                          disabled={resolveFlag.isPending}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Resolve
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
