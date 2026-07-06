'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  Compass, Send, ArrowLeft, Target, Brain, 
  Sparkles, X, Sun, Moon, Palette, Check
} from 'lucide-react'

// Theme presets
const AI_COLORS = [
  { name: 'Emerald', bg: 'bg-emerald-500/10', border: 'border-emerald-500/10', text: 'text-slate-200', avatarBg: 'bg-emerald-500/10', avatarBorder: 'border-emerald-500/20', avatarIcon: 'text-emerald-400', dot: 'bg-emerald-500' },
  { name: 'Blue', bg: 'bg-blue-500/10', border: 'border-blue-500/10', text: 'text-slate-200', avatarBg: 'bg-blue-500/10', avatarBorder: 'border-blue-500/20', avatarIcon: 'text-blue-400', dot: 'bg-blue-500' },
  { name: 'Purple', bg: 'bg-purple-500/10', border: 'border-purple-500/10', text: 'text-slate-200', avatarBg: 'bg-purple-500/10', avatarBorder: 'border-purple-500/20', avatarIcon: 'text-purple-400', dot: 'bg-purple-500' },
  { name: 'Amber', bg: 'bg-amber-500/10', border: 'border-amber-500/10', text: 'text-slate-200', avatarBg: 'bg-amber-500/10', avatarBorder: 'border-amber-500/20', avatarIcon: 'text-amber-400', dot: 'bg-amber-500' },
  { name: 'Rose', bg: 'bg-rose-500/10', border: 'border-rose-500/10', text: 'text-slate-200', avatarBg: 'bg-rose-500/10', avatarBorder: 'border-rose-500/20', avatarIcon: 'text-rose-400', dot: 'bg-rose-500' },
]

const USER_COLORS = [
  { name: 'Blue', bg: 'bg-blue-500/10', border: 'border-blue-500/10', avatarBg: 'bg-blue-500/10', avatarBorder: 'border-blue-500/20', avatarText: 'text-blue-400', dot: 'bg-blue-500' },
  { name: 'Emerald', bg: 'bg-emerald-500/10', border: 'border-emerald-500/10', avatarBg: 'bg-emerald-500/10', avatarBorder: 'border-emerald-500/20', avatarText: 'text-emerald-400', dot: 'bg-emerald-500' },
  { name: 'Purple', bg: 'bg-purple-500/10', border: 'border-purple-500/10', avatarBg: 'bg-purple-500/10', avatarBorder: 'border-purple-500/20', avatarText: 'text-purple-400', dot: 'bg-purple-500' },
  { name: 'Cyan', bg: 'bg-cyan-500/10', border: 'border-cyan-500/10', avatarBg: 'bg-cyan-500/10', avatarBorder: 'border-cyan-500/20', avatarText: 'text-cyan-400', dot: 'bg-cyan-500' },
  { name: 'Orange', bg: 'bg-orange-500/10', border: 'border-orange-500/10', avatarBg: 'bg-orange-500/10', avatarBorder: 'border-orange-500/20', avatarText: 'text-orange-400', dot: 'bg-orange-500' },
]

export default function DeepDivePage() {
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState(null)
  const [sessionId, setSessionId] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [resumed, setResumed] = useState(false)
  const [questionNumber, setQuestionNumber] = useState(0)
  const [categoryProgress, setCategoryProgress] = useState([])
  const [sessionsRemaining, setSessionsRemaining] = useState(null)
  const [error, setError] = useState(null)
  const [complete, setComplete] = useState(false)
  
  const [showStats, setShowStats] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  // Theme & Colors
  const [theme, setTheme] = useState('dark')
  const [aiColorIndex, setAiColorIndex] = useState(0)
  const [userColorIndex, setUserColorIndex] = useState(0)

  const chatEndRef = useRef(null)
  const inputRef = useRef(null)

  // Load preferences
  useEffect(() => {
    const saved = {
      theme: localStorage.getItem('careermate-theme') || 'dark',
      aiColor: parseInt(localStorage.getItem('careermate-ai-color') || '0'),
      userColor: parseInt(localStorage.getItem('careermate-user-color') || '0'),
    }
    setTheme(saved.theme)
    setAiColorIndex(saved.aiColor)
    setUserColorIndex(saved.userColor)
  }, [])

  // Apply theme
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'light') root.classList.remove('dark')
    else root.classList.add('dark')
    localStorage.setItem('careermate-theme', theme)
  }, [theme])

  // Save colors
  useEffect(() => {
    localStorage.setItem('careermate-ai-color', aiColorIndex)
  }, [aiColorIndex])

  useEffect(() => {
    localStorage.setItem('careermate-user-color', userColorIndex)
  }, [userColorIndex])

  useEffect(() => { checkAuth() }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!loading && !sending && !complete) inputRef.current?.focus()
  }, [loading, sending, complete])

  const currentAiColor = AI_COLORS[aiColorIndex]
  const currentUserColor = USER_COLORS[userColorIndex]

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUser(user)
    await startOrResumeSession(user)
  }

