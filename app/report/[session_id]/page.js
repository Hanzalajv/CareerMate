'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ReportPage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()

  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('paths')
  const [checklistItems, setChecklistItems] = useState([])

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

      // Initialize checklist tracking
      const checklist = data.report.report_content.checklist || []
      setChecklistItems(checklist.map(item => ({
        ...item,
        completed: false,
        completed_at: null
      })))

      setLoading(false)
    } catch (err) {
      setError('Failed to load report')
      setLoading(false)
    }
  }

  function toggleChecklistItem(index) {
    const updated = [...checklistItems]
    updated[index] = {
      ...updated[index],
      completed: !updated[index].completed,
      completed_at: !updated[index].completed ? new Date().toISOString() : null
    }
    setChecklistItems(updated)
  }

  function getProgress() {
    if (checklistItems.length === 0) return 0
    const completed = checklistItems.filter(item => item.completed).length
    return Math.round((completed / checklistItems.length) * 100)
  }

  function getMatchColor(percentage) {
    if (percentage >= 80) return 'text-emerald-400 bg-emerald-900/30'
    if (percentage >= 60) return 'text-amber-400 bg-amber-900/30'
    return 'text-slate-400 bg-slate-700/50'
  }

  function getGrowthColor(outlook) {
    if (outlook === 'HIGH') return 'text-emerald-400'
    if (outlook === 'MEDIUM') return 'text-amber-400'
    return 'text-red-400'
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading your report...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !report) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-4xl mb-4">📄</div>
          <h2 className="text-white text-xl font-semibold mb-2">Report Not Found</h2>
          <p className="text-slate-400 mb-6">{error || 'This report could not be loaded.'}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-white text-lg font-semibold">Your Career Deep Dive Report</h1>
            <p className="text-slate-400 text-sm">Personalized career guidance based on your assessment</p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-slate-400 hover:text-white transition text-sm"
          >
            ← Dashboard
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Summary Card */}
        <div className="bg-gradient-to-r from-emerald-900/40 to-slate-800/50 rounded-2xl p-6 border border-emerald-700/30 mb-6">
          <h2 className="text-emerald-400 font-semibold mb-2">Overview</h2>
          <p className="text-slate-200 leading-relaxed">{report.summary}</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { key: 'paths', label: '🎯 Career Paths' },
            { key: 'strengths', label: '💪 Strengths & Growth' },
            { key: 'market', label: '🇵🇰 Market Insight' },
            { key: 'plan', label: '📋 Action Plan' },
            { key: 'checklist', label: '✅ Checklist' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                activeTab === tab.key
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* Career Paths Tab */}
          {activeTab === 'paths' && (
            <div className="space-y-4">
              <h2 className="text-white text-xl font-semibold">Recommended Career Paths</h2>
              <p className="text-slate-400 text-sm">Based on your profile, skills, and the Pakistani job market</p>
              
              {report.career_paths?.map((career, i) => (
                <div
                  key={i}
                  className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-5 hover:border-slate-600 transition"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-white font-semibold text-lg">{career.title}</h3>
                      <p className="text-slate-400 text-sm mt-1">{career.description}</p>
                    </div>
                    <span className={`text-sm font-bold px-3 py-1 rounded-full ${getMatchColor(career.match_percentage)}`}>
                      {career.match_percentage}% Match
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Pakistan Scope</p>
                      <p className="text-slate-300 text-sm">{career.pakistan_scope}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Salary Range</p>
                      <p className="text-slate-300 text-sm">{career.salary_range_pakistan}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Time to Start Earning</p>
                      <p className="text-slate-300 text-sm">{career.time_to_start_earning}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Growth Outlook</p>
                      <p className={`text-sm font-medium ${getGrowthColor(career.growth_outlook)}`}>
                        {career.growth_outlook}
                      </p>
                    </div>
                  </div>

                  {career.where_to_learn && (
                    <div className="mt-4 pt-4 border-t border-slate-700/50">
                      <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">Where to Learn</p>
                      <div className="flex flex-wrap gap-2">
                        {career.where_to_learn.map((place, j) => (
                          <span key={j} className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded-full">
                            {place}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {career.next_steps && (
                    <div className="mt-4 pt-4 border-t border-slate-700/50">
                      <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">Next Steps</p>
                      <ol className="list-decimal list-inside space-y-1">
                        {career.next_steps.map((step, j) => (
                          <li key={j} className="text-slate-300 text-sm">{step}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Strengths & Growth Tab */}
          {activeTab === 'strengths' && (
            <div className="space-y-6">
              <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
                <h2 className="text-white text-xl font-semibold mb-4">💪 Your Strengths</h2>
                <div className="space-y-2">
                  {report.strengths?.map((strength, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="text-emerald-400 mt-1">•</span>
                      <p className="text-slate-300">{strength}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
                <h2 className="text-white text-xl font-semibold mb-4">📈 Areas to Develop</h2>
                <div className="space-y-2">
                  {report.areas_to_develop?.map((area, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="text-amber-400 mt-1">•</span>
                      <p className="text-slate-300">{area}</p>
                    </div>
                  ))}
                </div>
              </div>

              {report.income_reality_check && (
                <div className="bg-amber-900/20 rounded-xl border border-amber-700/30 p-5">
                  <h2 className="text-amber-400 text-lg font-semibold mb-2">💰 Income Reality Check</h2>
                  <p className="text-slate-300">{report.income_reality_check}</p>
                </div>
              )}
            </div>
          )}

          {/* Market Insight Tab */}
          {activeTab === 'market' && (
            <div className="space-y-6">
              <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
                <h2 className="text-white text-xl font-semibold mb-4">🇵🇰 Pakistan Market Insight</h2>
                <p className="text-slate-300 leading-relaxed">{report.pakistan_market_insight}</p>
              </div>

              {report.career_paths && (
                <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
                  <h2 className="text-white text-xl font-semibold mb-4">📊 Career Comparison</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-700">
                          <th className="text-left py-2 text-slate-400 font-medium">Career</th>
                          <th className="text-left py-2 text-slate-400 font-medium">Match</th>
                          <th className="text-left py-2 text-slate-400 font-medium">Salary</th>
                          <th className="text-left py-2 text-slate-400 font-medium">Growth</th>
                          <th className="text-left py-2 text-slate-400 font-medium">Time to Earn</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.career_paths.map((career, i) => (
                          <tr key={i} className="border-b border-slate-700/50">
                            <td className="py-3 text-white">{career.title}</td>
                            <td className="py-3">
                              <span className={`px-2 py-0.5 rounded-full text-xs ${getMatchColor(career.match_percentage)}`}>
                                {career.match_percentage}%
                              </span>
                            </td>
                            <td className="py-3 text-slate-300">{career.salary_range_pakistan}</td>
                            <td className={`py-3 font-medium ${getGrowthColor(career.growth_outlook)}`}>
                              {career.growth_outlook}
                            </td>
                            <td className="py-3 text-slate-300">{career.time_to_start_earning}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Plan Tab */}
          {activeTab === 'plan' && (
            <div className="space-y-6">
              <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
                <h2 className="text-white text-xl font-semibold mb-4">⚡ Immediate Actions (This Week)</h2>
                <div className="space-y-2">
                  {report.immediate_actions?.map((action, i) => (
                    <div key={i} className="flex items-start gap-3 bg-slate-700/50 rounded-lg p-3">
                      <span className="text-emerald-400 font-bold">{i + 1}.</span>
                      <p className="text-slate-200 text-sm">{action}</p>
                    </div>
                  ))}
                </div>
              </div>

              {report.three_month_plan && (
                <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
                  <h2 className="text-white text-xl font-semibold mb-4">📅 3-Month Milestones</h2>
                  <div className="space-y-3">
                    {report.three_month_plan.map((milestone, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-900/50 text-emerald-400 flex items-center justify-center text-sm font-bold flex-shrink-0">
                          {i + 1}
                        </div>
                        <p className="text-slate-300 text-sm pt-1">{milestone}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {report.long_term_vision && (
                <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
                  <h2 className="text-white text-xl font-semibold mb-4">🔭 5-Year Vision</h2>
                  <p className="text-slate-300 leading-relaxed">{report.long_term_vision}</p>
                </div>
              )}
            </div>
          )}

          {/* Checklist Tab */}
          {activeTab === 'checklist' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-white text-xl font-semibold">✅ Your Career Checklist</h2>
                <span className="text-sm text-slate-400">{getProgress()}% Complete</span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${getProgress()}%` }}
                />
              </div>

              <div className="space-y-2">
                {checklistItems.map((item, i) => (
                  <div
                    key={i}
                    className={`bg-slate-800/50 rounded-xl border p-4 transition cursor-pointer ${
                      item.completed
                        ? 'border-emerald-700/50 bg-emerald-900/10'
                        : 'border-slate-700/50 hover:border-slate-600'
                    }`}
                    onClick={() => toggleChecklistItem(i)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition ${
                        item.completed
                          ? 'bg-emerald-500 border-emerald-500'
                          : 'border-slate-500'
                      }`}>
                        {item.completed && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm ${item.completed ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                          {item.task}
                        </p>
                        <div className="flex gap-3 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            item.priority === 'HIGH' ? 'bg-red-900/50 text-red-400' :
                            item.priority === 'MEDIUM' ? 'bg-amber-900/50 text-amber-400' :
                            'bg-slate-700 text-slate-400'
                          }`}>
                            {item.priority}
                          </span>
                          <span className="text-xs text-slate-500">{item.deadline}</span>
                          <span className="text-xs text-slate-500">{item.category}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="mt-8 pb-8 flex gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex-1 px-4 py-3 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition text-sm font-medium"
          >
            Back to Dashboard
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 transition text-sm font-medium"
          >
            Print Report
          </button>
        </div>
      </div>
    </div>
  )
}