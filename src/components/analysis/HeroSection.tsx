
import React from 'react'
import { Badge } from '@/components/ui/badge'
import { 
  Trophy,
  FileText,
  Thermometer,
  Crown,
  TrendingUp,
  Target,
  Shield
} from 'lucide-react'

interface HeroSectionProps {
  transcript: {
    title: string
    meeting_date: string
    duration_minutes: number
  }
  analysis: any
  dealHeat: any
  decisionMaker: any
  buyingSignals: any
  timeline: any
  participants: any
  getStakeholderDisplay: (contact: any) => any
  getRoleIcon: (role: string) => string
}

export function HeroSection({ 
  transcript, 
  analysis, 
  dealHeat, 
  decisionMaker, 
  buyingSignals, 
  timeline, 
  participants,
  getStakeholderDisplay,
  getRoleIcon 
}: HeroSectionProps) {
  return (
    <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 rounded-2xl p-6 lg:p-8 text-white relative overflow-hidden mb-6 lg:mb-8">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-3xl"></div>
      
      <div className="relative z-10">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-8">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30 px-3 py-1">
                <Trophy className="w-4 h-4 mr-2" />
                Deal Command Center
              </Badge>
              <Badge className={`${dealHeat.bgColor}/20 ${dealHeat.color} border-current/30 px-3 py-1`}>
                {dealHeat.emoji} {dealHeat.level} PRIORITY
              </Badge>
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold leading-tight">
              Your Sales Intelligence Hub
            </h2>
            <p className="text-blue-200 text-lg max-w-2xl">
              {dealHeat.description} • Strategic insights extracted from {transcript.duration_minutes}-minute conversation
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 lg:p-6 border border-white/20 hover:bg-white/15 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <Thermometer className="w-5 h-5 lg:w-6 lg:h-6 text-red-300" />
              </div>
              <h3 className="font-semibold text-lg">Deal Heat</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{dealHeat.emoji}</span>
                <span className="font-bold text-xl">{dealHeat.level}</span>
              </div>
              <p className="text-sm text-gray-300">{dealHeat.description}</p>
              {dealHeat.evidence && dealHeat.evidence.length > 0 && (
                <p className="text-xs text-blue-200 leading-relaxed">
                  "{dealHeat.evidence[0]}"
                </p>
              )}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 lg:p-6 border border-white/20 hover:bg-white/15 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Crown className="w-5 h-5 lg:w-6 lg:h-6 text-yellow-300" />
              </div>
              <h3 className="font-semibold text-lg">Decision Maker</h3>
            </div>
            <div className="space-y-2">
              <div>
                <p className="font-medium">{decisionMaker.name}</p>
                <p className="text-sm text-gray-300">{decisionMaker.title}</p>
              </div>
              <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-400/30 text-xs">
                {decisionMaker.influence}
              </Badge>
              {decisionMaker.evidence && decisionMaker.evidence.length > 0 && (
                <p className="text-xs text-blue-200 leading-relaxed">
                  "{decisionMaker.evidence[0]}"
                </p>
              )}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 lg:p-6 border border-white/20 hover:bg-white/15 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <TrendingUp className="w-5 h-5 lg:w-6 lg:h-6 text-green-300" />
              </div>
              <h3 className="font-semibold text-lg">Buying Signals</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{buyingSignals.count}</span>
                <span className="text-sm text-gray-300">signals detected</span>
              </div>
              <Badge className={`bg-${buyingSignals.color}-500/20 text-${buyingSignals.color}-300 border-${buyingSignals.color}-400/30 text-xs`}>
                {buyingSignals.strength}
              </Badge>
              {buyingSignals.commitmentCount > 0 && (
                <p className="text-xs text-blue-200">
                  {buyingSignals.commitmentCount} commitment signals
                </p>
              )}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 lg:p-6 border border-white/20 hover:bg-white/15 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Target className="w-5 h-5 lg:w-6 lg:h-6 text-purple-300" />
              </div>
              <h3 className="font-semibold text-lg">Timeline</h3>
            </div>
            <div className="space-y-2">
              <div>
                <p className="font-medium text-sm lg:text-base leading-tight">{timeline.timeline}</p>
                <Badge className={`bg-${timeline.urgency === 'HIGH' ? 'red' : timeline.urgency === 'MEDIUM' ? 'orange' : 'blue'}-500/20 text-${timeline.urgency === 'HIGH' ? 'red' : timeline.urgency === 'MEDIUM' ? 'orange' : 'blue'}-300 border-current/30 text-xs mt-1`}>
                  {timeline.urgency} urgency
                </Badge>
              </div>
              {timeline.driver && (
                <p className="text-xs text-blue-200 leading-relaxed">
                  Driver: {timeline.driver}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-blue-300" />
              <h3 className="text-xl font-semibold">Decision Architecture</h3>
            </div>
            
            <div className="space-y-3">
              {participants.clientContacts && participants.clientContacts.length > 0 ? (
                participants.clientContacts.slice(0, 3).map((contact: any, index: number) => {
                  const display = getStakeholderDisplay(contact)
                  return (
                    <div key={index} className="flex items-center justify-between p-3 bg-white/10 rounded-lg border border-white/20">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{getRoleIcon(contact.challengerRole || contact.decisionLevel)}</span>
                        <div>
                          <p className="font-medium text-sm">{contact.name}</p>
                          <p className="text-xs text-gray-300">{contact.title}</p>
                        </div>
                      </div>
                      {display && (
                        <Badge className={`${display.color} border-current/30 text-xs`}>
                          {display.label}
                        </Badge>
                      )}
                    </div>
                  )
                })
              ) : (
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-sm text-gray-300">Stakeholder mapping in progress...</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-green-300" />
              <h3 className="text-xl font-semibold">Win Strategy</h3>
            </div>
            
            <div className="space-y-3">
              {analysis.recommendations?.primaryRecommendation ? (
                <div className="p-4 bg-green-500/20 rounded-lg border border-green-400/30">
                  <h4 className="font-semibold text-green-300 mb-2">Primary Strategy</h4>
                  <p className="text-sm text-white leading-relaxed">
                    {analysis.recommendations.primaryRecommendation}
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-white/10 rounded-lg border border-white/20">
                  <h4 className="font-semibold mb-2">Strategic Analysis</h4>
                  <p className="text-sm text-gray-300">
                    Detailed recommendations being finalized...
                  </p>
                </div>
              )}

              {analysis.call_summary && (
                <div className="p-4 bg-blue-500/20 rounded-lg border border-blue-400/30">
                  <h4 className="font-semibold text-blue-300 mb-2">Call Summary</h4>
                  <p className="text-sm text-white leading-relaxed">
                    {analysis.call_summary.mainTakeaway || 
                     analysis.call_summary.overallSentiment || 
                     "Comprehensive analysis available in detailed sections below"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-lg p-4 border border-orange-400/30">
            <h4 className="font-semibold text-orange-300 mb-2 flex items-center gap-2">
              🎯 Client Priority
            </h4>
            <p className="text-sm text-white leading-relaxed">
              {analysis.call_summary?.painSeverity?.businessImpact || 
               analysis.call_summary?.urgencyDrivers?.primary ||
               "Priority assessment based on conversation indicators"}
            </p>
          </div>
          
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg p-4 border border-purple-400/30">
            <h4 className="font-semibold text-purple-300 mb-2 flex items-center gap-2">
              ⚡ Urgency Driver
            </h4>
            <p className="text-sm text-white leading-relaxed">
              {timeline.driver || 
               analysis.call_summary?.timelineAnalysis?.businessDriver ||
               "Timeline factors driving decision process"}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
