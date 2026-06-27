'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'



export default function DeepDivePage() {
  const router = useRouter()
  const supabase =  createClient()

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
  const [progressCount, setProgressCount] = useState(0)

  const chatEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!loading && !sending && !complete) {
      inputRef.current?.focus()
    }
  }, [loading, sending, complete])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    setUser(user)
    await startOrResumeSession(user)
  }
async function startOrResumeSession(user) {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/deep-dive/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to start session')
        setLoading(false)
        return
      }

      setSessionId(data.session_id)
      setQuestionNumber(data.question_number)
      setResumed(data.resumed)
      setSessionsRemaining(data.sessions_remaining)
      
      if (data.category_progress) {
        setCategoryProgress(data.category_progress)
      }

      // Build the first message
      const firstMessageContent = data.resumed
        ? `Welcome back! Let's continue your Career Deep Dive.\n\n${data.question}`
        : `Let's begin your Career Deep Dive. I'll ask you some questions to understand your situation better and find the best career path for you.\n\n${data.question}`

      const firstMessage = { role: 'assistant', content: firstMessageContent }
      setMessages([firstMessage])

      // Extract progress from AI's response
      const progressMatch = data.question?.match(/\[Progress:\s*(\d+)\/20\]/)
      if (progressMatch) {
        setProgressCount(parseInt(progressMatch[1]))
      } else {
        setProgressCount(data.total_answered || 0)
      }

      setLoading(false)
    } catch (err) {
      setError('Failed to connect. Please try again.')
      setLoading(false)
    }
  }

function extractProgressFromMessage(message) {
  if (!message) return null
  const match = message.match(/\[Progress:\s*(\d+)\/20\]/)
  if (match) {
    return parseInt(match[1])
  }
  return null
}

function calculateProgressPercent(count) {
  return Math.min(Math.round((count / 20) * 100), 100)
}
async function handleSend() {
    const trimmed = input.trim()
    if (!trimmed || sending || complete) return

    const userMessage = trimmed
    setInput('')
    setSending(true)

    // Add user message to chat
    const updatedMessages = [...messages, { role: 'user', content: userMessage }]
    setMessages(updatedMessages)

    try {
      const response = await fetch('/api/deep-dive/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          answer: userMessage
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setMessages([...updatedMessages, {
          role: 'assistant',
          content: data.error || 'Something went wrong. Please try again.'
        }])
        setSending(false)
        return
      }

      if (data.complete) {
        // Session complete
        setComplete(true)
        setMessages([...updatedMessages, {
          role: 'assistant',
          content: data.message || 'Your Career Deep Dive report is ready!'
        }])
        
        // Redirect to report after short delay
        setTimeout(() => {
          router.push(`/report/${sessionId}`)
        }, 2000)
      } else {
        // Next question
        setQuestionNumber(data.question_number)
        setCategoryProgress(data.category_progress || [])
        
        const aiMessage = { role: 'assistant', content: data.question }
        setMessages([...updatedMessages, aiMessage])
        
        // Extract progress from AI response
        const progressMatch = data.question?.match(/\[Progress:\s*(\d+)\/20\]/)
        if (progressMatch) {
          setProgressCount(parseInt(progressMatch[1]))
        }
      }

      setSending(false)
    } catch (err) {
      setMessages([...updatedMessages, {
        role: 'assistant',
        content: 'Connection error. Please check your internet and try again.'
      }])
      setSending(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Starting your Career Deep Dive...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error && !sessionId) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-4xl mb-4">😔</div>
          <h2 className="text-white text-xl font-semibold mb-2">Session Unavailable</h2>
          <p className="text-slate-400 mb-6">{error}</p>
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
    <div className="min-h-screen bg-slate-900 flex flex-col">
    {/* Header */}
<header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700">
  <div className="max-w-3xl mx-auto px-4 py-3">
    <div className="flex items-center justify-between mb-2">
      <div>
        <h1 className="text-white font-semibold">Career Deep Dive</h1>
        <p className="text-slate-400 text-sm">
          {complete ? 'Session Complete' : `${progressCount}/20 Meaningful Answers`}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {sessionsRemaining !== null && (
          <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded-full">
            {sessionsRemaining} session{sessionsRemaining !== 1 ? 's' : ''} left this week
          </span>
        )}
        {resumed && (
          <span className="text-xs bg-amber-900/50 text-amber-400 px-2 py-1 rounded-full">
            Resumed
          </span>
        )}
      </div>
    </div>

    {/* Progress Bar */}
    <div className="flex items-center gap-3">
      <div className="flex-1 bg-slate-700 rounded-full h-2.5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${calculateProgressPercent(progressCount)}%`,
            background: progressCount < 6
              ? 'linear-gradient(90deg, #ef4444, #f59e0b)'
              : progressCount < 12
                ? 'linear-gradient(90deg, #f59e0b, #10b981)'
                : 'linear-gradient(90deg, #10b981, #06b6d4)'
          }}
        />
      </div>
      <span className="text-xs text-slate-400 font-medium min-w-[40px] text-right">
        {calculateProgressPercent(progressCount)}%
      </span>
    </div>
  </div>
</header>

      {/* Category Progress Bar */}
      {categoryProgress.length > 0 && !complete && (
        <div className="bg-slate-800/30 border-b border-slate-700/50 px-4 py-2">
          <div className="max-w-3xl mx-auto flex gap-1.5 flex-wrap">
            {categoryProgress.map((cat) => (
              <div
                key={cat.category}
                className={`text-xs px-2 py-0.5 rounded-full ${
                  cat.complete
                    ? 'bg-emerald-900/50 text-emerald-400'
                    : 'bg-slate-700 text-slate-400'
                }`}
                title={`${cat.category}: ${cat.asked}/${cat.required}`}
              >
                {cat.category} {cat.complete ? '✓' : `${cat.asked}/${cat.required}`}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-slate-200'
                }`}
              >
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex justify-start">
              <div className="bg-slate-800 rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Input Area */}
      {!complete && (
        <div className="border-t border-slate-700 bg-slate-800/50 backdrop-blur-sm px-4 py-3">
          <div className="max-w-3xl mx-auto flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your answer..."
              disabled={sending}
              className="flex-1 bg-slate-700 text-white placeholder-slate-400 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 text-sm"
            />
            <button
              onClick={handleSend}
              disabled={sending || !input.trim()}
              className="bg-emerald-600 text-white px-5 py-3 rounded-xl hover:bg-emerald-500 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
            >
              {sending ? '...' : 'Send'}
            </button>
          </div>
          <p className="text-slate-500 text-xs text-center mt-2">
            Press Enter to send • Be honest and detailed for the best guidance
          </p>
        </div>
      )}

      {/* Complete State */}
      {complete && (
        <div className="border-t border-emerald-700/50 bg-emerald-900/20 px-4 py-4">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-emerald-400 font-medium mb-1">Analysis Complete!</p>
            <p className="text-slate-400 text-sm">Redirecting to your report...</p>
          </div>
        </div>
      )}
    </div>
  )
}