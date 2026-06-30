'use client'
import { useState, useEffect } from 'react'
import { getCurrentUser, logoutUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Compass, Target, BookOpen, Flame, Brain, Sparkles, 
  ArrowRight, Zap, Check, Star, Trophy, ChevronRight, 
  PenLine, ClipboardList, MapPin, GraduationCap, LogOut,
  TrendingUp, Calendar, Clock
} from 'lucide-react'

export default function DashboardPage() {
    const supabase = createClient()
    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('overview')
    const router = useRouter()
    const [checklists, setChecklists] = useState([])
    const [checklistsLoading, setChecklistsLoading] = useState(true)
    const [streak, setStreak] = useState({ daily_streak: 0, daily_longest: 0 })
    const [deepDiveData, setDeepDiveData] = useState({
        loading: true,
        activeSession: null,
        latestReport: null,
        sessionsThisWeek: 0,
        pastSessions: []
    })

    useEffect(() => {
        getCurrentUser().then(async u => {
            if (!u) { router.push('/login'); return }
            setUser(u)
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', u.id)
                .single()
            if (error) console.error('Error fetching profile:', error)
            else setProfile(data)
            setLoading(false)
        })
    }, [])

    useEffect(() => {
        async function loadData() {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return
                const res = await fetch('/api/checklist/get')
                const d = await res.json()
                if (res.ok && d.checklists) setChecklists(d.checklists)
                const sr = await fetch('/api/streak/get')
                const sd = await sr.json()
                if (sr.ok) setStreak(sd.streak)
                setChecklistsLoading(false)
            } catch (err) { setChecklistsLoading(false) }
        }
        loadData()
    }, [])

    useEffect(() => {
        async function loadDeepDiveData() {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return
                const activeRes = await fetch('/api/deep-dive/start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user.id })
                })
                const activeData = await activeRes.json()
                const reportsRes = await fetch('/api/deep-dive/report')
                const reportsData = await reportsRes.json()
                setDeepDiveData({
                    loading: false,
                    activeSession: activeData.session_id && !activeData.error ? activeData : null,
                    latestReport: reportsData.reports?.[0] || null,
                    sessionsThisWeek: activeData.sessions_used || (activeData.session_id ? 1 : 0),
                    pastSessions: reportsData.reports || []
                })
            } catch (err) { setDeepDiveData(prev => ({ ...prev, loading: false })) }
        }
        loadDeepDiveData()
    }, [])

    const handleLogout = async () => { await logoutUser(); router.push('/') }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#070b14] flex items-center justify-center">
                <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    const activeChecklist = checklists.find(c => c.status === 'IN_PROGRESS' || c.status === 'PAUSED')
    const hasActiveSession = deepDiveData.activeSession && !deepDiveData.loading

    return (
        <div className="min-h-screen bg-[#070b14] text-white">
            
            {/* Fixed Header */}
            <div className="fixed top-0 left-0 right-0 z-50 bg-[#070b14]/90 backdrop-blur-xl border-b border-white/[0.04]">
                <div className="max-w-6xl mx-auto px-5 lg:px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20 flex items-center justify-center text-xl">
                            {profile?.avatar || '🧭'}
                        </div>
                        <div>
                            <h1 className="text-white font-bold text-lg leading-tight">
                                Hey {profile?.display_name?.split(' ')[0] || 'there'}!
                            </h1>
                            <p className="text-slate-500 text-xs flex items-center gap-1">
                                <GraduationCap className="w-3 h-3" />
                                {profile?.education || 'Student'} · {profile?.location || 'Pakistan'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href="/deep-dive" className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium hover:bg-amber-500/20 transition">
                            <Target className="w-4 h-4" /> Deep Dive
                        </Link>
                        <Link href="/journal" className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium hover:bg-blue-500/20 transition">
                            <PenLine className="w-4 h-4" /> Journal
                        </Link>
                        <Link href="/deep-dive" className="sm:hidden w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center hover:bg-amber-500/20 transition">
                            <Target className="w-4 h-4 text-amber-400" />
                        </Link>
                        <Link href="/journal" className="sm:hidden w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center hover:bg-blue-500/20 transition">
                            <PenLine className="w-4 h-4 text-blue-400" />
                        </Link>
                        <button onClick={handleLogout} className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center hover:bg-red-500/20 transition">
                            <LogOut className="w-4 h-4 text-red-400" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content - Mobile: stack | Desktop: 2-column grid */}
            <div className="pt-24 pb-8 px-4 lg:px-8 max-w-6xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    
                    {/* STREAK CARD - Full width */}
                    <div className="lg:col-span-2 relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-red-500/10 border border-amber-500/10 p-5 lg:p-6">
                        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle, #f59e0b 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                        <div className="relative">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Flame className="w-5 h-5 text-amber-400" />
                                    <span className="text-amber-400 text-xs font-semibold uppercase tracking-wider">Your Streak</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-center">
                                        <p className="text-white font-bold text-sm">{streak.daily_streak}</p>
                                        <p className="text-slate-600 text-[10px]">Current</p>
                                    </div>
                                    <div className="w-px h-8 bg-white/[0.06]" />
                                    <div className="text-center">
                                        <p className="text-white font-bold text-sm">{streak.daily_longest}</p>
                                        <p className="text-slate-600 text-[10px]">Best</p>
                                    </div>
                                    <Trophy className="w-5 h-5 text-amber-400/30 hidden sm:block" />
                                </div>
                            </div>
                            <div className="flex items-end gap-3 mt-2">
                                <span className="text-4xl lg:text-5xl font-black text-white">{streak.daily_streak}</span>
                                <span className="text-amber-400/60 text-sm lg:text-base mb-1">day streak</span>
                            </div>
                            <div className="mt-3 flex items-center gap-2">
                                <div className="flex-1 bg-white/[0.04] rounded-full h-2 overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full" style={{ width: `${Math.min((streak.daily_streak / 7) * 100, 100)}%` }} />
                                </div>
                                <span className="text-slate-500 text-[10px] lg:text-xs">7d goal</span>
                            </div>
                        </div>
                    </div>

                    {/* ACTIVE SESSION - Left column on desktop */}
                    {hasActiveSession && (
                        <Link href="/deep-dive" className="block relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border border-emerald-500/20 p-5 lg:p-6 group hover:border-emerald-500/30 transition-all">
                            <div className="absolute top-4 right-4 w-20 h-20 rounded-full bg-emerald-500/10 blur-2xl group-hover:bg-emerald-500/20 transition-all hidden lg:block" />
                            <div className="relative">
                                <div className="flex items-center gap-2 mb-2">
                                    <Compass className="w-5 h-5 text-emerald-400" />
                                    <span className="text-emerald-400 text-xs font-semibold uppercase tracking-wider">Session In Progress</span>
                                </div>
                                <h2 className="text-xl lg:text-2xl font-bold text-white mb-1">
                                    {deepDiveData.activeSession.resumed ? 'Continue where you left off' : 'Ready to begin'}
                                </h2>
                                <p className="text-slate-400 text-sm mb-4">
                                    {deepDiveData.activeSession.resumed 
                                        ? `${deepDiveData.activeSession.total_answered} questions answered` 
                                        : 'Start your career discovery journey'}
                                </p>
                                <div className="inline-flex items-center gap-2 px-5 py-2.5 lg:px-6 lg:py-3 bg-emerald-500 text-white rounded-2xl font-semibold text-sm lg:text-base group-hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20">
                                    {deepDiveData.activeSession.resumed ? 'Continue' : 'Start'}
                                    <ArrowRight className="w-4 h-4 lg:w-5 lg:h-5 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </Link>
                    )}

                    {/* JOURNAL CARD - Right column on desktop */}
                    <Link href="/journal" className="block relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-500/10 p-5 lg:p-6 group hover:border-blue-500/20 transition-all">
                        <div className="absolute bottom-3 right-3 w-20 h-20 rounded-full bg-blue-500/10 blur-2xl group-hover:bg-blue-500/20 transition-all hidden lg:block" />
                        <div className="relative">
                            <div className="flex items-center gap-2 mb-2">
                                <BookOpen className="w-5 h-5 text-blue-400" />
                                <span className="text-blue-400 text-xs font-semibold uppercase tracking-wider">Daily Journal</span>
                            </div>
                            <h2 className="text-xl lg:text-2xl font-bold text-white mb-1">Write today's entry</h2>
                            <p className="text-slate-400 text-sm mb-4">Log progress, mood & learning hours. Get AI feedback.</p>
                            <div className="inline-flex items-center gap-2 px-5 py-2.5 lg:px-6 lg:py-3 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-2xl font-semibold text-sm lg:text-base group-hover:bg-blue-500/30 transition-all">
                                Open Journal <ArrowRight className="w-4 h-4 lg:w-5 lg:h-5 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </Link>

                    {/* MONTHLY PLAN - Left */}
                    {activeChecklist && (
                        <Link href={`/checklist/${activeChecklist.checklist_id}`} className="block relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-500/10 via-pink-500/10 to-fuchsia-500/10 border border-rose-500/10 p-5 lg:p-6 group hover:border-rose-500/20 transition-all">
                            <div className="relative">
                                <div className="flex items-center gap-2 mb-2">
                                    <ClipboardList className="w-5 h-5 text-rose-400" />
                                    <span className="text-rose-400 text-xs font-semibold uppercase tracking-wider">Monthly Action Plan</span>
                                </div>
                                <h2 className="text-xl lg:text-2xl font-bold text-white mb-3">Month {activeChecklist.month_number}</h2>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="flex-1 bg-white/[0.04] rounded-full h-2.5 overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-rose-500 to-pink-500 rounded-full transition-all" 
                                            style={{ width: `${activeChecklist.items?.length ? Math.round((activeChecklist.items.filter(i => i.completed).length / activeChecklist.items.length) * 100) : 0}%` }} />
                                    </div>
                                    <span className="text-rose-400 text-sm font-semibold">
                                        {activeChecklist.items?.filter(i => i.completed).length || 0}/{activeChecklist.items?.length || 0}
                                    </span>
                                </div>
                                <p className="text-slate-400 text-sm">
                                    {activeChecklist.status === 'IN_PROGRESS' ? '⏳ In progress — keep going!' : '⏸️ Paused — resume when ready'}
                                </p>
                            </div>
                        </Link>
                    )}

                    {/* START DEEP DIVE (no active session) - Left */}
                    {!hasActiveSession && (
                        <Link href="/deep-dive" onClick={(e) => { if (deepDiveData.sessionsThisWeek >= 2) e.preventDefault() }}
                            className={`block relative overflow-hidden rounded-3xl p-5 lg:p-8 text-center border group transition-all ${
                                deepDiveData.sessionsThisWeek >= 2
                                    ? 'bg-white/[0.01] border-white/[0.03] cursor-not-allowed'
                                    : 'bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 border-violet-500/10 hover:border-violet-500/20'
                            }`}>
                            <div className="relative py-4 lg:py-6">
                                <Target className={`w-12 h-12 lg:w-16 lg:h-16 mx-auto mb-4 ${deepDiveData.sessionsThisWeek >= 2 ? 'text-slate-600' : 'text-violet-400'}`} />
                                <h2 className="text-xl lg:text-2xl font-bold text-white mb-2">
                                    {deepDiveData.sessionsThisWeek >= 2 ? 'Weekly Limit Reached' : deepDiveData.latestReport ? 'Start a New Deep Dive' : 'Start Your First Deep Dive'}
                                </h2>
                                <p className="text-slate-500 text-sm lg:text-base max-w-md mx-auto">
                                    {deepDiveData.sessionsThisWeek >= 2 ? 'Come back next week for more sessions!' : '20-minute AI conversation · Personalized 6-month career roadmap'}
                                </p>
                                <div className="mt-4 text-slate-600 text-sm">{deepDiveData.sessionsThisWeek}/2 sessions this week</div>
                            </div>
                        </Link>
                    )}

                    {/* LATEST REPORT - Right */}
                    {deepDiveData.latestReport && (
                        <Link href={`/report/${deepDiveData.latestReport.session_id}`} className="block relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-500/10 via-teal-500/10 to-emerald-500/10 border border-cyan-500/10 p-5 lg:p-6 group hover:border-cyan-500/20 transition-all">
                            <div className="relative">
                                <div className="flex items-center gap-2 mb-2">
                                    <Brain className="w-5 h-5 text-cyan-400" />
                                    <span className="text-cyan-400 text-xs font-semibold uppercase tracking-wider">Latest Report</span>
                                </div>
                                <h2 className="text-xl lg:text-2xl font-bold text-white mb-1">Session {deepDiveData.latestReport.session?.session_number}</h2>
                                <p className="text-slate-400 text-sm mb-4">
                                    {new Date(deepDiveData.latestReport.generated_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </p>
                                <div className="inline-flex items-center gap-2 px-5 py-2.5 lg:px-6 lg:py-3 bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded-2xl font-semibold text-sm lg:text-base group-hover:bg-cyan-500/30 transition-all">
                                    View Report <ArrowRight className="w-4 h-4 lg:w-5 lg:h-5 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </Link>
                    )}

                    {/* PAST SESSIONS + MONTHLY PLANS - Side by side on desktop */}
                    <div className="lg:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-4">
                        
                        {/* PAST SESSIONS */}
                        {deepDiveData.pastSessions.length > 0 && (
                            <div className="rounded-3xl bg-white/[0.01] border border-white/[0.03] p-5 lg:p-6">
                                <h3 className="text-white font-semibold text-sm lg:text-base mb-4 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-slate-400" /> Past Deep Dives
                                </h3>
                                <div className="space-y-2">
                                    {deepDiveData.pastSessions.map((session) => (
                                        <Link key={session.session_id} href={`/report/${session.session_id}`}
                                            className="flex items-center justify-between p-3 lg:p-4 rounded-2xl bg-white/[0.02] border border-white/[0.03] hover:bg-white/[0.04] transition-all group">
                                            <div>
                                                <p className="text-white text-sm font-medium">Session {session.session?.session_number}</p>
                                                <p className="text-slate-500 text-xs mt-0.5">
                                                    {session.session?.question_count || '?'} questions · {new Date(session.generated_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}
                                                </p>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* MONTHLY PLANS LIST */}
                        {!checklistsLoading && checklists.length > 0 && (
                            <div className="rounded-3xl bg-white/[0.01] border border-white/[0.03] p-5 lg:p-6">
                                <h3 className="text-white font-semibold text-sm lg:text-base mb-4 flex items-center gap-2">
                                    <ClipboardList className="w-4 h-4 text-blue-400" /> Monthly Action Plans
                                </h3>
                                <div className="space-y-2">
                                    {checklists.map((cl) => {
                                        const completed = cl.items?.filter(i => i.completed).length || 0
                                        const total = cl.items?.length || 0
                                        const progress = total > 0 ? Math.round((completed / total) * 100) : 0
                                        return (
                                            <Link key={cl.checklist_id} href={`/checklist/${cl.checklist_id}`}
                                                className="block p-3 lg:p-4 rounded-2xl bg-white/[0.02] border border-white/[0.03] hover:bg-white/[0.04] transition-all group">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-white text-sm font-medium">Month {cl.month_number}</p>
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                                                            cl.status === 'IN_PROGRESS' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                                                            cl.status === 'PAUSED' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                                                            cl.status === 'COMPLETED' ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' :
                                                            'text-slate-400 bg-white/[0.03] border-white/[0.05]'
                                                        }`}>
                                                            {cl.status === 'IN_PROGRESS' ? 'Active' : cl.status === 'PAUSED' ? 'Paused' : cl.status === 'COMPLETED' ? 'Done' : 'Ready'}
                                                        </span>
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 bg-white/[0.04] rounded-full h-1.5 overflow-hidden">
                                                        <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                                                    </div>
                                                    <span className="text-slate-500 text-[10px]">{completed}/{total}</span>
                                                </div>
                                            </Link>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* TABS - Full width */}
                    <div className="lg:col-span-2 rounded-3xl bg-white/[0.01] border border-white/[0.03] p-5 lg:p-6">
                        <div className="flex gap-1 mb-5 border-b border-white/[0.04] pb-3">
                            {['overview', 'answers', 'preferences'].map(tab => (
                                <button key={tab} onClick={() => setActiveTab(tab)}
                                    className={`px-4 lg:px-6 py-2 rounded-xl text-xs lg:text-sm font-semibold capitalize transition-all ${
                                        activeTab === tab ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-500 hover:text-slate-300'
                                    }`}>
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {activeTab === 'overview' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-4">
                                    <h3 className="text-white text-sm font-semibold mb-3 flex items-center gap-2"><Target className="w-4 h-4 text-emerald-400" /> Interests</h3>
                                    {profile?.interests?.length > 0 ? (
                                        <div className="flex flex-wrap gap-1.5">
                                            {profile.interests.map((interest, i) => (
                                                <span key={i} className="text-xs bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/20">{interest}</span>
                                            ))}
                                        </div>
                                    ) : <p className="text-slate-600 text-xs">No interests added</p>}
                                </div>
                                <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-4">
                                    <h3 className="text-white text-sm font-semibold mb-3 flex items-center gap-2"><Zap className="w-4 h-4 text-blue-400" /> Skills</h3>
                                    {profile?.skills?.length > 0 ? (
                                        <div className="flex flex-wrap gap-1.5">
                                            {profile.skills.map((skill, i) => (
                                                <span key={i} className="text-xs bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-full border border-blue-500/20">{skill}</span>
                                            ))}
                                        </div>
                                    ) : <p className="text-slate-600 text-xs">No skills added</p>}
                                </div>
                                <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-4">
                                    <h3 className="text-white text-sm font-semibold mb-3 flex items-center gap-2"><MapPin className="w-4 h-4 text-purple-400" /> Info</h3>
                                    <div className="space-y-2">
                                        <div><p className="text-slate-500 text-[10px] uppercase">Education</p><p className="text-white text-sm">{profile?.education || 'Not set'}</p></div>
                                        <div><p className="text-slate-500 text-[10px] uppercase">Location</p><p className="text-white text-sm">{profile?.location || 'Not set'}</p></div>
                                    </div>
                                </div>
                                <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-4">
                                    <h3 className="text-white text-sm font-semibold mb-3 flex items-center gap-2"><Star className="w-4 h-4 text-amber-400" /> Career Goals</h3>
                                    <p className="text-slate-400 text-sm">{profile?.preferences?.career_goals || 'Not set yet'}</p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'answers' && (
                            <div>
                                {profile?.onboarding_answers?.length > 0 ? (
                                    <div className="space-y-3">
                                        {profile.onboarding_answers.map((item, i) => (
                                            <div key={i} className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-4">
                                                <p className="text-emerald-400 text-xs font-semibold mb-1">Question {item.questionId || i + 1}</p>
                                                <p className="text-white text-sm font-medium mb-2">{item.question}</p>
                                                <p className="text-slate-400 text-sm bg-white/[0.02] rounded-xl p-3 border-l-2 border-emerald-500/30">{item.answer}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-10">
                                        <p className="text-slate-500 text-sm mb-3">No onboarding answers yet.</p>
                                        <Link href="/onboarding" className="text-emerald-400 font-semibold text-sm">Start Onboarding →</Link>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'preferences' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-4">
                                    <h3 className="text-white text-sm font-semibold mb-2">💼 Work Environment</h3>
                                    <p className="text-slate-300 text-sm">{profile?.preferences?.work_environment || 'Not specified'}</p>
                                </div>
                                <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-4">
                                    <h3 className="text-white text-sm font-semibold mb-2">📊 Profile Status</h3>
                                    <div className="space-y-1">
                                        <div className="flex justify-between"><span className="text-slate-500 text-xs">Complete</span><span>{profile?.is_complete ? '✅' : '⏳'}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-500 text-xs">Onboarding</span><span>{profile?.onboarding_completed ? '✅' : '⏳'}</span></div>
                                    </div>
                                </div>
                                <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-4 sm:col-span-2">
                                    <h3 className="text-white text-sm font-semibold mb-2">📝 Account Info</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div><p className="text-slate-500 text-[10px] uppercase">Email</p><p className="text-white text-sm">{user?.email}</p></div>
                                        <div><p className="text-slate-500 text-[10px] uppercase">User ID</p><p className="text-slate-500 text-xs font-mono">{user?.id?.slice(0, 16)}...</p></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* NEXT STEPS - Full width */}
                    <div className="lg:col-span-2 rounded-3xl bg-gradient-to-br from-emerald-500/5 to-teal-500/5 border border-emerald-500/10 p-5 lg:p-6">
                        <h3 className="text-white font-semibold text-sm lg:text-base mb-4 flex items-center gap-2"><Sparkles className="w-4 h-4 text-emerald-400" /> Next Steps</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                            <Link href="/deep-dive" className="block p-3.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl font-semibold text-sm text-center hover:bg-amber-500/20 transition">
                                🎯 Career Deep Dive
                            </Link>
                            <Link href="/journal" className="block p-3.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-2xl font-semibold text-sm text-center hover:bg-blue-500/20 transition">
                                📝 Daily Journal
                            </Link>
                            {!profile?.is_complete && (
                                <Link href="/setup-profile" className="block p-3 bg-white/[0.03] border border-white/[0.05] text-slate-400 rounded-2xl text-sm text-center hover:bg-white/[0.06] transition">
                                    ✏️ Complete Profile
                                </Link>
                            )}
                            {profile?.is_complete && !profile?.onboarding_completed && (
                                <Link href="/onboarding" className="block p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl font-semibold text-sm text-center hover:bg-emerald-500/20 transition">
                                    🧠 Complete Counseling
                                </Link>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}