async function startOrResumeSession(user) {
    try {
      setLoading(true); setError(null)
      const response = await fetch('/api/deep-dive/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      })
      const data = await response.json()
      if (!response.ok) { setError(data.error || 'Failed to start session'); setLoading(false); return }

      setSessionId(data.session_id)
      setQuestionNumber(data.question_number)
      setResumed(data.resumed)
      setSessionsRemaining(data.sessions_remaining)

      // If resuming, load full chat history
      if (data.resumed) {
        try {
          const sessionRes = await fetch(`/api/deep-dive/session?session_id=${data.session_id}`)
          const sessionData = await sessionRes.json()
          
          if (sessionData.session?.questions_answers && sessionData.session.questions_answers.length > 0) {
            const history = []
            sessionData.session.questions_answers.forEach(qa => {
              if (qa.question && qa.question !== 'Question') {
                history.push({ role: 'assistant', content: qa.question })
              }
              if (qa.answer) {
                history.push({ role: 'user', content: qa.answer })
              }
            })
            // Add the new question
            history.push({ role: 'assistant', content: data.question })
            setMessages(history)
          } else {
            setMessages([{ role: 'assistant', content: data.question }])
          }
        } catch (err) {
          setMessages([{ role: 'assistant', content: data.question }])
        }
      } else {
        // New session — just show first question
        setMessages([{ role: 'assistant', content: data.question }])
      }

      setLoading(false)
    } catch (err) {
      setError('Failed to connect.'); setLoading(false)
    }
  }

  

  async function handleSend() {
    const trimmed = input.trim()
    if (!trimmed || sending || complete) return
    const userMessage = trimmed; setInput(''); setSending(true)
    const updatedMessages = [...messages, { role: 'user', content: userMessage }]
    setMessages(updatedMessages)

    try {
      const response = await fetch('/api/deep-dive/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, answer: userMessage })
      })
      const data = await response.json()

      if (!response.ok) {
        setMessages([...updatedMessages, { role: 'assistant', content: data.error || 'Something went wrong.' }])
        setSending(false); return
      }

      if (data.complete) {
        setComplete(true)
        setMessages([...updatedMessages, { role: 'assistant', content: data.message || 'Report ready!' }])
        setTimeout(() => router.push(`/report/${sessionId}`), 2000)
      } else {
        setQuestionNumber(data.question_number)
        setCategoryProgress(data.category_progress || [])
        setMessages([...updatedMessages, { role: 'assistant', content: data.question }])
        const progressMatch = data.question?.match(/\[Progress:\s*(\d+)\/20\]/)
        if (progressMatch) setProgressCount(parseInt(progressMatch[1]))
      }
      setSending(false)
    } catch (err) {
      setMessages([...updatedMessages, { role: 'assistant', content: 'Connection error.' }])
      setSending(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  // Background classes based on theme
  const bgClass = theme === 'light' ? 'bg-white' : 'bg-[#070b14]'
  const headerBg = theme === 'light' ? 'bg-white/80' : 'bg-[#070b14]/80'
  const textClass = theme === 'light' ? 'text-slate-800' : 'text-white'
  const subtextClass = theme === 'light' ? 'text-slate-500' : 'text-slate-400'
  const borderClass = theme === 'light' ? 'border-slate-200' : 'border-white/[0.04]'
  const inputBg = theme === 'light' ? 'bg-slate-100' : 'bg-white/[0.03]'
  const inputBorder = theme === 'light' ? 'border-slate-200' : 'border-white/[0.06]'

  if (loading) {
    return (
      <div className={`min-h-screen ${bgClass} flex items-center justify-center`}>
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className={`${subtextClass} text-sm`}>Starting your Career Deep Dive...</p>
        </div>
      </div>
    )
  }

  if (error && !sessionId) {
    return (
      <div className={`min-h-screen ${bgClass} flex items-center justify-center`}>
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-400" />
          </div>
          <h2 className={`${textClass} text-lg font-semibold mb-2`}>Session Unavailable</h2>
          <p className={`${subtextClass} text-sm mb-6`}>{error}</p>
          <button onClick={() => router.push('/dashboard')} className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 transition text-sm font-medium">
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${bgClass} flex flex-col transition-colors duration-300`}>
      
      {/* Header */}
      <header className={`flex-shrink-0 ${headerBg} backdrop-blur-xl border-b ${borderClass} px-4 py-3`}>
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/dashboard')} className={`${subtextClass} hover:text-white transition`}>
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${currentAiColor.avatarBg} ${currentAiColor.avatarBorder} flex items-center justify-center`}>
                  <Compass className={`w-4 h-4 ${currentAiColor.avatarIcon}`} />
                </div>
                <h1 className={`${textClass} font-semibold text-sm`}>Career Deep Dive</h1>
              </div>
              <p className={`${subtextClass} text-xs ml-9`}>
  {complete ? 'Session Complete' : `Question ${questionNumber - 1}/20 answered`}
</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {sessionsRemaining !== null && (
              <span className="text-[10px] bg-white/[0.04] text-slate-400 px-2 py-1 rounded-full border border-white/[0.06]">
                {sessionsRemaining} left
              </span>
            )}
            {resumed && (
              <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-1 rounded-full border border-amber-500/20">
                Resumed
              </span>
            )}
            <button onClick={() => setShowStats(!showStats)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${showStats ? 'bg-white/10 text-white' : `${subtextClass} hover:text-white hover:bg-white/[0.04]`}`}>
              <Target className="w-4 h-4" />
            </button>
            <button onClick={() => setShowSettings(!showSettings)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${showSettings ? 'bg-white/10 text-white' : `${subtextClass} hover:text-white hover:bg-white/[0.04]`}`}>
              <Palette className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="max-w-3xl mx-auto mt-3 flex items-center gap-3">
          <div className="flex-1 bg-white/[0.04] rounded-full h-1.5 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700 ease-out" style={{
  width: `${Math.round(((questionNumber - 1) / 20) * 100)}%`,
  background: (questionNumber - 1) < 6 ? 'linear-gradient(90deg, #ef4444, #f59e0b)' : 
              (questionNumber - 1) < 12 ? 'linear-gradient(90deg, #f59e0b, #10b981)' : 
              'linear-gradient(90deg, #10b981, #06b6d4)'
}} />
          </div>
          <span className="text-[10px] text-slate-500 font-medium min-w-[32px] text-right">{Math.round(((questionNumber - 1) / 20) * 100)}%</span>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="max-w-3xl mx-auto mt-4 p-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl space-y-4">
            {/* Theme */}
            <div>
              <p className="text-slate-400 text-[10px] uppercase tracking-wider mb-2">Theme</p>
              <div className="flex gap-2">
                {[
                  { value: 'dark', icon: Moon, label: 'Dark' },
                  { value: 'light', icon: Sun, label: 'Light' },
                ].map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setTheme(t.value)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition ${
                      theme === t.value ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <t.icon className="w-3.5 h-3.5" /> {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Response Color */}
            <div>
              <p className="text-slate-400 text-[10px] uppercase tracking-wider mb-2">AI Message Color</p>
              <div className="flex gap-2">
                {AI_COLORS.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => setAiColorIndex(i)}
                    className={`w-8 h-8 rounded-xl border-2 transition-all ${c.dot} ${
                      aiColorIndex === i ? 'border-white scale-110' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            {/* User Response Color */}
            <div>
              <p className="text-slate-400 text-[10px] uppercase tracking-wider mb-2">Your Message Color</p>
              <div className="flex gap-2">
                {USER_COLORS.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => setUserColorIndex(i)}
                    className={`w-8 h-8 rounded-xl border-2 transition-all ${c.dot} ${
                      userColorIndex === i ? 'border-white scale-110' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Category Chips */}
        {showStats && categoryProgress.length > 0 && (
          <div className="max-w-3xl mx-auto mt-3 flex gap-1.5 flex-wrap">
            {categoryProgress.map((cat) => (
              <div key={cat.category} className={`text-[10px] px-2 py-1 rounded-full border ${
                cat.complete ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-white/[0.02] text-slate-500 border-white/[0.05]'
              }`}>
                {cat.category} {cat.complete ? '✓' : `${cat.asked}/${cat.required}`}
              </div>
            ))}
          </div>
        )}
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          {messages.length === 0 && !sending && (
            <div className="text-center py-20">
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${currentAiColor.avatarBg} ${currentAiColor.avatarBorder} flex items-center justify-center mx-auto mb-4`}>
                <Brain className={`w-8 h-8 ${currentAiColor.avatarIcon}`} />
              </div>
              <p className={`${subtextClass} text-sm`}>Starting your deep dive...</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                msg.role === 'user' ? `${currentUserColor.avatarBg} ${currentUserColor.avatarBorder}` : `${currentAiColor.avatarBg} ${currentAiColor.avatarBorder}`
              }`}>
                {msg.role === 'user' ? (
                  <span className={`text-sm font-bold ${currentUserColor.avatarText}`}>Y</span>
                ) : (
                  <Compass className={`w-4 h-4 ${currentAiColor.avatarIcon}`} />
                )}
              </div>

              <div className="group max-w-[75%]">
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? `${currentUserColor.bg} ${currentUserColor.border} text-slate-200 rounded-br-md`
                    : `${currentAiColor.bg} ${currentAiColor.border} ${currentAiColor.text} rounded-bl-md`
                }`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            </div>
          ))}

         {sending && (
  <div className="flex gap-3">
    <div className={`w-8 h-8 rounded-xl ${currentAiColor.avatarBg} ${currentAiColor.avatarBorder} flex items-center justify-center flex-shrink-0`}>
      <Compass className={`w-4 h-4 ${currentAiColor.avatarIcon}`} />
    </div>
    <div className={`${currentAiColor.bg} ${currentAiColor.border} rounded-2xl rounded-bl-md px-4 py-3`}>
      <ThinkingIndicator questionNumber={questionNumber} />
    </div>
  </div>
)}

          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Input Area */}
      {!complete && (
        <div className={`flex-shrink-0 border-t ${borderClass} ${headerBg} backdrop-blur-xl px-4 py-4`}>
          <div className="max-w-3xl mx-auto flex gap-3">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your answer..."
                disabled={sending}
                className={`w-full ${inputBg} border ${inputBorder} rounded-2xl px-4 py-3.5 text-white placeholder-slate-500 text-sm outline-none focus:border-emerald-500/50 focus:bg-white/[0.05] transition-all disabled:opacity-50`}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={sending || !input.trim()}
              className={`w-11 h-11 bg-gradient-to-br ${currentUserColor.dot} rounded-2xl flex items-center justify-center hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 shadow-lg`}
            >
                <Send className="w-5 h-5 text-white" />
            </button>
          </div>
          <p className="text-slate-600 text-[10px] text-center mt-3">
            Press Enter to send • Be honest and detailed
          </p>
        </div>
      )}

      {/* Complete State */}
      {complete && (
        <div className="flex-shrink-0 border-t border-emerald-500/10 bg-emerald-500/[0.02] px-4 py-5">
          <div className="max-w-3xl mx-auto text-center">
            <Sparkles className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
            <p className="text-emerald-400 font-medium text-sm">Analysis Complete!</p>
            <p className="text-slate-500 text-xs mt-1">Redirecting to your report...</p>
          </div>
        </div>
      )}

    </div>
  )
}

function ThinkingIndicator({ questionNumber }) {
  const messages = [
    'Reading your response...',
    'Analyzing your answer...',
    'Connecting the dots...',
    'Forming next question...',
    'Checking your profile...',
    'Cross-referencing...',
    'Almost there...'
  ]
  
  const [messageIndex, setMessageIndex] = useState(0)
  
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % messages.length)
    }, 2000)
    return () => clearInterval(interval)
  }, [])
  
  return (
    <div>
      <div className="flex gap-1.5 mb-2">
        <span className="w-2 h-2 rounded-full animate-bounce bg-emerald-500/60" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 rounded-full animate-bounce bg-emerald-500/60" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 rounded-full animate-bounce bg-emerald-500/60" style={{ animationDelay: '300ms' }} />
      </div>
      <p className="text-xs text-slate-500 animate-pulse">
        {messages[messageIndex]}
      </p>
    </div>
  )
}