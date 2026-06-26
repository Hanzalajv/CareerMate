'use client'
import { useState, useEffect } from 'react'
import { getCurrentUser, logoutUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function DashboardPage() {
    const supabase = createClient()
    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('overview')
    const router = useRouter()
    const [deepDiveData, setDeepDiveData] = useState({
        loading: true,
        activeSession: null,
        latestReport: null,
        sessionsThisWeek: 0,
        pastSessions: []
    })

    useEffect(() => {
        getCurrentUser().then(async u => {
            if (!u) {
                router.push('/login')
                return
            }
            setUser(u)

            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', u.id)
                .single()

            if (error) {
                console.error('Error fetching profile:', error)
            } else {
                setProfile(data)
            }
            setLoading(false)
        })
    }, [])

    useEffect(() => {
        async function loadDeepDiveData() {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return

                // Check for active session
                const activeRes = await fetch('/api/deep-dive/start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user.id })
                })
                const activeData = await activeRes.json()

                // Get reports
                const reportsRes = await fetch('/api/deep-dive/report')
                const reportsData = await reportsRes.json()

                setDeepDiveData({
                    loading: false,
                    activeSession: activeData.session_id && !activeData.error ? activeData : null,
                    latestReport: reportsData.reports?.[0] || null,
                    sessionsThisWeek: activeData.sessions_used || (activeData.session_id ? 1 : 0),
                    pastSessions: reportsData.reports || []
                })
            } catch (err) {
                setDeepDiveData(prev => ({ ...prev, loading: false }))
            }
        }

        loadDeepDiveData()
    }, [])

    const handleLogout = async () => {
        await logoutUser()
        router.push('/')
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
                <p style={{ color: 'white' }}>Loading dashboard...</p>
            </div>
        )
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(160deg, #0F172A 0%, #1E293B 50%, #0F766E 100%)',
            color: 'white',
            padding: 24
        }}>
            <div style={{ maxWidth: 1000, margin: '0 auto' }}>

                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 32
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <span style={{ fontSize: 48 }}>{profile?.avatar || '🧭'}</span>
                        <div>
                            <h1 style={{ fontSize: 28, fontWeight: 700 }}>Welcome, {profile?.display_name || user?.email}</h1>
                            <p style={{ color: '#94A3B8', fontSize: 14 }}>
                                {profile?.education || 'Student'} · {profile?.location || 'Location not set'}
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <Link href="/deep-dive" style={{
                            padding: '10px 20px',
                            borderRadius: 10,
                            background: 'rgba(245,158,11,0.15)',
                            color: '#F59E0B',
                            textDecoration: 'none',
                            fontSize: 14,
                            fontWeight: 500,
                            border: '1px solid rgba(245,158,11,0.2)'
                        }}>
                            🎯 Deep Dive
                        </Link>
                        <Link href="/chat" style={{
                            padding: '10px 20px',
                            borderRadius: 10,
                            background: 'rgba(16,185,129,0.15)',
                            color: '#10B981',
                            textDecoration: 'none',
                            fontSize: 14,
                            fontWeight: 500,
                            border: '1px solid rgba(16,185,129,0.2)'
                        }}>
                            💬 Chat
                        </Link>
                        <button
                            onClick={handleLogout}
                            style={{
                                padding: '10px 24px',
                                background: 'rgba(239,68,68,0.1)',
                                border: '1px solid rgba(239,68,68,0.3)',
                                borderRadius: 10,
                                color: '#EF4444',
                                cursor: 'pointer'
                            }}
                        >
                            Log Out
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: 16,
                    marginBottom: 32
                }}>
                    {[
                        { label: 'Profile', value: profile?.is_complete ? '✅ Complete' : '⏳ In Progress' },
                        { label: 'Onboarding', value: profile?.onboarding_completed ? '✅ Done' : '⏳ Pending' },
                        { label: 'Interests', value: profile?.interests?.length || 0 },
                        { label: 'Skills', value: profile?.skills?.length || 0 },
                    ].map((stat, i) => (
                        <div key={i} style={{
                            padding: 20,
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: 12
                        }}>
                            <p style={{ color: '#94A3B8', fontSize: 13 }}>{stat.label}</p>
                            <p style={{ fontSize: 20, fontWeight: 600 }}>{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* ⭐ CAREER DEEP DIVE SECTION ⭐ */}
                <div style={{
                    padding: 24,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(245,158,11,0.2)',
                    borderRadius: 12,
                    marginBottom: 24
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 16
                    }}>
                        <div>
                            <h2 style={{ fontSize: 18, fontWeight: 600 }}>🎯 Career Deep Dive</h2>
                            <p style={{ color: '#94A3B8', fontSize: 14, marginTop: 4 }}>
                                AI-powered career assessment for the Pakistani market
                            </p>
                        </div>
                        <span style={{
                            padding: '4px 12px',
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: 20,
                            fontSize: 13,
                            color: '#94A3B8'
                        }}>
                            {deepDiveData.sessionsThisWeek}/2 this week
                        </span>
                    </div>

                    {deepDiveData.loading ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 0' }}>
                            <div style={{
                                width: 20,
                                height: 20,
                                border: '2px solid rgba(16,185,129,0.3)',
                                borderTop: '2px solid #10B981',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite'
                            }} />
                            <p style={{ color: '#94A3B8', fontSize: 14 }}>Loading...</p>
                        </div>
                    ) : (
                        <>
                            {/* Active Session Banner */}
                            {deepDiveData.activeSession && (
                                <div style={{
                                    padding: 16,
                                    background: 'rgba(16,185,129,0.08)',
                                    border: '1px solid rgba(16,185,129,0.2)',
                                    borderRadius: 10,
                                    marginBottom: 12
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <p style={{ color: '#10B981', fontWeight: 600, fontSize: 14 }}>Session In Progress</p>
                                            <p style={{ color: '#94A3B8', fontSize: 14, marginTop: 4 }}>
                                                {deepDiveData.activeSession.resumed
                                                    ? `You've answered ${deepDiveData.activeSession.total_answered} questions. Continue where you left off.`
                                                    : 'Ready to begin your assessment'}
                                            </p>
                                        </div>
                                        <Link
                                            href="/deep-dive"
                                            style={{
                                                padding: '10px 20px',
                                                background: '#10B981',
                                                borderRadius: 8,
                                                color: 'white',
                                                textDecoration: 'none',
                                                fontSize: 14,
                                                fontWeight: 600,
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            {deepDiveData.activeSession.resumed ? 'Continue' : 'Start'}
                                        </Link>
                                    </div>
                                </div>
                            )}

                            {/* Latest Report */}
                            {deepDiveData.latestReport && (
                                <div style={{
                                    padding: 16,
                                    background: 'rgba(255,255,255,0.03)',
                                    borderRadius: 10,
                                    marginBottom: 12
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <p style={{ color: 'white', fontWeight: 600, fontSize: 14 }}>Latest Report</p>
                                            <p style={{ color: '#94A3B8', fontSize: 13, marginTop: 4 }}>
                                                Session {deepDiveData.latestReport.session?.session_number} • {new Date(deepDiveData.latestReport.generated_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            </p>
                                        </div>
                                        <Link
                                            href={`/report/${deepDiveData.latestReport.session_id}`}
                                            style={{
                                                color: '#10B981',
                                                textDecoration: 'none',
                                                fontSize: 14,
                                                fontWeight: 500
                                            }}
                                        >
                                            View Report →
                                        </Link>
                                    </div>
                                </div>
                            )}

                            {/* No Session or Report Yet */}
                            {!deepDiveData.activeSession && !deepDiveData.latestReport && (
                                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                                    <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
                                    <p style={{ color: '#94A3B8', fontSize: 14, marginBottom: 16 }}>
                                        Take a 20-minute assessment and get personalized career guidance for the Pakistani job market.
                                    </p>
                                </div>
                            )}

                            {/* Action Button */}
                            {!deepDiveData.activeSession && (
                                <Link
                                    href="/deep-dive"
                                    onClick={(e) => {
                                        if (deepDiveData.sessionsThisWeek >= 2) {
                                            e.preventDefault()
                                        }
                                    }}
                                    style={{
                                        display: 'block',
                                        width: '100%',
                                        textAlign: 'center',
                                        padding: '14px',
                                        borderRadius: 10,
                                        fontWeight: 600,
                                        fontSize: 14,
                                        textDecoration: 'none',
                                        background: deepDiveData.sessionsThisWeek >= 2
                                            ? 'rgba(255,255,255,0.05)'
                                            : '#10B981',
                                        color: deepDiveData.sessionsThisWeek >= 2
                                            ? '#64748B'
                                            : 'white',
                                        cursor: deepDiveData.sessionsThisWeek >= 2
                                            ? 'not-allowed'
                                            : 'pointer'
                                    }}
                                >
                                    {deepDiveData.sessionsThisWeek >= 2
                                        ? 'Weekly Limit Reached — Available Next Week'
                                        : deepDiveData.latestReport
                                            ? 'Start New Deep Dive'
                                            : 'Start Your First Deep Dive'}
                                </Link>
                            )}
                        </>
                    )}
                </div>

                {/* Past Sessions */}
                {deepDiveData.pastSessions.length > 0 && (
                    <div style={{
                        padding: 24,
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: 12,
                        marginBottom: 24
                    }}>
                        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>📚 Past Deep Dives</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {deepDiveData.pastSessions.map((session) => (
                                <Link
                                    key={session.session_id}
                                    href={`/report/${session.session_id}`}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: 12,
                                        background: 'rgba(255,255,255,0.03)',
                                        borderRadius: 8,
                                        textDecoration: 'none',
                                        color: 'white'
                                    }}
                                >
                                    <div>
                                        <p style={{ fontWeight: 500, fontSize: 14 }}>Session {session.session?.session_number}</p>
                                        <p style={{ color: '#94A3B8', fontSize: 13, marginTop: 2 }}>
                                            {session.session?.question_count || '?'} questions • {new Date(session.generated_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </p>
                                    </div>
                                    <span style={{ color: '#10B981', fontSize: 14 }}>View →</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* ⭐ CHAT CARD ⭐ */}
                <div style={{
                    padding: 24,
                    background: 'rgba(16,185,129,0.06)',
                    border: '1px solid rgba(16,185,129,0.15)',
                    borderRadius: 12,
                    marginBottom: 24,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 16
                }}>
                    <div>
                        <h3 style={{ fontSize: 18, fontWeight: 600 }}>💬 Talk to Your Career Coach</h3>
                        <p style={{ color: '#94A3B8', fontSize: 14, marginTop: 4 }}>
                            Get personalized advice based on your skills, interests, and goals
                        </p>
                    </div>
                    <Link href="/chat" style={{
                        padding: '12px 28px',
                        background: '#10B981',
                        borderRadius: 10,
                        color: 'white',
                        textDecoration: 'none',
                        fontWeight: 600,
                        boxShadow: '0 4px 16px rgba(16,185,129,0.3)'
                    }}>
                        Start Chat →
                    </Link>
                </div>

                {/* Tab Navigation */}
                <div style={{
                    display: 'flex',
                    gap: 4,
                    marginBottom: 24,
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    paddingBottom: 4
                }}>
                    {['overview', 'answers', 'preferences'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                padding: '12px 24px',
                                background: activeTab === tab ? 'rgba(16,185,129,0.15)' : 'transparent',
                                border: 'none',
                                borderRadius: 8,
                                color: activeTab === tab ? '#10B981' : '#94A3B8',
                                cursor: 'pointer',
                                fontWeight: activeTab === tab ? 600 : 400,
                                textTransform: 'capitalize'
                            }}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div>
                    {activeTab === 'overview' && (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                            gap: 20
                        }}>
                            <div style={{
                                padding: 24,
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.06)',
                                borderRadius: 12
                            }}>
                                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>🎯 Interests</h3>
                                {profile?.interests?.length > 0 ? (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                        {profile.interests.map((interest, i) => (
                                            <span key={i} style={{
                                                padding: '6px 14px',
                                                background: 'rgba(16,185,129,0.1)',
                                                border: '1px solid rgba(16,185,129,0.2)',
                                                borderRadius: 20,
                                                fontSize: 13,
                                                color: '#10B981'
                                            }}>
                                                {interest}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p style={{ color: '#64748B', fontSize: 14 }}>No interests added yet</p>
                                )}
                            </div>

                            <div style={{
                                padding: 24,
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.06)',
                                borderRadius: 12
                            }}>
                                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>🛠️ Skills</h3>
                                {profile?.skills?.length > 0 ? (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                        {profile.skills.map((skill, i) => (
                                            <span key={i} style={{
                                                padding: '6px 14px',
                                                background: 'rgba(59,130,246,0.1)',
                                                border: '1px solid rgba(59,130,246,0.2)',
                                                borderRadius: 20,
                                                fontSize: 13,
                                                color: '#60A5FA'
                                            }}>
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p style={{ color: '#64748B', fontSize: 14 }}>No skills added yet</p>
                                )}
                            </div>

                            <div style={{
                                padding: 24,
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.06)',
                                borderRadius: 12
                            }}>
                                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>📋 Info</h3>
                                <div style={{ marginBottom: 8 }}>
                                    <p style={{ color: '#64748B', fontSize: 13 }}>Education</p>
                                    <p style={{ fontSize: 15 }}>{profile?.education || 'Not set'}</p>
                                </div>
                                <div>
                                    <p style={{ color: '#64748B', fontSize: 13 }}>Location</p>
                                    <p style={{ fontSize: 15 }}>{profile?.location || 'Not set'}</p>
                                </div>
                            </div>

                            <div style={{
                                padding: 24,
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.06)',
                                borderRadius: 12
                            }}>
                                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>🎯 Career Goals</h3>
                                <p style={{ fontSize: 14, color: '#94A3B8' }}>
                                    {profile?.preferences?.career_goals || 'No career goals set yet'}
                                </p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'answers' && (
                        <div>
                            {profile?.onboarding_answers?.length > 0 ? (
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr',
                                    gap: 16
                                }}>
                                    {profile.onboarding_answers.map((item, i) => (
                                        <div key={i} style={{
                                            padding: 20,
                                            background: 'rgba(255,255,255,0.03)',
                                            border: '1px solid rgba(255,255,255,0.06)',
                                            borderRadius: 12
                                        }}>
                                            <p style={{
                                                color: '#10B981',
                                                fontSize: 13,
                                                fontWeight: 600,
                                                marginBottom: 4
                                            }}>
                                                Question {item.questionId || i + 1}
                                            </p>
                                            <p style={{
                                                fontSize: 15,
                                                fontWeight: 500,
                                                marginBottom: 8
                                            }}>
                                                {item.question}
                                            </p>
                                            <p style={{
                                                fontSize: 14,
                                                color: '#94A3B8',
                                                padding: 12,
                                                background: 'rgba(255,255,255,0.03)',
                                                borderRadius: 8,
                                                borderLeft: '3px solid #10B981'
                                            }}>
                                                {item.answer}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{
                                    padding: 40,
                                    textAlign: 'center',
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    borderRadius: 12
                                }}>
                                    <p style={{ color: '#64748B', fontSize: 16 }}>No onboarding answers yet.</p>
                                    <Link href="/onboarding" style={{
                                        color: '#10B981',
                                        textDecoration: 'none',
                                        fontWeight: 600
                                    }}>
                                        Start Onboarding →
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'preferences' && (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                            gap: 20
                        }}>
                            <div style={{
                                padding: 24,
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.06)',
                                borderRadius: 12
                            }}>
                                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>💼 Work Environment</h3>
                                <p style={{ fontSize: 15 }}>
                                    {profile?.preferences?.work_environment || 'Not specified'}
                                </p>
                            </div>

                            <div style={{
                                padding: 24,
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.06)',
                                borderRadius: 12
                            }}>
                                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>📊 Profile Status</h3>
                                <div style={{ marginBottom: 8 }}>
                                    <p style={{ color: '#64748B', fontSize: 13 }}>Profile Complete</p>
                                    <p style={{ fontSize: 15 }}>{profile?.is_complete ? '✅ Yes' : '⏳ No'}</p>
                                </div>
                                <div>
                                    <p style={{ color: '#64748B', fontSize: 13 }}>Onboarding Done</p>
                                    <p style={{ fontSize: 15 }}>{profile?.onboarding_completed ? '✅ Yes' : '⏳ No'}</p>
                                </div>
                            </div>

                            <div style={{
                                padding: 24,
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.06)',
                                borderRadius: 12,
                                gridColumn: '1 / -1'
                            }}>
                                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>📝 Account Info</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                    <div>
                                        <p style={{ color: '#64748B', fontSize: 13 }}>Email</p>
                                        <p style={{ fontSize: 15 }}>{user?.email}</p>
                                    </div>
                                    <div>
                                        <p style={{ color: '#64748B', fontSize: 13 }}>User ID</p>
                                        <p style={{ fontSize: 13, color: '#64748B', fontFamily: 'monospace' }}>
                                            {user?.id?.slice(0, 16)}...
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Next Steps */}
                <div style={{
                    marginTop: 32,
                    padding: 24,
                    background: 'rgba(16,185,129,0.08)',
                    border: '1px solid rgba(16,185,129,0.15)',
                    borderRadius: 12
                }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>📋 Next Steps</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {/* Deep Dive Button */}
                        <Link href="/deep-dive" style={{
                            padding: '14px 20px',
                            background: 'rgba(245,158,11,0.15)',
                            borderRadius: 8,
                            color: '#F59E0B',
                            textDecoration: 'none',
                            fontWeight: 600,
                            border: '1px solid rgba(245,158,11,0.2)',
                            textAlign: 'center'
                        }}>
                            🎯 Start Career Deep Dive
                        </Link>

                        {/* Chat Button */}
                        <Link href="/chat" style={{
                            padding: '14px 20px',
                            background: 'rgba(16,185,129,0.15)',
                            borderRadius: 8,
                            color: '#10B981',
                            textDecoration: 'none',
                            fontWeight: 600,
                            border: '1px solid rgba(16,185,129,0.2)',
                            textAlign: 'center'
                        }}>
                            💬 Talk to Your Career Coach
                        </Link>

                        {!profile?.is_complete && (
                            <Link href="/setup-profile" style={{
                                padding: '12px 16px',
                                background: 'rgba(255,255,255,0.05)',
                                borderRadius: 8,
                                color: 'white',
                                textDecoration: 'none'
                            }}>
                                ✏️ Complete Your Profile
                            </Link>
                        )}
                        {profile?.is_complete && !profile?.onboarding_completed && (
                            <Link href="/onboarding" style={{
                                padding: '12px 16px',
                                background: 'rgba(16,185,129,0.15)',
                                borderRadius: 8,
                                color: '#10B981',
                                textDecoration: 'none',
                                fontWeight: 600
                            }}>
                                🧠 Complete AI Career Counseling
                            </Link>
                        )}
                    </div>
                </div>

            </div>
        </div>
    )
}