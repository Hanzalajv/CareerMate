'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { 
  Target, Brain, TrendingUp, Shield, Clock, MapPin, 
  BookOpen, ArrowRight, Sparkles, Star, Zap, Trophy, 
  AlertTriangle, Compass, DollarSign, GraduationCap, 
  Briefcase, Check, X, ChevronDown, ChevronUp, Flame
} from 'lucide-react'

export default function ReportPage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()
  const [checklistId, setChecklistId] = useState(null)

  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [checklistItems, setChecklistItems] = useState([])
  const [expandedCard, setExpandedCard] = useState(null)

  useEffect(() => {
    loadReport()
  }, [])

  async function loadReport() {
    try {
      setLoading(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const response = await fetch(`/api/deep-dive/report?session_id=${params.session_id}`)
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to load report')
        setLoading(false)
        return
      }

      setReport(data.report.report_content)

      const checklistRes = await fetch(`/api/checklist/get?report_id=${params.session_id}`)
      const checklistData = await checklistRes.json()

      if (checklistData.checklists?.length > 0) {
        const savedChecklist = checklistData.checklists[0]
        setChecklistId(savedChecklist.checklist_id)
        setChecklistItems(savedChecklist.items || [])
      } else {
        const checklist = data.report.report_content.checklist || []
        setChecklistItems(checklist.map(item => ({
          ...item,
          completed: false,
          completed_at: null
        })))
      }

      setLoading(false)
    } catch (err) {
      setError('Failed to load report')
      setLoading(false)
    }
  }

  async function toggleChecklistItem(index) {
    if (!checklistId) return
    
    const updated = [...checklistItems]
    updated[index] = {
      ...updated[index],
      completed: !updated[index].completed,
      completed_at: !updated[index].completed ? new Date().toISOString() : null
    }
    setChecklistItems(updated)

    try {
      await fetch('/api/checklist/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checklistId, itemIndex: index })
      })
    } catch (err) {
      setChecklistItems(prev => {
        const reverted = [...prev]
        reverted[index] = {
          ...reverted[index],
          completed: !reverted[index].completed,
          completed_at: null
        }
        return reverted
      })
    }
  }

  function getProgress() {
    if (checklistItems.length === 0) return 0
    const completed = checklistItems.filter(item => item.completed).length
    return Math.round((completed / checklistItems.length) * 100)
  }

  function getMatchColor(percentage) {
    if (percentage >= 80) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    if (percentage >= 60) return 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    return 'text-slate-400 bg-slate-500/10 border-slate-500/20'
  }

  function getGrowthColor(outlook) {
    if (outlook === 'HIGH') return 'text-emerald-400'
    if (outlook === 'MEDIUM') return 'text-amber-400'
    return 'text-red-400'
  }

  function getCardColor(index) {
    const colors = [
      { accent: 'text-emerald-400', bg: 'from-emerald-500/10 to-teal-500/10', border: 'border-emerald-500/20', dot: 'bg-emerald-500' },
      { accent: 'text-purple-400', bg: 'from-purple-500/10 to-pink-500/10', border: 'border-purple-500/20', dot: 'bg-purple-500' },
      { accent: 'text-amber-400', bg: 'from-amber-500/10 to-orange-500/10', border: 'border-amber-500/20', dot: 'bg-amber-500' },
      { accent: 'text-rose-400', bg: 'from-rose-500/10 to-red-500/10', border: 'border-rose-500/20', dot: 'bg-rose-500' },
      { accent: 'text-cyan-400', bg: 'from-cyan-500/10 to-blue-500/10', border: 'border-cyan-500/20', dot: 'bg-cyan-500' },
      { accent: 'text-blue-400', bg: 'from-blue-500/10 to-indigo-500/10', border: 'border-blue-500/20', dot: 'bg-blue-500' },
    ]
    return colors[index % colors.length]
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Preparing your report...</p>
        </div>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
            <X className="w-10 h-10 text-red-400" />
          </div>
          <h2 className="text-white text-xl font-semibold mb-2">Report Not Found</h2>
          <p className="text-slate-400 mb-6">{error || 'This report could not be loaded.'}</p>
          <button onClick={() => router.push('/dashboard')} className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 transition font-medium">
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const sections = [
    { id: 'overview', icon: Compass, title: 'Overview', color: getCardColor(0) },
    ...(report.career_paths || []).map((career, i) => ({
      id: `career-${i}`,
      icon: Target,
      title: career.title,
      subtitle: `${career.match_percentage}% Match`,
      career: career,
      color: getCardColor(i + 1)
    })),
    { id: 'strengths', icon: Brain, title: 'Strengths & Discoveries', color: getCardColor((report.career_paths?.length || 0) + 1) },
    { id: 'market', icon: Shield, title: 'Pakistan Market Reality', color: getCardColor((report.career_paths?.length || 0) + 2) },
    { id: 'plan', icon: Sparkles, title: 'Your 6-Month Plan', color: getCardColor((report.career_paths?.length || 0) + 3) },
    { id: 'checklist', icon: Check, title: 'Action Checklist', color: getCardColor((report.career_paths?.length || 0) + 4) },
  ]

  return (
    <div className="min-h-screen bg-[#070b14] text-white">
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#070b14]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-white font-semibold text-sm">Your Career Deep Dive Report</h1>
            <p className="text-slate-500 text-xs">Personalized guidance based on your assessment</p>
          </div>
          <button onClick={() => router.push('/dashboard')} className="text-slate-400 hover:text-white text-sm transition">
            ← Dashboard
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="pt-20 pb-32 px-4 max-w-lg mx-auto space-y-4">
        
        {/* Summary Banner */}
        <div className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/10 rounded-2xl p-5 mb-2">
          <p className="text-slate-300 text-sm leading-relaxed">{report.summary}</p>
          {report.user_snapshot?.sincerity_score && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
              <Star className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400 text-xs font-medium">Sincerity: {report.user_snapshot.sincerity_score}/10</span>
            </div>
          )}
        </div>

        {/* Bottom Sheet Cards */}
        {sections.map((section) => {
          const isExpanded = expandedCard === section.id
          const Icon = section.icon
          
          return (
            <div key={section.id}>
              {/* Collapsed Card */}
              {!isExpanded && (
                <button
                  onClick={() => setExpandedCard(section.id)}
                  className={`w-full bg-white/[0.02] border border-white/[0.04] rounded-2xl p-4 flex items-center gap-4 hover:bg-white/[0.04] hover:border-white/[0.08] transition-all group`}
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${section.color.bg} border ${section.color.border} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${section.color.accent}`} />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-white text-sm font-medium truncate">{section.title}</p>
                    {section.subtitle && (
                      <p className={`text-xs ${section.color.accent} font-semibold`}>{section.subtitle}</p>
                    )}
                  </div>
                  <ChevronDown className="w-5 h-5 text-slate-600 group-hover:text-slate-400 transition-colors flex-shrink-0" />
                </button>
              )}

              {/* Expanded Full Screen Card */}
              {isExpanded && (
                <div className="fixed inset-0 z-50 bg-[#070b14]/98 backdrop-blur-xl flex flex-col animate-in slide-in-from-bottom duration-300">
                  
                  {/* Card Header */}
                  <div className={`h-1.5 bg-gradient-to-r ${section.color.bg}`} />
                  <div className="px-5 py-4 flex items-center justify-between border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${section.color.bg} border ${section.color.border} flex items-center justify-center`}>
                        <Icon className={`w-4.5 h-4.5 ${section.color.accent}`} />
                      </div>
                      <div>
                        <p className="text-white text-sm font-semibold">{section.title}</p>
                        {section.subtitle && (
                          <p className={`text-xs ${section.color.accent} font-semibold`}>{section.subtitle}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setExpandedCard(null)}
                      className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition"
                    >
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    </button>
                  </div>

                  {/* Card Content */}
                  <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
                    
                    {/* OVERVIEW */}
                    {section.id === 'overview' && (
                      <>
                        {report.user_snapshot?.persona_summary && (
                          <p className="text-slate-300 text-sm leading-relaxed">{report.user_snapshot.persona_summary}</p>
                        )}
                        {report.user_snapshot?.true_intention && (
                          <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-4 flex items-start gap-3">
                            <Target className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-slate-400 text-xs uppercase tracking-wider">True Intention</p>
                              <p className="text-white text-sm">{report.user_snapshot.true_intention}</p>
                            </div>
                          </div>
                        )}
                        {report.user_snapshot?.immediate_goal && (
                          <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-4 flex items-start gap-3">
                            <Zap className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-slate-400 text-xs uppercase tracking-wider">Immediate Goal</p>
                              <p className="text-white text-sm">{report.user_snapshot.immediate_goal}</p>
                            </div>
                          </div>
                        )}
                        {report.tested_knowledge && (
                          <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4 space-y-3">
                            <p className="text-slate-400 text-xs uppercase tracking-wider">Knowledge Verification</p>
                            {report.tested_knowledge.verified && report.tested_knowledge.verified.length > 0 && (
                              <div>
                                <p className="text-emerald-400 text-xs mb-1.5">✓ Verified</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {report.tested_knowledge.verified.map((v, i) => (
                                    <span key={i} className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-full border border-emerald-500/20">{v}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {report.tested_knowledge.not_verified && report.tested_knowledge.not_verified.length > 0 && (
                              <div>
                                <p className="text-red-400 text-xs mb-1.5">✗ Not Verified</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {report.tested_knowledge.not_verified.map((v, i) => (
                                    <span key={i} className="text-xs bg-red-500/10 text-red-400 px-2 py-1 rounded-full border border-red-500/20">{v}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}

                    {/* CAREER PATH */}
                    {section.career && (
                      <>
                        {section.career.description && (
                          <p className="text-slate-300 text-sm leading-relaxed">{section.career.description}</p>
                        )}

                        {section.career.why_suggested && (
                          <div className="space-y-2">
                            <p className="text-slate-400 text-xs uppercase tracking-wider">Why This Career</p>
                            {section.career.why_suggested.based_on_their_words && (
                              <div className="bg-purple-500/[0.04] border border-purple-500/10 rounded-xl p-3">
                                <p className="text-purple-400 text-[10px] uppercase mb-1">Based on Your Words</p>
                                <p className="text-slate-300 text-sm italic">"{section.career.why_suggested.based_on_their_words}"</p>
                              </div>
                            )}
                            {section.career.why_suggested.based_on_market && (
                              <div className="bg-emerald-500/[0.04] border border-emerald-500/10 rounded-xl p-3">
                                <p className="text-emerald-400 text-[10px] uppercase mb-1">Market Demand</p>
                                <p className="text-slate-300 text-sm">{section.career.why_suggested.based_on_market}</p>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white/[0.03] border border-white/[0.04] rounded-xl p-3">
                            <DollarSign className="w-4 h-4 text-emerald-400 mb-1" />
                            <p className="text-slate-500 text-[10px] uppercase">Salary (PKR)</p>
                            <p className="text-white text-sm font-medium">{section.career.salary_range_pakistan || 'Not specified'}</p>
                          </div>
                          <div className="bg-white/[0.03] border border-white/[0.04] rounded-xl p-3">
                            <Clock className="w-4 h-4 text-blue-400 mb-1" />
                            <p className="text-slate-500 text-[10px] uppercase">Time to Earn</p>
                            <p className="text-white text-sm font-medium">{section.career.time_to_first_income || section.career.time_to_start_earning || 'Varies'}</p>
                          </div>
                          <div className="bg-white/[0.03] border border-white/[0.04] rounded-xl p-3">
                            <TrendingUp className="w-4 h-4 text-purple-400 mb-1" />
                            <p className="text-slate-500 text-[10px] uppercase">Growth</p>
                            <p className={`text-sm font-bold ${getGrowthColor(section.career.growth_outlook)}`}>{section.career.growth_outlook || 'MEDIUM'}</p>
                          </div>
                          <div className="bg-white/[0.03] border border-white/[0.04] rounded-xl p-3">
                            <Target className="w-4 h-4 text-amber-400 mb-1" />
                            <p className="text-slate-500 text-[10px] uppercase">Match</p>
                            <p className="text-white text-sm font-bold">{section.career.match_percentage}%</p>
                          </div>
                        </div>

                        {section.career.pakistan_scope && (
                          <div className="bg-white/[0.03] border border-white/[0.04] rounded-xl p-4">
                            <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">Pakistan Scope</p>
                            <p className="text-slate-300 text-sm">{section.career.pakistan_scope}</p>
                          </div>
                        )}

                        {section.career.education_required && (
                          <div className="bg-white/[0.03] border border-white/[0.04] rounded-xl p-4 flex items-start gap-3">
                            <GraduationCap className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                            <p className="text-slate-300 text-sm">{section.career.education_required}</p>
                          </div>
                        )}

                        {section.career.barriers_for_them && (
                          <div className="bg-amber-500/[0.04] border border-amber-500/10 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-1">
                              <AlertTriangle className="w-4 h-4 text-amber-400" />
                              <p className="text-amber-400 text-xs uppercase tracking-wider">Barriers</p>
                            </div>
                            <p className="text-slate-300 text-sm">{section.career.barriers_for_them}</p>
                          </div>
                        )}

                        {section.career.where_to_start && section.career.where_to_start.length > 0 && (
                          <div>
                            <p className="text-slate-400 text-xs uppercase tracking-wider mb-3">Where to Start</p>
                            <div className="space-y-2">
                              {section.career.where_to_start.map((step, i) => (
                                <div key={i} className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.04] rounded-xl p-3">
                                  <div className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                    <span className="text-emerald-400 text-xs font-bold">{i + 1}</span>
                                  </div>
                                  <p className="text-slate-300 text-sm">{step}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {section.career.where_to_learn && section.career.where_to_learn.length > 0 && (
                          <div>
                            <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">Where to Learn</p>
                            <div className="flex flex-wrap gap-2">
                              {section.career.where_to_learn.map((place, j) => (
                                <span key={j} className="text-xs bg-white/[0.04] text-slate-300 px-3 py-1.5 rounded-full border border-white/[0.06]">{place}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {section.career.next_steps && section.career.next_steps.length > 0 && (
                          <div>
                            <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">Next Steps</p>
                            <ol className="list-decimal list-inside space-y-1.5">
                              {section.career.next_steps.map((step, j) => (
                                <li key={j} className="text-slate-300 text-sm">{step}</li>
                              ))}
                            </ol>
                          </div>
                        )}
                      </>
                    )}

                    {/* STRENGTHS */}
                    {section.id === 'strengths' && (
                      <>
                        {report.strengths && report.strengths.length > 0 && (
                          <div>
                            <p className="text-slate-400 text-xs uppercase tracking-wider mb-3">Your Strengths</p>
                            <div className="space-y-2">
                              {report.strengths.map((s, i) => (
                                <div key={i} className="flex items-start gap-3 bg-emerald-500/[0.03] border border-emerald-500/10 rounded-xl p-3">
                                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                                  <div>
                                    <p className="text-white text-sm">{typeof s === 'string' ? s : s.strength}</p>
                                    {typeof s === 'object' && s.evidence && (
                                      <p className="text-slate-500 text-xs mt-1">"{s.evidence}"</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {report.blind_spots && report.blind_spots.length > 0 && (
                          <div>
                            <p className="text-slate-400 text-xs uppercase tracking-wider mb-3">Blind Spots</p>
                            <div className="space-y-2">
                              {report.blind_spots.map((b, i) => (
                                <div key={i} className="flex items-start gap-3 bg-amber-500/[0.03] border border-amber-500/10 rounded-xl p-3">
                                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                                  <p className="text-white text-sm">{typeof b === 'string' ? b : b.blind_spot}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {report.areas_to_develop && report.areas_to_develop.length > 0 && (
                          <div>
                            <p className="text-slate-400 text-xs uppercase tracking-wider mb-3">Areas to Develop</p>
                            <div className="space-y-2">
                              {report.areas_to_develop.map((a, i) => (
                                <div key={i} className="flex items-start gap-3 bg-purple-500/[0.03] border border-purple-500/10 rounded-xl p-3">
                                  <Zap className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                                  <p className="text-white text-sm">{typeof a === 'string' ? a : a.skill}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {/* MARKET */}
                    {section.id === 'market' && (
                      <>
                        {report.pakistan_market_insight && (
                          <div className="bg-white/[0.03] border border-white/[0.04] rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <MapPin className="w-4 h-4 text-emerald-400" />
                              <p className="text-slate-400 text-xs uppercase tracking-wider">Market Insight</p>
                            </div>
                            <p className="text-slate-300 text-sm leading-relaxed">{report.pakistan_market_insight}</p>
                          </div>
                        )}

                        {report.pakistan_market_reality?.their_advantage && (
                          <div className="bg-emerald-500/[0.03] border border-emerald-500/10 rounded-xl p-4">
                            <p className="text-emerald-400 text-xs uppercase tracking-wider mb-1">Your Advantage</p>
                            <p className="text-slate-300 text-sm">{report.pakistan_market_reality.their_advantage}</p>
                          </div>
                        )}

                        {report.pakistan_market_reality?.their_disadvantage && (
                          <div className="bg-red-500/[0.03] border border-red-500/10 rounded-xl p-4">
                            <p className="text-red-400 text-xs uppercase tracking-wider mb-1">Challenges</p>
                            <p className="text-slate-300 text-sm">{report.pakistan_market_reality.their_disadvantage}</p>
                          </div>
                        )}

                        {report.income_reality_check && (
                          <div className="bg-amber-500/[0.03] border border-amber-500/10 rounded-xl p-4">
                            <p className="text-amber-400 text-xs uppercase tracking-wider mb-1">Income Reality</p>
                            <p className="text-slate-300 text-sm">
                              {typeof report.income_reality_check === 'string' ? report.income_reality_check : report.income_reality_check.market_reality || ''}
                            </p>
                          </div>
                        )}

                        {report.career_paths && (
                          <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4">
                            <p className="text-slate-400 text-xs uppercase tracking-wider mb-3">Career Comparison</p>
                            <div className="space-y-2">
                              {report.career_paths.map((career, i) => (
                                <div key={i} className="flex items-center justify-between text-sm">
                                  <span className="text-slate-300">{career.title}</span>
                                  <span className={`px-2 py-0.5 rounded-full text-xs ${getMatchColor(career.match_percentage)}`}>{career.match_percentage}%</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {/* PLAN */}
                    {section.id === 'plan' && (
                      <>
                        {report.six_month_roadmap && (
                          <div className="grid grid-cols-3 gap-2">
                            {Object.entries(report.six_month_roadmap).slice(0, 6).map(([key, month], i) => (
                              <div key={key} className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-3 text-center">
                                <p className="text-slate-500 text-[10px] uppercase">Month {i + 1}</p>
                                <p className="text-white text-xs font-medium mt-1">{month?.theme || 'Learning'}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {report.immediate_actions && report.immediate_actions.length > 0 && (
                          <div>
                            <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">Start This Week</p>
                            <div className="space-y-2">
                              {report.immediate_actions.slice(0, 3).map((action, i) => (
                                <div key={i} className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.04] rounded-xl p-3">
                                  <Zap className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                                  <p className="text-slate-300 text-sm">{action}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {report.three_month_plan && report.three_month_plan.length > 0 && (
                          <div>
                            <p className="text-slate-400 text-xs uppercase tracking-wider mb-3">3-Month Milestones</p>
                            <div className="space-y-2">
                              {report.three_month_plan.map((milestone, i) => (
                                <div key={i} className="flex items-center gap-3">
                                  <div className="w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                    <span className="text-emerald-400 text-xs font-bold">{i + 1}</span>
                                  </div>
                                  <p className="text-slate-300 text-sm">{milestone}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {report.long_term_vision && (
                          <div className="bg-gradient-to-r from-blue-500/5 to-emerald-500/5 border border-white/10 rounded-xl p-4">
                            <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">5-Year Vision</p>
                            <p className="text-slate-300 text-sm leading-relaxed">{report.long_term_vision}</p>
                          </div>
                        )}

                        {report.final_word && (
                          <div className="bg-gradient-to-r from-blue-500/5 to-emerald-500/5 border border-white/10 rounded-xl p-4 text-center">
                            <p className="text-slate-300 text-sm italic">"{report.final_word}"</p>
                          </div>
                        )}

                        {checklistId && (
                          <Link href={`/checklist/${checklistId}`} className="flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-2xl hover:opacity-90 transition shadow-xl shadow-emerald-500/20 text-sm">
                            📋 View Monthly Action Plan
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        )}
                      </>
                    )}

                    {/* CHECKLIST */}
                    {section.id === 'checklist' && (
                      <>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-slate-400">{getProgress()}% Complete</span>
                          <span className="text-xs text-slate-500">{checklistItems.filter(i => i.completed).length}/{checklistItems.length} tasks</span>
                        </div>
                        <div className="w-full bg-white/[0.05] rounded-full h-2 mb-4">
                          <div className="bg-emerald-500 h-2 rounded-full transition-all duration-500" style={{ width: `${getProgress()}%` }} />
                        </div>
                        <div className="space-y-2">
                          {checklistItems.map((item, i) => (
                            <div
                              key={i}
                              onClick={() => toggleChecklistItem(i)}
                              className={`bg-white/[0.02] border rounded-xl p-4 transition cursor-pointer ${
                                item.completed ? 'border-emerald-500/10 bg-emerald-500/[0.02]' : 'border-white/[0.04] hover:border-white/[0.08]'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition ${
                                  item.completed ? 'bg-emerald-500 border-emerald-500' : 'border-white/[0.15]'
                                }`}>
                                  {item.completed && <Check className="w-3.5 h-3.5 text-white" strokeWidth={4} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm ${item.completed ? 'text-slate-500 line-through' : 'text-slate-200'}`}>{item.task}</p>
                                  <div className="flex gap-2 mt-2 flex-wrap">
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                                      item.priority === 'HIGH' ? 'text-red-400 bg-red-500/10 border-red-500/20' :
                                      item.priority === 'MEDIUM' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                                      'text-slate-400 bg-slate-500/10 border-slate-500/20'
                                    }`}>{item.priority}</span>
                                    {item.category && <span className="text-[10px] text-slate-500 bg-white/[0.03] px-2 py-0.5 rounded-full">{item.category}</span>}
                                    {item.deadline && <span className="text-[10px] text-slate-500 bg-white/[0.03] px-2 py-0.5 rounded-full">{item.deadline}</span>}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#070b14]/90 backdrop-blur-xl border-t border-white/5 px-4 py-3">
        <div className="max-w-lg mx-auto flex gap-3">
          <button onClick={() => router.push('/dashboard')} className="flex-1 py-3 bg-white/[0.03] border border-white/[0.06] text-slate-400 rounded-xl hover:text-white hover:bg-white/[0.06] transition text-sm font-medium">
            Dashboard
          </button>
          {checklistId && (
            <Link href={`/checklist/${checklistId}`} className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:opacity-90 transition text-sm font-semibold text-center shadow-lg shadow-emerald-500/20">
              📋 Action Plan
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}