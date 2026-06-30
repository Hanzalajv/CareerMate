'use client'
import { useState, useEffect } from 'react'
import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowRight, ArrowLeft, Check, Brain, Sparkles, Target, Shield, Zap, Flame, Compass } from 'lucide-react'

const ONBOARDING_QUESTIONS = [
    {
        id: 1,
        question: "What subjects do you genuinely enjoy studying?",
        description: "Think about what you'd read about in your free time.",
        icon: Brain,
        color: 'text-blue-400',
        gradient: 'from-blue-500/20 to-indigo-500/20',
        border: 'border-blue-500/20'
    },
    {
        id: 2,
        question: "What are your top 3 skills?",
        description: "What are you naturally good at?",
        icon: Sparkles,
        color: 'text-purple-400',
        gradient: 'from-purple-500/20 to-pink-500/20',
        border: 'border-purple-500/20'
    },
    {
        id: 3,
        question: "What kind of work environment do you prefer?",
        description: "Do you like working alone, in teams, or a mix?",
        icon: Target,
        color: 'text-emerald-400',
        gradient: 'from-emerald-500/20 to-teal-500/20',
        border: 'border-emerald-500/20'
    },
    {
        id: 4,
        question: "What are your biggest fears about your career?",
        description: "Be honest — we all have them.",
        icon: Shield,
        color: 'text-amber-400',
        gradient: 'from-amber-500/20 to-orange-500/20',
        border: 'border-amber-500/20'
    },
    {
        id: 5,
        question: "What does your family expect from you?",
        description: "Understanding your support system helps us give better advice.",
        icon: Flame,
        color: 'text-rose-400',
        gradient: 'from-rose-500/20 to-red-500/20',
        border: 'border-rose-500/20'
    },
    {
        id: 6,
        question: "What's the job market like in your city?",
        description: "What industries are growing where you live?",
        icon: Zap,
        color: 'text-cyan-400',
        gradient: 'from-cyan-500/20 to-blue-500/20',
        border: 'border-cyan-500/20'
    },
    {
        id: 7,
        question: "What are your financial goals?",
        description: "What lifestyle do you want to achieve?",
        icon: Target,
        color: 'text-emerald-400',
        gradient: 'from-emerald-500/20 to-teal-500/20',
        border: 'border-emerald-500/20'
    },
    {
        id: 8,
        question: "What motivates you to work?",
        description: "Money, purpose, recognition, impact, freedom?",
        icon: Sparkles,
        color: 'text-blue-400',
        gradient: 'from-blue-500/20 to-indigo-500/20',
        border: 'border-blue-500/20'
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
            if (!u) { router.push('/login'); return }
            setUser(u)

            try {
                const { data: profile, error: profileError } = await supabase
                    .from('user_profiles')
                    .select('is_complete, onboarding_completed')
                    .eq('user_id', u.id)
                    .single()

                if (profileError || !profile) {
                    router.push('/setup-profile')
                    return
                }

                if (!profile.is_complete) {
                    router.push('/setup-profile')
                    return
                }

                if (profile.onboarding_completed) {
                    router.push('/dashboard')
                    return
                }

                setLoading(false)
            } catch (error) {
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

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleNext()
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
            setTimeout(() => router.push('/dashboard'), 2000)
        } catch (err) {
            setError(err.message || 'Failed to save your answers.')
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#070b14] flex items-center justify-center">
                <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    if (isComplete) {
        return (
            <div className="min-h-screen bg-[#070b14] flex items-center justify-center p-6">
                <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/[0.06] rounded-3xl p-10 lg:p-14 text-center max-w-md shadow-2xl shadow-black/50 scale-in">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6 animate-float">
                        <Check className="w-10 h-10 text-emerald-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-3">You're All Set!</h1>
                    <p className="text-slate-400 mb-2">Your answers have been saved.</p>
                    <p className="text-slate-600 text-sm">Redirecting to your dashboard...</p>
                </div>
            </div>
        )
    }

    const question = ONBOARDING_QUESTIONS[currentQuestion]
    const progress = ((currentQuestion) / ONBOARDING_QUESTIONS.length) * 100
    const QuestionIcon = question.icon

    return (
        <div className="min-h-screen bg-[#070b14] flex items-center justify-center relative overflow-hidden p-6">
            {/* Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-500/[0.03] blur-[140px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-emerald-500/[0.03] blur-[130px]" />
            </div>

            <div className="relative z-10 w-full max-w-lg">
                <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/[0.06] rounded-3xl p-8 lg:p-10 shadow-2xl shadow-black/50">
                    
                    {/* Progress bar */}
                    <div className="mb-8">
                        <div className="flex justify-between text-slate-500 text-xs font-medium mb-3">
                            <span>Question {currentQuestion + 1} of {ONBOARDING_QUESTIONS.length}</span>
                            <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="flex gap-1.5">
                            {ONBOARDING_QUESTIONS.map((_, i) => (
                                <div
                                    key={i}
                                    className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${
                                        i < currentQuestion
                                            ? 'bg-emerald-500'
                                            : i === currentQuestion
                                                ? 'bg-gradient-to-r from-emerald-500/50 to-emerald-500'
                                                : 'bg-white/[0.06]'
                                    }`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Icon */}
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${question.gradient} border ${question.border} flex items-center justify-center mb-6`}>
                        <QuestionIcon className={`w-7 h-7 ${question.color}`} />
                    </div>

                    {/* Question */}
                    <h2 className="text-xl lg:text-2xl font-bold text-white mb-2">{question.question}</h2>
                    <p className="text-slate-500 text-sm mb-6">{question.description}</p>

                    {/* Error */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-5 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Answer */}
                    <textarea
                        value={currentAnswer}
                        onChange={e => setCurrentAnswer(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your answer here..."
                        rows={4}
                        className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 text-white placeholder-slate-600 text-sm outline-none focus:border-emerald-500/50 focus:bg-white/[0.05] transition-all duration-300 resize-none"
                        autoFocus
                    />

                    {/* Buttons */}
                    <div className="flex items-center justify-between mt-6">
                        <div>
                            {currentQuestion > 0 && (
                                <button
                                    onClick={() => {
                                        setCurrentQuestion(currentQuestion - 1)
                                        setCurrentAnswer(answers[currentQuestion - 1]?.answer || '')
                                        setAnswers(answers.slice(0, -1))
                                    }}
                                    className="group inline-flex items-center gap-2 px-5 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all text-sm font-medium"
                                >
                                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                    Back
                                </button>
                            )}
                        </div>
                        <button
                            onClick={handleNext}
                            disabled={!currentAnswer.trim() || saving}
                            className="group inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold hover:opacity-90 transition-all duration-300 shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                            {currentQuestion === ONBOARDING_QUESTIONS.length - 1
                                ? (saving ? 'Saving...' : 'Complete')
                                : 'Next'}
                            {!saving && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                        </button>
                    </div>

                    {/* Tip */}
                    <p className="text-slate-600 text-xs text-center mt-5">
                        Press Enter to submit • Be honest for the best guidance
                    </p>
                </div>

                {/* Dots */}
                <div className="flex justify-center gap-2 mt-6">
                    {ONBOARDING_QUESTIONS.map((_, i) => (
                        <div
                            key={i}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                i === currentQuestion
                                    ? 'bg-emerald-400 w-6'
                                    : i < currentQuestion
                                        ? 'bg-emerald-600'
                                        : 'bg-white/[0.08]'
                            }`}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}