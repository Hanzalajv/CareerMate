'use client'
import { useState, useEffect } from 'react'
import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const ONBOARDING_QUESTIONS = [
    {
        id: 1,
        question: "What subjects do you genuinely enjoy studying?",
        description: "Think about what you'd read about in your free time."
    },
    {
        id: 2,
        question: "What are your top 3 skills?",
        description: "What are you naturally good at?"
    },
    {
        id: 3,
        question: "What kind of work environment do you prefer?",
        description: "Do you like working alone, in teams, or a mix?"
    },
    {
        id: 4,
        question: "What are your biggest fears about your career?",
        description: "Be honest — we all have them."
    },
    {
        id: 5,
        question: "What does your family expect from you?",
        description: "Understanding your support system helps us give better advice."
    },
    {
        id: 6,
        question: "What's the job market like in your city?",
        description: "What industries are growing where you live?"
    },
    {
        id: 7,
        question: "What are your financial goals?",
        description: "What lifestyle do you want to achieve?"
    },
    {
        id: 8,
        question: "What motivates you to work?",
        description: "Money, purpose, recognition, impact, freedom?"
    }
]

export default function OnboardingPage() {
    const supabase = createClient()
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [currentQuestion, setCurrentQuestion] = useState(0)
    const [answers, setAnswers] = useState([])
    const [currentAnswer, setCurrentAnswer] = useState('')
    const [isComplete, setIsComplete] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()

    useEffect(() => {
        getCurrentUser().then(async u => {
            // 1. Check if user is logged in
            if (!u) {
                router.push('/login')
                return
            }
            setUser(u)

            try {
                // 2. Check if profile exists
                const { data: profile, error: profileError } = await supabase
                    .from('user_profiles')
                    .select('is_complete, onboarding_completed, display_name, avatar, education, interests, skills, location, preferences')
                    .eq('user_id', u.id)
                    .single()

                // 3. If profile doesn't exist → redirect to setup
                if (profileError || !profile) {
                    console.log('No profile found. Redirecting to setup...')
                    router.push('/setup-profile')
                    return
                }

                // 4. If profile exists but is NOT complete → redirect to setup
                if (!profile.is_complete) {
                    console.log('Profile is incomplete. Redirecting to setup...')
                    router.push('/setup-profile')
                    return
                }

                // 5. If profile exists and is complete but onboarding is already done → dashboard
                if (profile.onboarding_completed) {
                    console.log('Onboarding already completed. Redirecting to dashboard...')
                    router.push('/dashboard')
                    return
                }

                // 6. All good → show onboarding questions
                console.log('Profile complete. Showing onboarding questions...')
                setLoading(false)

            } catch (error) {
                console.error('Error checking profile:', error)
                router.push('/setup-profile')
            }
        })
    }, [])

    const handleNext = () => {
        if (!currentAnswer.trim()) return

        const newAnswers = [...answers, {
            questionId: ONBOARDING_QUESTIONS[currentQuestion].id,
            question: ONBOARDING_QUESTIONS[currentQuestion].question,
            answer: currentAnswer.trim()
        }]
        setAnswers(newAnswers)

        if (currentQuestion < ONBOARDING_QUESTIONS.length - 1) {
            setCurrentQuestion(currentQuestion + 1)
            setCurrentAnswer('')
        } else {
            saveAnswers(newAnswers)
        }
    }

    const saveAnswers = async (allAnswers) => {
        setSaving(true)
        setError('')

        try {
            const { error: profileError } = await supabase
                .from('user_profiles')
                .update({
                    onboarding_answers: allAnswers,
                    onboarding_completed: true,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', user.id)

            if (profileError) throw profileError

            setIsComplete(true)
            setSaving(false)

            setTimeout(() => {
                router.push('/dashboard')
            }, 2000)

        } catch (err) {
            console.error('Error saving answers:', err)
            setError(err.message || 'Failed to save your answers. Please try again.')
            setSaving(false)
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
                <p style={{ color: 'white' }}>Loading...</p>
            </div>
        )
    }

    if (isComplete) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(160deg, #0F172A 0%, #1E293B 50%, #0F766E 100%)',
                padding: 24
            }}>
                <div style={{
                    textAlign: 'center',
                    color: 'white',
                    background: 'rgba(255,255,255,0.03)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 20,
                    padding: 60,
                    maxWidth: 440,
                    boxShadow: '0 25px 60px rgba(0,0,0,0.3)'
                }}>
                    <div style={{ fontSize: 64, marginBottom: 16 }}>🧠</div>
                    <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>You're All Set!</h1>
                    <p style={{ color: '#94A3B8', fontSize: 16, marginBottom: 8 }}>
                        We've received your answers.
                    </p>
                    <p style={{ color: '#64748B', fontSize: 14 }}>
                        Redirecting you to your dashboard...
                    </p>
                </div>
            </div>
        )
    }

    const question = ONBOARDING_QUESTIONS[currentQuestion]
    const progress = ((currentQuestion) / ONBOARDING_QUESTIONS.length) * 100

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(160deg, #0F172A 0%, #1E293B 50%, #0F766E 100%)',
            padding: 24
        }}>
            <div style={{
                background: 'rgba(255,255,255,0.03)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 20,
                padding: 48,
                width: '100%',
                maxWidth: 560,
                boxShadow: '0 25px 60px rgba(0,0,0,0.3)'
            }}>
                {/* Progress */}
                <div style={{ marginBottom: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8', fontSize: 13 }}>
                        <span>Question {currentQuestion + 1} of {ONBOARDING_QUESTIONS.length}</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <div style={{
                        width: '100%',
                        height: 4,
                        background: 'rgba(255,255,255,0.1)',
                        borderRadius: 2,
                        marginTop: 8
                    }}>
                        <div style={{
                            width: `${progress}%`,
                            height: '100%',
                            background: '#10B981',
                            borderRadius: 2,
                            transition: 'width 0.3s ease'
                        }} />
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div style={{
                        background: 'rgba(239,68,68,0.1)',
                        border: '1px solid rgba(239,68,68,0.3)',
                        borderRadius: 10,
                        padding: '12px 16px',
                        marginBottom: 20,
                        color: '#EF4444',
                        fontSize: 13
                    }}>
                        {error}
                    </div>
                )}

                {/* Question */}
                <h2 style={{ fontSize: 22, fontWeight: 700, color: 'white', marginBottom: 8 }}>
                    {question.question}
                </h2>
                <p style={{ color: '#94A3B8', fontSize: 14, marginBottom: 24 }}>
                    {question.description}
                </p>

                {/* Answer */}
                <textarea
                    value={currentAnswer}
                    onChange={e => setCurrentAnswer(e.target.value)}
                    placeholder="Type your answer here..."
                    rows={4}
                    style={{
                        width: '100%',
                        padding: '14px 16px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 10,
                        color: 'white',
                        fontSize: 15,
                        outline: 'none',
                        fontFamily: 'inherit',
                        resize: 'vertical'
                    }}
                    onFocus={e => e.target.style.borderColor = '#10B981'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
                    <div>
                        {currentQuestion > 0 && (
                            <button
                                onClick={() => {
                                    setCurrentQuestion(currentQuestion - 1)
                                    setCurrentAnswer(answers[currentQuestion - 1]?.answer || '')
                                    setAnswers(answers.slice(0, -1))
                                }}
                                style={{
                                    padding: '10px 20px',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: 10,
                                    color: '#94A3B8',
                                    cursor: 'pointer'
                                }}
                            >
                                ← Back
                            </button>
                        )}
                    </div>
                    <button
                        onClick={handleNext}
                        disabled={!currentAnswer.trim() || saving}
                        style={{
                            padding: '10px 28px',
                            background: !currentAnswer.trim() || saving ? '#0F766E' : '#10B981',
                            border: 'none',
                            borderRadius: 10,
                            color: 'white',
                            fontSize: 15,
                            fontWeight: 600,
                            cursor: !currentAnswer.trim() || saving ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        {currentQuestion === ONBOARDING_QUESTIONS.length - 1
                            ? (saving ? 'Saving...' : 'Complete →')
                            : 'Next →'}
                    </button>
                </div>
            </div>
        </div>
    )
}