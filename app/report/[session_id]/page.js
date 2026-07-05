'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { 
  Target, Brain, TrendingUp, Shield, Clock, MapPin, 
  BookOpen, ArrowRight, Sparkles, Star, Zap, Trophy, 
  AlertTriangle, Compass, DollarSign, GraduationCap, 
  Briefcase, Check, X, ChevronDown, ChevronUp, Flame,
  Quote, Lightbulb, Eye, EyeOff, Search, BarChart3,
  Calendar, Route, Award
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
  const [showEnhanceButton, setShowEnhanceButton] = useState(true)
  const [enhancing, setEnhancing] = useState(false)

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

      // Try to get enhanced report first
      const response = await fetch(`/api/deep-dive/report?session_id=${params.session_id}&enhance=true`)
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to load report')
        setLoading(false)
        return
      }

      setReport(data.report.report_content)
      
      // Check if report already has reasoning
      const hasReasoning = data.report.report_content?.career_paths?.[0]?.why_suggested?.rationale
      if (hasReasoning) setShowEnhanceButton(false)

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

  async function handleEnhance() {
    setEnhancing(true)
    await loadReport()
    setEnhancing(false)
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
      { accent: 'text-emerald-400', bg: 'from-emerald-500/10 to-teal-500/10', border: 'border-emerald-500/20', dot: 'bg-emerald-500', glow: 'shadow-emerald-500/5' },
      { accent: 'text-purple-400', bg: 'from-purple-500/10 to-pink-500/10', border: 'border-purple-500/20', dot: 'bg-purple-500', glow: 'shadow-purple-500/5' },
      { accent: 'text-amber-400', bg: 'from-amber-500/10 to-orange-500/10', border: 'border-amber-500/20', dot: 'bg-amber-500', glow: 'shadow-amber-500/5' },
      { accent: 'text-rose-400', bg: 'from-rose-500/10 to-red-500/10', border: 'border-rose-500/20', dot: 'bg-rose-500', glow: 'shadow-rose-500/5' },
      { accent: 'text-cyan-400', bg: 'from-cyan-500/10 to-blue-500/10', border: 'border-cyan-500/20', dot: 'bg-cyan-500', glow: 'shadow-cyan-500/5' },
      { accent: 'text-blue-400', bg: 'from-blue-500/10 to-indigo-500/10', border: 'border-blue-500/20', dot: 'bg-blue-500', glow: 'shadow-blue-500/5' },
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

  return (
    <div className="min-h-screen bg-[#070b14] text-white">
      
      {/* Fixed Header */}
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
        
        {/* Hero Summary Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-blue-500/10 border border-emerald-500/10 p-6">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-emerald-500/5 blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20 flex items-center justify-center">
                <Award className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg">Your Career Report</h2>
                {report.user_snapshot?.sincerity_score && (
                  <div className="flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-amber-400 text-xs font-medium">Sincerity: {report.user_snapshot.sincerity_score}/10</span>
                  </div>
                )}
              </div>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">{report.summary}</p>
            
            {/* Quick Stats Row */}
            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/5">
              <div className="text-center">
                <p className="text-emerald-400 font-bold text-lg">{report.career_paths?.length || 0}</p>
                <p className="text-slate-500 text-[10px]">Career Paths</p>
              </div>
              <div className="text-center">
                <p className="text-blue-400 font-bold text-lg">{report.tested_knowledge?.verified?.length || 0}</p>
                <p className="text-slate-500 text-[10px]">Verified Skills</p>
              </div>
              <div className="text-center">
                <p className="text-purple-400 font-bold text-lg">6</p>
                <p className="text-slate-500 text-[10px]">Month Plan</p>
              </div>
            </div>
          </div>
        </div>

       {report.reasoning_summary && (
  <div className="bg-gradient-to-br from-blue-500/5 to-purple-500/5 border border-blue-500/10 rounded-2xl p-5">
    <div className="flex items-center gap-2 mb-3">
      <Lightbulb className="w-5 h-5 text-yellow-400" />
      <h3 className="text-yellow-400 font-semibold text-sm">Why These Recommendations</h3>
    </div>
    {typeof report.reasoning_summary === 'string' ? (
      <p className="text-slate-300 text-sm leading-relaxed">{report.reasoning_summary}</p>
    ) : (
      <div className="space-y-3">
        {report.reasoning_summary.key_insights && (
          <div>
            <p className="text-yellow-400/80 text-xs uppercase tracking-wider mb-1">Key Insights</p>
            <p className="text-slate-300 text-sm">{report.reasoning_summary.key_insights}</p>
          </div>
        )}
        {report.reasoning_summary.contradictions_or_surprises && (
          <div>
            <p className="text-yellow-400/80 text-xs uppercase tracking-wider mb-1">Surprises</p>
            <p className="text-slate-300 text-sm">{report.reasoning_summary.contradictions_or_surprises}</p>
          </div>
        )}
        {report.reasoning_summary.paths_ruled_out && (
          <div>
            <p className="text-yellow-400/80 text-xs uppercase tracking-wider mb-1">Paths Ruled Out</p>
            <p className="text-slate-300 text-sm">{report.reasoning_summary.paths_ruled_out}</p>
          </div>
        )}
      </div>
    )}
  </div>
)}

        {/* Career Paths — Premium Cards */}
        <div className="space-y-4">
          <h3 className="text-white font-semibold text-sm flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-400" />
            Recommended Career Paths
          </h3>
          
          {(report.career_paths || []).map((career, i) => {
            const color = getCardColor(i + 1)
            const hasRationale = career.why_suggested?.rationale
            
            return (
              <div key={i} className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${color.bg} border ${color.border} p-5 hover:${color.glow} transition-all group`}>
                {/* Match badge */}
                <div className="absolute top-4 right-4">
                  <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${getMatchColor(career.match_percentage)}`}>
                    {career.match_percentage}% Match
                  </span>
                </div>

                {/* Title & Description */}
                <div className="pr-20 mb-4">
                  <h4 className="text-white font-bold text-lg mb-1">{career.title}</h4>
                  {career.description && (
                    <p className="text-slate-400 text-sm">{career.description}</p>
                  )}
                </div>

                {/* Rationale — The WHY */}
                {hasRationale && (
                  <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-4 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Quote className="w-4 h-4 text-purple-400" />
                      <p className="text-purple-400 text-xs font-semibold uppercase tracking-wider">Why This Fits You</p>
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed">{career.why_suggested.rationale}</p>
                    
                    {/* Evidence Quotes */}
                    {career.why_suggested.evidence_quotes && career.why_suggested.evidence_quotes.length > 0 && (
                      <div className="mt-3 space-y-1.5">
                        {career.why_suggested.evidence_quotes.map((quote, j) => (
                          <div key={j} className="flex items-start gap-2 text-xs text-slate-500 italic">
                            <span className="text-purple-400 mt-0.5">"</span>
                            <span>{quote}</span>
                            <span className="text-purple-400 mt-0.5">"</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Key Details Grid */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-white/[0.03] rounded-xl p-3">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400 mb-1" />
                    <p className="text-slate-500 text-[10px] uppercase">Salary (PKR)</p>
                    <p className="text-white text-xs font-medium">{career.salary_range_pakistan || 'Not specified'}</p>
                  </div>
                  <div className="bg-white/[0.03] rounded-xl p-3">
                    <TrendingUp className="w-3.5 h-3.5 text-purple-400 mb-1" />
                    <p className="text-slate-500 text-[10px] uppercase">Growth</p>
                    <p className={`text-xs font-bold ${getGrowthColor(career.growth_outlook)}`}>{career.growth_outlook || 'MEDIUM'}</p>
                  </div>
                  <div className="bg-white/[0.03] rounded-xl p-3">
                    <Clock className="w-3.5 h-3.5 text-blue-400 mb-1" />
                    <p className="text-slate-500 text-[10px] uppercase">Time to Earn</p>
                    <p className="text-white text-xs font-medium">{career.time_to_first_income || career.time_to_start_earning || 'Varies'}</p>
                  </div>
                  <div className="bg-white/[0.03] rounded-xl p-3">
                    <MapPin className="w-3.5 h-3.5 text-amber-400 mb-1" />
                    <p className="text-slate-500 text-[10px] uppercase">Scope</p>
                    <p className="text-white text-xs font-medium truncate">{career.pakistan_scope?.split('.')[0] || 'Growing'}</p>
                  </div>
                </div>

                {/* Where to Start */}
                {career.where_to_start && career.where_to_start.length > 0 && (
                  <div className="border-t border-white/[0.05] pt-3">
                    <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-2">Where to Start</p>
                    <div className="space-y-1.5">
                      {career.where_to_start.slice(0, 2).map((step, j) => (
                        <div key={j} className="flex items-center gap-2 text-slate-400 text-xs">
                          <div className="w-4 h-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-emerald-400 text-[10px] font-bold">{j + 1}</span>
                          </div>
                          {step}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

               {career.why_suggested?.alternatives_considered && career.why_suggested.alternatives_considered.length > 0 && (
  <div className="border-t border-white/[0.05] pt-3 mt-3">
    <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-2 flex items-center gap-1">
      <EyeOff className="w-3 h-3" /> Considered But Rejected
    </p>
    <div className="space-y-1.5">
      {career.why_suggested.alternatives_considered.map((alt, j) => (
        <div key={j} className="text-slate-600 text-xs">
          {typeof alt === 'string' ? (
            <p className="italic">{alt}</p>
          ) : (
            <div>
              <p className="text-slate-500 font-medium">{alt.alternative}</p>
              <p className="text-slate-600 italic mt-0.5">{alt.reason_rejected}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
)}
              </div>
            )
          })}
        </div>

        {/* Strengths & Blind Spots */}
        <div className="space-y-4">
          {/* Strengths */}
          {report.strengths && report.strengths.length > 0 && (
            <div className="bg-gradient-to-br from-emerald-500/[0.03] to-teal-500/[0.03] border border-emerald-500/10 rounded-2xl p-5">
              <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-400" />
                Your Strengths
              </h3>
              <div className="space-y-3">
                {report.strengths.map((s, i) => (
                  <div key={i} className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-3">
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-white text-sm">{typeof s === 'string' ? s : s.strength}</p>
                        {typeof s === 'object' && s.evidence && (
                          <p className="text-emerald-400/60 text-xs mt-1 italic">"{s.evidence}"</p>
                        )}
                        {typeof s === 'object' && s.source_quote && (
                          <p className="text-purple-400/60 text-xs mt-1 italic">From your session: "{s.source_quote}"</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Blind Spots */}
          {report.blind_spots && report.blind_spots.length > 0 && (
            <div className="bg-gradient-to-br from-amber-500/[0.03] to-orange-500/[0.03] border border-amber-500/10 rounded-2xl p-5">
              <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
                <Eye className="w-4 h-4 text-amber-400" />
                What You Might Be Missing
              </h3>
              <div className="space-y-3">
                {report.blind_spots.map((b, i) => (
                  <div key={i} className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-white text-sm">{typeof b === 'string' ? b : b.blind_spot}</p>
                        {typeof b === 'object' && b.why_it_matters && (
                          <p className="text-amber-400/60 text-xs mt-1">{b.why_it_matters}</p>
                        )}
                        {typeof b === 'object' && b.related_quote && (
                          <p className="text-slate-500 text-xs mt-1 italic">You never mentioned: "{b.related_quote}"</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Market Reality */}
        {(report.pakistan_market_insight || report.pakistan_market_reality) && (
          <div className="bg-gradient-to-br from-cyan-500/[0.03] to-blue-500/[0.03] border border-cyan-500/10 rounded-2xl p-5">
            <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-400" />
              Pakistan Market Reality
            </h3>
            {report.pakistan_market_insight && (
              <p className="text-slate-300 text-sm leading-relaxed mb-3">{report.pakistan_market_insight}</p>
            )}
            <div className="grid grid-cols-2 gap-2">
              {report.pakistan_market_reality?.their_advantage && (
                <div className="bg-emerald-500/[0.03] border border-emerald-500/10 rounded-xl p-3">
                  <p className="text-emerald-400 text-[10px] uppercase tracking-wider mb-1">Advantage</p>
                  <p className="text-slate-300 text-xs">{report.pakistan_market_reality.their_advantage}</p>
                </div>
              )}
              {report.pakistan_market_reality?.their_disadvantage && (
                <div className="bg-red-500/[0.03] border border-red-500/10 rounded-xl p-3">
                  <p className="text-red-400 text-[10px] uppercase tracking-wider mb-1">Challenge</p>
                  <p className="text-slate-300 text-xs">{report.pakistan_market_reality.their_disadvantage}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 6-Month Roadmap Preview */}
        {report.six_month_roadmap && (
          <div className="bg-gradient-to-br from-purple-500/[0.03] to-pink-500/[0.03] border border-purple-500/10 rounded-2xl p-5">
            <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
              <Route className="w-4 h-4 text-purple-400" />
              6-Month Roadmap
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(report.six_month_roadmap).slice(0, 6).map(([key, month], i) => (
                <div key={key} className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-3 text-center hover:bg-white/[0.05] transition cursor-default">
                  <p className="text-slate-500 text-[10px] uppercase mb-1">Month {i + 1}</p>
                  <p className="text-white text-xs font-medium">{month?.theme || 'Growth'}</p>
                </div>
              ))}
            </div>
            {checklistId && (
              <Link href={`/checklist/${checklistId}`} className="flex items-center justify-center gap-2 w-full mt-4 py-3 bg-purple-500/20 border border-purple-500/30 text-purple-400 rounded-2xl font-semibold text-sm hover:bg-purple-500/30 transition">
                View Full Monthly Plan <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        )}

        {/* Final Word */}
        {report.final_word && (
          <div className="bg-gradient-to-r from-blue-500/5 via-emerald-500/5 to-purple-500/5 border border-white/10 rounded-2xl p-5 text-center">
            <Sparkles className="w-6 h-6 text-emerald-400 mx-auto mb-3" />
            <p className="text-slate-300 text-sm italic leading-relaxed">"{report.final_word}"</p>
          </div>
        )}

        {/* Income Reality Check */}
        {report.income_reality_check && (
          <div className="bg-gradient-to-br from-amber-500/[0.03] to-yellow-500/[0.03] border border-amber-500/10 rounded-2xl p-5">
            <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-400" />
              Income Reality Check
            </h3>
            <div className="space-y-2">
              {typeof report.income_reality_check === 'object' ? (
                <>
                  {report.income_reality_check.their_expectation && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Your Expectation</span>
                      <span className="text-white">{report.income_reality_check.their_expectation}</span>
                    </div>
                  )}
                  {report.income_reality_check.market_reality && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Market Reality</span>
                      <span className="text-emerald-400">{report.income_reality_check.market_reality}</span>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-slate-300 text-sm">{report.income_reality_check}</p>
              )}
            </div>
          </div>
        )}

        {/* Checklist Preview */}
        {checklistItems.length > 0 && (
          <div className="bg-white/[0.01] border border-white/[0.04] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                Action Checklist
              </h3>
              <span className="text-xs text-slate-500">{getProgress()}% done</span>
            </div>
            <div className="w-full bg-white/[0.04] rounded-full h-1.5 mb-4">
              <div className="bg-emerald-500 h-1.5 rounded-full transition-all" style={{ width: `${getProgress()}%` }} />
            </div>
            <div className="space-y-2">
              {checklistItems.slice(0, 5).map((item, i) => (
                <div key={i} onClick={() => toggleChecklistItem(i)} className={`flex items-start gap-3 p-3 rounded-xl border transition cursor-pointer ${
                  item.completed ? 'border-emerald-500/10 bg-emerald-500/[0.02]' : 'border-white/[0.03] bg-white/[0.01] hover:bg-white/[0.03]'
                }`}>
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    item.completed ? 'bg-emerald-500 border-emerald-500' : 'border-white/[0.15]'
                  }`}>
                    {item.completed && <Check className="w-3 h-3 text-white" strokeWidth={4} />}
                  </div>
                  <p className={`text-xs ${item.completed ? 'text-slate-500 line-through' : 'text-slate-300'}`}>{item.task}</p>
                </div>
              ))}
            </div>
          </div>
        )}

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