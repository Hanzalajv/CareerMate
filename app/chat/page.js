'use client'
import { useState, useEffect, useRef } from 'react'
import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ChatPage() {
    const supabase = createClient()
    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState(null)
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [error, setError] = useState('')
    const messagesEndRef = useRef(null)
    const router = useRouter()

    useEffect(() => {
        getCurrentUser().then(async u => {
            if (!u) {
                router.push('/login')
                return
            }
            setUser(u)

            // Get user profile
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', u.id)
                .single()

            if (error || !data) {
                router.push('/setup-profile')
                return
            }

            setProfile(data)

            // If onboarding not completed, redirect
            if (!data.onboarding_completed) {
                router.push('/onboarding')
                return
            }

            // ✅ FIX: Load saved chat history from database
            if (data.chat_history && data.chat_history.length > 0) {
                // Chat history is stored as array of {role, content, timestamp}
                setMessages(data.chat_history)
            } else {
                // Only show greeting if NO chat history exists
                const greeting = {
                    role: 'assistant',
                    content: `Hi ${data.display_name}! 👋 I'm your CareerMate AI coach. Ask me anything about your career path, skills, or next steps.`
                }
                setMessages([greeting])
                
                // Save greeting to database
                await supabase
                    .from('user_profiles')
                    .update({ chat_history: [greeting] })
                    .eq('user_id', u.id)
            }

            setLoading(false)
        })
    }, [])

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const sendMessage = async () => {
        if (!input.trim() || sending) return

        const userMessage = { 
            role: 'user', 
            content: input.trim(),
            timestamp: new Date().toISOString()
        }
        
        const updatedMessages = [...messages, userMessage]
        setMessages(updatedMessages)
        setInput('')
        setSending(true)
        setError('')

        try {
            // Send to API with profile context
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: updatedMessages,
                    profile: profile
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to get response')
            }

            const assistantMessage = { 
                role: 'assistant', 
                content: data.response,
                timestamp: new Date().toISOString()
            }
            
            const finalMessages = [...updatedMessages, assistantMessage]
            setMessages(finalMessages)

            // ✅ FIX: Save entire chat history to database
            await supabase
                .from('user_profiles')
                .update({ chat_history: finalMessages })
                .eq('user_id', user.id)

        } catch (err) {
            setError(err.message || 'Something went wrong. Please try again.')
            // Remove the user message if failed
            setMessages(prev => prev.slice(0, -1))
        } finally {
            setSending(false)
        }
    }

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    }

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(160deg, #0F172A 0%, #1E293B 50%, #0F766E 100%)'
            }}>
                <p style={{ color: 'white' }}>Loading chat...</p>
            </div>
        )
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            background: 'linear-gradient(160deg, #0F172A 0%, #1E293B 50%, #0F766E 100%)',
            color: 'white'
        }}>
            {/* Header */}
            <div style={{
                padding: '16px 24px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(0,0,0,0.2)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 28 }}>{profile?.avatar || '🧭'}</span>
                    <div>
                        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Career Coach</h1>
                        <p style={{ color: '#94A3B8', fontSize: 13 }}>AI-powered career guidance</p>
                    </div>
                </div>
                <Link href="/dashboard" style={{
                    color: '#94A3B8',
                    textDecoration: 'none',
                    padding: '8px 16px',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.05)',
                    fontSize: 14
                }}>
                    ← Dashboard
                </Link>
            </div>

            {/* Messages */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: 16
            }}>
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        style={{
                            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                            maxWidth: '80%',
                            background: msg.role === 'user'
                                ? 'rgba(16,185,129,0.2)'
                                : 'rgba(255,255,255,0.05)',
                            padding: '12px 18px',
                            borderRadius: msg.role === 'user'
                                ? '18px 18px 4px 18px'
                                : '18px 18px 18px 4px',
                            border: msg.role === 'user'
                                ? '1px solid rgba(16,185,129,0.2)'
                                : '1px solid rgba(255,255,255,0.06)'
                        }}
                    >
                        <div style={{
                            fontSize: 12,
                            color: '#64748B',
                            marginBottom: 4
                        }}>
                            {msg.role === 'user' ? 'You' : 'CareerMate AI'}
                        </div>
                        <div style={{
                            fontSize: 15,
                            lineHeight: 1.6,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word'
                        }}>
                            {msg.content}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />

                {sending && (
                    <div style={{
                        alignSelf: 'flex-start',
                        background: 'rgba(255,255,255,0.05)',
                        padding: '12px 18px',
                        borderRadius: '18px 18px 18px 4px',
                        border: '1px solid rgba(255,255,255,0.06)'
                    }}>
                        <div style={{ fontSize: 12, color: '#64748B', marginBottom: 4 }}>
                            CareerMate AI
                        </div>
                        <div style={{ fontSize: 15, color: '#94A3B8' }}>
                            Thinking...
                        </div>
                    </div>
                )}

                {error && (
                    <div style={{
                        alignSelf: 'center',
                        color: '#EF4444',
                        fontSize: 13,
                        padding: '8px 16px',
                        background: 'rgba(239,68,68,0.1)',
                        borderRadius: 8
                    }}>
                        {error}
                    </div>
                )}
            </div>

            {/* Input */}
            <div style={{
                padding: '16px 24px',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(0,0,0,0.2)'
            }}>
                <div style={{
                    display: 'flex',
                    gap: 12,
                    maxWidth: 800,
                    margin: '0 auto'
                }}>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Ask about your career path, skills, or next steps..."
                        rows={1}
                        style={{
                            flex: 1,
                            padding: '12px 16px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 12,
                            color: 'white',
                            fontSize: 15,
                            outline: 'none',
                            resize: 'none',
                            fontFamily: 'inherit'
                        }}
                        onFocus={e => e.target.style.borderColor = '#10B981'}
                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                    />
                    <button
                        onClick={sendMessage}
                        disabled={!input.trim() || sending}
                        style={{
                            padding: '12px 24px',
                            background: !input.trim() || sending ? '#0F766E' : '#10B981',
                            border: 'none',
                            borderRadius: 12,
                            color: 'white',
                            fontSize: 15,
                            fontWeight: 600,
                            cursor: !input.trim() || sending ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    )
}