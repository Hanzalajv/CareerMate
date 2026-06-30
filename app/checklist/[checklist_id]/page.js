'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  Check, ChevronDown, ChevronUp, Clock, Trophy, Target, 
  Flame, Star, Sparkles, ArrowRight, Zap, Calendar, Gift,
  TrendingUp, Medal, Lock
} from 'lucide-react'

export default function ChecklistPage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()

  const [checklist, setChecklist] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [timeLeft, setTimeLeft] = useState(null)
  const [streak, setStreak] = useState({ daily_streak: 0, daily_longest: 0 })
  const [expandedMonth, setExpandedMonth] = useState(null)
  const [showCelebration, setShowCelebration] = useState(false)

  useEffect(() => {
    loadChecklist()
    loadStreak()
  }, [])

  useEffect(() => {
    if (checklist?.status === 'IN_PROGRESS' && checklist?.deadline_at) {
      const timer = setInterval(() => {
        const remaining = new Date(checklist.deadline_at).getTime() - Date.now()
        if (remaining <= 0) {
          setTimeLeft('Deadline passed')
          clearInterval(timer)
        } else {
          const days = Math.floor(remaining / (1000 * 60 * 60 * 24))
          const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
          
          if (days <= 3) {
            setTimeLeft(`⚠️ ${days}d ${hours}h — Almost due!`)
          } else if (days <= 7) {
            setTimeLeft(`⏳ ${days}d remaining`)
          } else {
            setTimeLeft(`${days}d remaining`)
          }
        }
      }, 60000)
      return () => clearInterval(timer)
    }
  }, [checklist])

  async function loadChecklist() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const response = await fetch(`/api/checklist/get?checklist_id=${params.checklist_id}`)
      const data = await response.json()

      if (!response.ok) { setError(data.error); setLoading(false); return }

      setChecklist(data.checklist)
      if (!expandedMonth) {
        const activeMonth = data.checklist.items?.find(i => !i.completed)?.month || 1
        setExpandedMonth(activeMonth)
      }
      setLoading(false)
    } catch (err) {
      setError('Failed to load checklist')
      setLoading(false)
    }
  }

  async function loadStreak() {
    const response = await fetch('/api/streak/get')
    const data = await response.json()
    if (response.ok) setStreak(data.streak)
  }

  async function handleStart() {
    const response = await fetch('/api/checklist/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checklistId: checklist.checklist_id })
    })
    const data = await response.json()
    if (response.ok) setChecklist(data.checklist)
  }

  async function handlePause() {
    const response = await fetch('/api/checklist/pause', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checklistId: checklist.checklist_id })
    })
    const data = await response.json()
    if (response.ok) setChecklist(data.checklist)
  }

  async function handleToggle(itemIndex) {
    if (checklist.status !== 'IN_PROGRESS') return

    const wasAlreadyCompleted = checklist.items[itemIndex].completed
    
    const response = await fetch('/api/checklist/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checklistId: checklist.checklist_id, itemIndex })
    })
    const data = await response.json()
    if (response.ok) {
      setChecklist(data.checklist)

      // Update streak
      const streakRes = await fetch('/api/streak/update', { method: 'POST' })
      const streakData = await streakRes.json()
      if (streakRes.ok) setStreak(streakData.streak)

      // Check if all tasks just got completed
      const allDone = data.checklist.items?.every(i => i.completed)
      if (allDone && !wasAlreadyCompleted) {
        setShowCelebration(true)
        setTimeout(() => setShowCelebration(false), 5000)
      }
    }
  }

  // Group tasks by month
  function getTasksByMonth() {
    if (!checklist?.items) return {}
    const grouped = {}
    checklist.items.forEach(item => {
      const month = item.month || 1
      if (!grouped[month]) grouped[month] = []
      grouped[month].push(item)
    })
    return grouped
  }

  function getMonthProgress(monthTasks) {
    if (!monthTasks?.length) return 0
    const done = monthTasks.filter(t => t.completed).length
    return Math.round((done / monthTasks.length) * 100)
  }

  function getTotalProgress() {
    if (!checklist?.items?.length) return 0
    const done = checklist.items.filter(t => t.completed).length
    return Math.round((done / checklist.items.length) * 100)
  }

  function getTotalXP() {
    if (!checklist?.items) return 0
    return checklist.items.filter(t => t.completed).length * 20
  }

  function getCompletedTasks() {
    return checklist?.items?.filter(t => t.completed).length || 0
  }

  function getPriorityColor(priority) {
    if (priority === 'HIGH') return 'text-red-400 bg-red-500/10 border-red-500/20'
    if (priority === 'MEDIUM') return 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    return 'text-slate-400 bg-slate-500/10 border-slate-500/20'
  }

  function getMonthLabel(monthNum) {
    const labels = {
      1: 'Month 1: Foundation',
      2: 'Month 2: Skill Building',
      3: 'Month 3: Portfolio & Projects',
      4: 'Month 4: Networking',
      5: 'Month 5: Applications',
      6: 'Month 6: Launch & Earn'
    }
    return labels[monthNum] || `Month ${monthNum}`
  }

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !checklist) {
    return (
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center">
        <div className="text-center p-6">
          <div className="text-4xl mb-4">📋</div>
          <h2 className="text-white text-xl font-semibold mb-2">Plan Not Found</h2>
          <p className="text-slate-400 mb-6">{error || 'This action plan could not be loaded.'}</p>
          <button onClick={() => router.push('/dashboard')} className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 transition font-medium">
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const tasksByMonth = getTasksByMonth()
  const totalXP = getTotalXP()
  const completedCount = getCompletedTasks()
  const totalCount = checklist.items?.length || 0

  return (
    <div className="min-h-screen bg-[#070b14] text-white">
      
      {/* Celebration Overlay */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-emerald-900/90 to-teal-900/90 border border-emerald-500/30 rounded-3xl p-10 text-center scale-in shadow-2xl">
            <div className="text-6xl animate-bounce mb-4">🎉</div>
            <h2 className="text-3xl font-bold text-white mb-2">All Tasks Complete!</h2>
            <p className="text-emerald-300 mb-1">+100 Bonus XP</p>
            <p className="text-slate-400 text-sm">You crushed this month! 🚀</p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-slate-900/50 backdrop-blur-sm border-b border-white/5 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold">Monthly Action Plan</h1>
              <p className="text-slate-400 text-sm">6-Month Career Roadmap</p>
            </div>
            <button onClick={() => router.push('/dashboard')} className="text-slate-400 hover:text-white text-sm transition">
              ← Dashboard
            </button>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-3 text-center">
              <Flame className="w-4 h-4 text-amber-400 mx-auto mb-1" />
              <p className="text-white font-bold text-sm">{streak.daily_streak}</p>
              <p className="text-slate-500 text-[10px]">Day Streak</p>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-3 text-center">
              <Zap className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
              <p className="text-white font-bold text-sm">{totalXP}</p>
              <p className="text-slate-500 text-[10px]">XP Earned</p>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-3 text-center">
              <Check className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
              <p className="text-white font-bold text-sm">{completedCount}/{totalCount}</p>
              <p className="text-slate-500 text-[10px]">Tasks Done</p>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-3 text-center">
              <Trophy className="w-4 h-4 text-blue-400 mx-auto mb-1" />
              <p className="text-white font-bold text-sm">{streak.daily_longest}</p>
              <p className="text-slate-500 text-[10px]">Best Streak</p>
            </div>
          </div>

          {/* Overall Progress */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 bg-white/[0.05] rounded-full h-2.5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${getTotalProgress()}%`,
                  background: getTotalProgress() < 25
                    ? 'linear-gradient(90deg, #ef4444, #f59e0b)'
                    : getTotalProgress() < 50
                      ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                      : getTotalProgress() < 75
                        ? 'linear-gradient(90deg, #10b981, #34d399)'
                        : 'linear-gradient(90deg, #06b6d4, #3b82f6)'
                }}
              />
            </div>
            <span className="text-xs text-slate-400 font-medium min-w-[35px] text-right">{getTotalProgress()}%</span>
          </div>

          {/* Status & Timer */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${
              checklist.status === 'IN_PROGRESS' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
              checklist.status === 'PAUSED' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
              checklist.status === 'COMPLETED' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
              'bg-white/[0.03] text-slate-400 border border-white/[0.05]'
            }`}>
              {checklist.status === 'IN_PROGRESS' ? '⏳ In Progress' :
               checklist.status === 'PAUSED' ? '⏸️ Paused' :
               checklist.status === 'COMPLETED' ? '✅ Completed' :
               '⚪ Not Started'}
            </span>
            {timeLeft && (
              <span className={`text-xs font-medium ${
                timeLeft.includes('⚠️') ? 'text-red-400' :
                timeLeft.includes('⏳') ? 'text-amber-400' :
                'text-slate-400'
              }`}>
                {timeLeft}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Action Buttons */}
      <div className="max-w-3xl mx-auto px-4 py-4">
        {checklist.status === 'NOT_STARTED' && (
          <button onClick={handleStart} className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-2xl hover:opacity-90 transition shadow-xl shadow-emerald-500/20 text-base">
            🚀 Start Your 6-Month Journey
          </button>
        )}
        {(checklist.status === 'IN_PROGRESS' || checklist.status === 'PAUSED') && (
          <button onClick={handlePause} className={`w-full py-4 font-bold rounded-2xl transition text-base ${
            checklist.status === 'PAUSED'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:opacity-90 shadow-xl shadow-emerald-500/20'
              : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90 shadow-xl shadow-amber-500/20'
          }`}>
            {checklist.status === 'PAUSED' ? '▶️ Resume Journey' : '⏸️ Pause Journey'}
          </button>
        )}
      </div>

      {/* Monthly Accordions */}
      <div className="max-w-3xl mx-auto px-4 pb-8 space-y-3">
        {Object.entries(tasksByMonth).map(([monthNum, tasks]) => {
          const progress = getMonthProgress(tasks)
          const isExpanded = expandedMonth === parseInt(monthNum)
          const isLocked = parseInt(monthNum) > 1 && getMonthProgress(tasksByMonth[parseInt(monthNum) - 1] || []) < 100
          
          return (
            <div key={monthNum} className={`rounded-2xl border transition-all duration-300 ${
              isExpanded
                ? 'bg-white/[0.03] border-white/[0.08]'
                : isLocked
                  ? 'bg-white/[0.01] border-white/[0.02] opacity-50'
                  : 'bg-white/[0.01] border-white/[0.04] hover:border-white/[0.08]'
            }`}>
              {/* Month Header */}
              <button
                onClick={() => setExpandedMonth(isExpanded ? null : parseInt(monthNum))}
                disabled={isLocked}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <div className="flex items-center gap-4">
                  {/* Progress Ring */}
                  <div className="relative w-12 h-12 flex-shrink-0">
                    <svg className="w-12 h-12 -rotate-90">
                      <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="3" className="text-white/[0.06]" />
                      <circle
                        cx="24" cy="24" r="20" fill="none"
                        stroke={progress === 100 ? '#10b981' : progress > 0 ? '#f59e0b' : 'transparent'}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray={`${progress * 1.256} 125.6`}
                        className="transition-all duration-700"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                      {progress === 100 ? '✓' : `${progress}%`}
                    </span>
                  </div>
                  
                  <div>
                    <h3 className="text-white font-semibold">{getMonthLabel(parseInt(monthNum))}</h3>
                    <p className="text-slate-500 text-xs mt-0.5">
                      {tasks.filter(t => t.completed).length}/{tasks.length} tasks • 
                      {progress === 100 ? ' Complete' : progress > 0 ? ' In Progress' : ' Not Started'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {isLocked && <Lock className="w-4 h-4 text-slate-600" />}
                  {progress === 100 && <Trophy className="w-5 h-5 text-amber-400" />}
                  {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                </div>
              </button>

              {/* Expanded Tasks */}
              {isExpanded && !isLocked && (
                <div className="px-5 pb-5 space-y-2">
                  {/* Mini progress bar for this month */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex-1 bg-white/[0.05] rounded-full h-1.5 overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="text-[10px] text-slate-500">{progress}%</span>
                  </div>

                  {tasks.map((task, i) => (
                    <div
                      key={i}
                      onClick={() => handleToggle(task._index || i)}
                      className={`flex items-start gap-3 p-4 rounded-xl border transition-all duration-200 ${
                        checklist.status === 'IN_PROGRESS' ? 'cursor-pointer hover:bg-white/[0.04]' : ''
                      } ${
                        task.completed
                          ? 'bg-emerald-500/[0.03] border-emerald-500/10'
                          : 'bg-white/[0.01] border-white/[0.03]'
                      }`}
                    >
                      {/* Checkbox */}
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                        task.completed
                          ? 'bg-emerald-500 border-emerald-500'
                          : 'border-white/[0.15] group-hover:border-white/[0.3]'
                      }`}>
                        {task.completed && (
                          <Check className="w-3.5 h-3.5 text-white" strokeWidth={4} />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${task.completed ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                          {task.task}
                        </p>
                        <div className="flex gap-2 mt-2 flex-wrap">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                          <span className="text-[10px] text-slate-500 bg-white/[0.03] px-2 py-0.5 rounded-full border border-white/[0.04]">
                            {task.category}
                          </span>
                          {task.deadline && (
                            <span className="text-[10px] text-slate-500 bg-white/[0.03] px-2 py-0.5 rounded-full border border-white/[0.04] flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {task.deadline}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* XP Badge */}
                      <div className="flex-shrink-0 flex items-center">
                        {task.completed ? (
                          <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full font-medium">
                            +20 XP
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-600 bg-white/[0.02] px-2 py-1 rounded-full">
                            20 XP
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Bottom Stats */}
      <div className="max-w-3xl mx-auto px-4 pb-10">
        <div className="bg-gradient-to-r from-blue-500/5 via-emerald-500/5 to-purple-500/5 border border-white/[0.04] rounded-2xl p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Star className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Keep Going!</p>
              <p className="text-slate-500 text-xs">
                {completedCount === totalCount 
                  ? 'All tasks complete! 🎉' 
                  : `${totalCount - completedCount} tasks left this month`}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-amber-400 font-bold text-lg">{totalXP} XP</p>
            <p className="text-slate-500 text-[10px]">Total Earned</p>
          </div>
        </div>
      </div>
    </div>
  )
}