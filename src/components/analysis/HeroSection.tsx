
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
  analysis: any // Keep same type for now
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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.15),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(168,85,247,0.1),transparent_50%)]"></div>
      
      <div className="relative z-10">
        <div className="flex items-start mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <Trophy className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl lg:text-2xl font-bold">Deal Command Center</h2>
              <p className="text-blue-200 text-sm lg:text-base">Strategic intelligence + competitive positioning</p>
            </div>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-2 lg:gap-3 text-sm">
          <span className="text-slate-300 font-medium">Decision Architecture:</span>
          {participants?.clientContacts && participants.clientContacts.length > 0 ? (
            participants.clientContacts.slice(0, 4).map((contact: any, index: number) => {
              const stakeholderDisplay = getStakeholderDisplay(contact);
              if (!stakeholderDisplay) {
                const roleColor = contact.decisionLevel === 'high' ? 'bg-red-500/20 text-red-300' : 
                                 contact.decisionLevel === 'medium' ? 'bg-yellow-500/20 text-yellow-300' : 
                                 'bg-gray-500/20 text-gray-300';
                return (
                  <Badge key={index} variant="secondary" className={`text-xs ${roleColor}`}>
                    {contact.name} ({contact.title}) {getRoleIcon(contact.decisionLevel)}
                  </Badge>
                );
              }
              
              return (
                <Badge key={index} variant="secondary" className={`text-xs ${stakeholderDisplay.color}`}>
                  {contact.name} ({contact.title}) {stakeholderDisplay.icon}
                </Badge>
              );
            })
          ) : (
            <span className="text-slate-400 italic">No client contacts identified</span>
          )}
          {participants?.salesRep?.name && (
            <Badge variant="secondary" className="text-xs bg-blue-500/20 text-blue-200 border-blue-400/30">
              Rep: {participants.salesRep.name}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
          
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-3 lg:p-4 hover:bg-white/15 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-6 h-6 lg:w-8 lg:h-8 ${dealHeat.bgColor} rounded-lg flex items-center justify-center`}>
                <Thermometer className="w-3 h-3 lg:w-4 lg:h-4 text-white" />
              </div>
              <span className="text-xs lg:text-sm font-medium text-red-200">Deal Heat</span>
            </div>
            <div className={`text-lg lg:text-2xl font-bold ${dealHeat.color}`}>{dealHeat.emoji} {dealHeat.level}</div>
            <p className="text-xs text-gray-300 leading-tight">{dealHeat.description}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-3 lg:p-4 hover:bg-white/15 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 lg:w-8 lg:h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <Crown className="w-3 h-3 lg:w-4 lg:h-4 text-white" />
              </div>
              <span className="text-xs lg:text-sm font-medium text-blue-200">Power Center</span>
            </div>
            <div className="text-sm lg:text-lg font-bold truncate">{decisionMaker.name}</div>
            <p className="text-xs text-gray-300 truncate">{decisionMaker.title} • {decisionMaker.influence}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-3 lg:p-4 hover:bg-white/15 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 lg:w-8 lg:h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-3 h-3 lg:w-4 lg:h-4 text-white" />
              </div>
              <span className="text-xs lg:text-sm font-medium text-green-200">Momentum</span>
            </div>
            <div className="text-lg lg:text-2xl font-bold text-green-300">{buyingSignals.count}/{buyingSignals.total}</div>
            <p className="text-xs text-gray-300 leading-tight">{buyingSignals.strength}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-3 lg:p-4 hover:bg-white/15 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 lg:w-8 lg:h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                <Target className="w-3 h-3 lg:w-4 lg:h-4 text-white" />
              </div>
              <span className="text-xs lg:text-sm font-medium text-purple-200">Competitive Edge</span>
            </div>
            <div className="text-sm lg:text-lg font-bold text-purple-300">
              {analysis.recommendations?.competitiveStrategy ? "Strategic Advantage" : "Integration Focus"}
            </div>
            <p className="text-xs text-gray-300 leading-tight">
              {timeline.driver || "Positioning opportunity identified"}
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-xl p-4 lg:p-6 border border-emerald-400/30 mb-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-start gap-3 lg:gap-4 flex-1">
              <Shield className="w-6 h-6 lg:w-8 lg:h-8 text-emerald-300 flex-shrink-0 mt-1" />
              <div className="min-w-0 flex-1">
                <h4 className="text-lg lg:text-xl font-bold text-white mb-1">Win Strategy</h4>
                <p className="text-emerald-200 text-sm lg:text-base leading-relaxed">
                  {analysis.recommendations?.primaryStrategy || 
                   "Position as the solution that uniquely addresses their specific business challenges and competitive requirements"}
                </p>
              </div>
            </div>
            <div className="text-right text-emerald-300 flex-shrink-0">
              <div className="font-bold text-base lg:text-lg">Competitive</div>
              <div className="text-sm">Advantage</div>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 lg:p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-6 h-6 lg:w-8 lg:h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <FileText className="w-3 h-3 lg:w-4 lg:h-4 text-white" />
            </div>
            <h3 className="text-base lg:text-lg font-semibold text-white">Call Summary</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="text-gray-200 text-sm lg:text-base leading-relaxed">
                {analysis.call_summary?.overview || 'This conversation provided valuable insights into the client\'s needs and current challenges.'}
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-bold text-gray-300 mb-2 underline">Client Situation</h4>
                <p className="text-gray-200 text-sm leading-relaxed">
                  {analysis.call_summary?.clientSituation || 'Client shared their current business context and challenges.'}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-300 mb-2 underline">Main Topics</h4>
                <ul className="space-y-1">
                  {(analysis.call_summary?.mainTopics || ['Business needs discussed', 'Solution options explored', 'Next steps identified']).slice(0, 3).map((topic, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0"></div>
                      <span className="text-gray-200 text-sm leading-relaxed">{topic}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 text-sm px-3 lg:px-4">
          <div>
            <h4 className="font-bold text-gray-300 mb-2 underline">Client Priority</h4>
            <p className="text-gray-200 leading-relaxed">
              {analysis.call_summary?.urgencyDrivers?.primary || 
               timeline.driver || 
               "Strategic business priority driving this opportunity"}
            </p>
          </div>
          <div>
            <h4 className="font-bold text-gray-300 mb-2 underline">Urgency Driver</h4>
            <p className="text-gray-200 leading-relaxed">
              {timeline.driver || 
               analysis.call_summary?.urgencyDrivers?.primary || 
               "Business pressure creating decision timeline"}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
