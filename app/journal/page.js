'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  BookOpen, Clock, Flame, Sparkles, ChevronLeft, ChevronRight,
  Zap, Smile, Frown, Meh, PartyPopper, Calendar, History, PenLine,
  Brain, Target, TrendingUp, Star
} from 'lucide-react'

export default function JournalPage() {
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [streak, setStreak] = useState({ daily_streak: 0, daily_longest: 0 })
  const [feedback, setFeedback] = useState('')
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  const [pastEntries, setPastEntries] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const [timeUntilTomorrow, setTimeUntilTomorrow] = useState('')
  const [moodMenuOpen, setMoodMenuOpen] = useState(false)

  const today = new Date().toISOString().split('T')[0]
  const todayFormatted = new Date().toLocaleDateString('en-PK', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  const moods = [
    { value: 'excited', label: 'Excited', icon: PartyPopper, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
    { value: 'motivated', label: 'Motivated', icon: Zap, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    { value: 'neutral', label: 'Neutral', icon: Meh, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    { value: 'struggling', label: 'Struggling', icon: Frown, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  ]

  const [form, setForm] = useState({
    entry_date: today,
    what_i_did: '',
    learning_hours: '',
    challenges_faced: '',
    mood: ''
  })

  useEffect(() => { loadData() }, [])

  useEffect(() => {
    function updateTimer() {
      const now = new Date()
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0)
      const diff = tomorrow.getTime() - now.getTime()
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)
      setTimeUntilTomorrow(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`)
    }
    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUser(user)

    const entryRes = await fetch(`/api/journal/get?date=${today}`)
    const entryData = await entryRes.json()
    if (entryData.journal) {
      setForm({
        entry_date: today,
        what_i_did: entryData.journal.what_i_did || '',
        learning_hours: entryData.journal.learning_hours || '',
        challenges_faced: entryData.journal.challenges_faced || '',
        mood: entryData.journal.mood || ''
      })
      setFeedback(entryData.journal.ai_feedback || '')
      setIsSaved(true)
    }

    const streakRes = await fetch('/api/streak/get')
    const streakData = await streakRes.json()
    if (streakRes.ok) setStreak(streakData.streak)

    const pastRes = await fetch('/api/journal/get?limit=14')
    const pastData = await pastRes.json()
    if (pastRes.ok) setPastEntries(pastData.journals || [])

    setLoading(false)
  }

  async function handleSave() {
    if (!form.what_i_did.trim() || isSaved) return
    setSaving(true)

    const res = await fetch('/api/journal/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entry_date: today,
        what_i_did: form.what_i_did,
        learning_hours: parseFloat(form.learning_hours) || 0,
        challenges_faced: form.challenges_faced,
        mood: form.mood
      })
    })

    if (res.ok) {
      setIsSaved(true)
      const data = await res.json()
      const streakRes = await fetch('/api/streak/get')
      const streakData = await streakRes.json()
      if (streakRes.ok) setStreak(streakData.streak)

      setFeedbackLoading(true)
      const feedbackRes = await fetch('/api/journal/ai-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ journal_id: data.journal.journal_id })
      })
      const feedbackData = await feedbackRes.json()
      if (feedbackRes.ok) setFeedback(feedbackData.feedback)
      setFeedbackLoading(false)
    }

    setSaving(false)
  }

  function getMoodData(moodValue) {
    return moods.find(m => m.value === moodValue) || null
  }

  function getWeekStats() {
    const last7Days = pastEntries.filter(e => {
      const entryDate = new Date(e.entry_date)
      const weekAgo = new Date(Date.now() - 7 * 86400000)
      return entryDate >= weekAgo
    })
    const totalHours = last7Days.reduce((sum, e) => sum + (e.learning_hours || 0), 0)
    return { entries: last7Days.length, hours: totalHours }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const weekStats = getWeekStats()
  const currentMood = getMoodData(form.mood)
  const MoodIcon = currentMood?.icon || Smile

  return (
    <div className="min-h-screen bg-[#070b14] text-white">
      
      {/* Header */}
      <header className="bg-slate-900/50 backdrop-blur-sm border-b border-white/5 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/20 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Daily Journal</h1>
                <p className="text-slate-500 text-xs">{todayFormatted}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowHistory(!showHistory)} 
                className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  showHistory 
                    ? 'bg-white/10 text-white' 
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {showHistory ? 'Today' : 'History'}
              </button>
              <button onClick={() => router.push('/dashboard')} className="text-slate-400 hover:text-white text-sm transition">
                ←
              </button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-3 text-center">
              <Flame className="w-4 h-4 text-amber-400 mx-auto mb-1" />
              <p className="text-white font-bold text-sm">{streak.daily_streak}</p>
              <p className="text-slate-500 text-[10px]">Day Streak</p>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-3 text-center">
              <Star className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
              <p className="text-white font-bold text-sm">{streak.daily_longest}</p>
              <p className="text-slate-500 text-[10px]">Best</p>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-3 text-center">
              <Calendar className="w-4 h-4 text-blue-400 mx-auto mb-1" />
              <p className="text-white font-bold text-sm">{weekStats.entries}</p>
              <p className="text-slate-500 text-[10px]">This Week</p>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-3 text-center">
              <Clock className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
              <p className="text-white font-bold text-sm">{weekStats.hours}h</p>
              <p className="text-slate-500 text-[10px]">Learning</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        
        {showHistory ? (
          /* Past Entries */
          <div className="space-y-3 fade-in-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <History className="w-5 h-5 text-slate-400" />
                Past Entries
              </h2>
              <span className="text-slate-500 text-xs">{pastEntries.length} entries</span>
            </div>
            
            {pastEntries.map((entry) => {
              const entryMood = getMoodData(entry.mood)
              const EntryMoodIcon = entryMood?.icon || Smile
              return (
                <div key={entry.journal_id} className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-4 hover:border-white/[0.08] transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <p className="text-slate-400 text-xs font-medium">
                        {new Date(entry.entry_date).toLocaleDateString('en-PK', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {entry.learning_hours > 0 && (
                        <span className="text-emerald-400 text-xs bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          {entry.learning_hours}h
                        </span>
                      )}
                      <div className={`w-7 h-7 rounded-lg ${entryMood?.bg || 'bg-white/5'} flex items-center justify-center`}>
                        <EntryMoodIcon className={`w-4 h-4 ${entryMood?.color || 'text-slate-400'}`} />
                      </div>
                    </div>
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed">{entry.what_i_did?.slice(0, 180)}</p>
                  {entry.ai_feedback && (
                    <div className="mt-3 pt-3 border-t border-white/[0.03]">
                      <p className="text-slate-500 text-xs italic leading-relaxed">"{entry.ai_feedback?.slice(0, 120)}..."</p>
                    </div>
                  )}
                </div>
              )
            })}
            {pastEntries.length === 0 && (
              <div className="text-center py-16">
                <PenLine className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-500">No entries yet.</p>
                <p className="text-slate-600 text-sm mt-1">Write your first journal today!</p>
              </div>
            )}
          </div>
        ) : (
          /* Today's Entry */
          <div className="fade-in-up">
            
            {/* Main Entry Card */}
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6 mb-4">
              <label className="flex items-center gap-2 text-slate-400 text-sm font-medium mb-3">
                <Brain className="w-4 h-4 text-purple-400" />
                What did you do today toward your career goal?
              </label>
              <textarea
                value={form.what_i_did}
                onChange={(e) => setForm({ ...form, what_i_did: e.target.value })}
                placeholder="E.g., Completed Python module 3, applied to 2 jobs on LinkedIn, researched UET admissions, practiced communication skills..."
                rows={5}
                disabled={isSaved}
                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-white placeholder-slate-600 text-sm outline-none focus:border-blue-500/50 focus:bg-white/[0.04] transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Learning Hours + Mood */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Learning Hours */}
              <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5">
                <label className="flex items-center gap-2 text-slate-400 text-sm font-medium mb-3">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  Learning Hours
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={form.learning_hours}
                    onChange={(e) => setForm({ ...form, learning_hours: e.target.value })}
                    placeholder="0"
                    min="0" max="24" step="0.5"
                    disabled={isSaved}
                    className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-white placeholder-slate-600 text-lg font-bold text-center outline-none focus:border-emerald-500/50 transition-all disabled:opacity-50"
                  />
                  <span className="block text-slate-600 text-[10px] text-center mt-1">hours today</span>
                </div>
              </div>

              {/* Mood Picker */}
              <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5">
                <label className="flex items-center gap-2 text-slate-400 text-sm font-medium mb-3">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Today's Mood
                </label>
                {isSaved ? (
                  <div className={`flex items-center justify-center gap-2 p-3 rounded-xl ${currentMood?.bg || 'bg-white/5'}`}>
                    <MoodIcon className={`w-5 h-5 ${currentMood?.color || 'text-slate-400'}`} />
                    <span className={`text-sm font-medium ${currentMood?.color || 'text-slate-400'}`}>
                      {currentMood?.label || 'Not set'}
                    </span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-1.5">
                    {moods.map((mood) => {
                      const Icon = mood.icon
                      return (
                        <button
                          key={mood.value}
                          type="button"
                          onClick={() => setForm({ ...form, mood: mood.value })}
                          className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl transition-all text-xs font-medium ${
                            form.mood === mood.value
                              ? `${mood.bg} border ${mood.border} ${mood.color}`
                              : 'bg-white/[0.02] border border-transparent text-slate-500 hover:bg-white/[0.05] hover:text-slate-300'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {mood.label}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Challenges */}
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5 mb-5">
              <label className="flex items-center gap-2 text-slate-400 text-sm font-medium mb-3">
                <Target className="w-4 h-4 text-red-400" />
                Any challenges today?
              </label>
              <input
                type="text"
                value={form.challenges_faced}
                onChange={(e) => setForm({ ...form, challenges_faced: e.target.value })}
                placeholder="E.g., Couldn't focus, internet down, family commitments, felt unmotivated..."
                disabled={isSaved}
                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-white placeholder-slate-600 text-sm outline-none focus:border-red-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Save Button */}
            {isSaved ? (
              <div className="bg-gradient-to-r from-emerald-900/20 to-teal-900/20 border border-emerald-500/20 rounded-2xl p-5 mb-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                  <p className="text-emerald-400 font-semibold">Entry Saved</p>
                </div>
                <p className="text-slate-400 text-sm">
                  Next journal available in{' '}
                  <span className="text-white font-mono font-bold">{timeUntilTomorrow}</span>
                </p>
              </div>
            ) : (
              <button
                onClick={handleSave}
                disabled={saving || !form.what_i_did.trim()}
                className="w-full py-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-bold rounded-2xl hover:opacity-90 transition-all duration-300 shadow-xl shadow-purple-500/20 hover:shadow-2xl hover:shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed mb-6 text-base"
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : (
                  'Save Entry'
                )}
              </button>
            )}

            {/* AI Feedback */}
            {(feedback || feedbackLoading) && (
              <div className="bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-pink-900/20 border border-blue-500/20 rounded-2xl p-6 mb-6 fade-in-up">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/20 flex items-center justify-center">
                    <Brain className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-blue-400 font-semibold text-sm">CareerMate AI</h3>
                    <p className="text-slate-500 text-xs">Personalized feedback on your entry</p>
                  </div>
                </div>
                {feedbackLoading ? (
                  <div className="flex items-center gap-3 py-2">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-400 text-sm">Analyzing your entry...</p>
                  </div>
                ) : (
                  <p className="text-slate-200 text-sm leading-relaxed">{feedback}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}