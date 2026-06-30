'use client'
import { useState, useEffect } from 'react'
import { getCurrentUser } from '@/lib/auth'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { 
  Compass, Brain, ClipboardCheck, Flame, MessageCircle, 
  Smartphone, ArrowRight, Sparkles, Target, Clock, Users,
  Shield, TrendingUp, Zap, Menu, X, Star
} from 'lucide-react'


export default function Home() {
  const [loaded, setLoaded] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') setLoggedIn(false)
    })
    getCurrentUser().then(u => {
      setLoggedIn(!!u)
      setLoaded(true)
    })

    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-[#070b14] text-white">
      
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-20px) rotate(1deg); }
          75% { transform: translateY(10px) rotate(-1deg); }
        }
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-30px); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes borderGlow {
          0%, 100% { border-color: rgba(59, 130, 246, 0.1); }
          50% { border-color: rgba(59, 130, 246, 0.3); }
        }
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          0% { opacity: 0; transform: scale(0.8); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes slideInLeft {
          0% { opacity: 0; transform: translateX(-50px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInRight {
          0% { opacity: 0; transform: translateX(50px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        @keyframes orbit {
          0% { transform: rotate(0deg) translateX(100px) rotate(0deg); }
          100% { transform: rotate(360deg) translateX(100px) rotate(-360deg); }
        }
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-slow { animation: floatSlow 8s ease-in-out infinite; }
        .animate-pulse-glow { animation: pulse-glow 3s ease-in-out infinite; }
        .animate-shimmer {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
        .animate-border-glow { animation: borderGlow 3s ease-in-out infinite; }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradientShift 4s ease infinite;
        }
        .fade-in-up { animation: fadeInUp 0.8s ease-out forwards; }
        .scale-in { animation: scaleIn 0.6s ease-out forwards; }
        .slide-in-left { animation: slideInLeft 0.8s ease-out forwards; }
        .slide-in-right { animation: slideInRight 0.8s ease-out forwards; }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-400 { animation-delay: 0.4s; }
        .delay-500 { animation-delay: 0.5s; }
        .delay-600 { animation-delay: 0.6s; }
        .delay-700 { animation-delay: 0.7s; }
        .delay-800 { animation-delay: 0.8s; }
        .delay-900 { animation-delay: 0.9s; }
      `}</style>

      {/* Texture overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      <div className="fixed inset-0 pointer-events-none opacity-[0.015]" style={{
        backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
        backgroundRepeat: 'repeat',
        backgroundSize: '256px 256px'
      }} />

     {/* Ambient orbs - more vibrant */}
<div className="fixed inset-0 pointer-events-none">
  <div className="absolute top-[-30%] left-[-20%] w-[900px] h-[900px] rounded-full bg-blue-500/[0.06] blur-[180px] animate-pulse-glow" />
  <div className="absolute top-[10%] right-[-15%] w-[700px] h-[700px] rounded-full bg-purple-500/[0.05] blur-[150px] animate-pulse-glow" style={{ animationDelay: '1s' }} />
  <div className="absolute top-[40%] left-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-500/[0.05] blur-[140px] animate-pulse-glow" style={{ animationDelay: '2s' }} />
  <div className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full bg-cyan-400/[0.05] blur-[160px] animate-pulse-glow" style={{ animationDelay: '0.5s' }} />
  <div className="absolute top-[60%] left-[40%] w-[500px] h-[500px] rounded-full bg-amber-400/[0.03] blur-[130px] animate-float-slow" />
</div>

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'bg-[#070b14]/95 backdrop-blur-xl border-b border-white/5 shadow-2xl shadow-black/50' : 'bg-transparent border-b border-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between h-16 lg:h-20">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 via-emerald-400 to-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">CAREER<span className="text-emerald-400">MATE</span></span>
          </Link>

          <div className="hidden lg:flex items-center gap-8">
            {['How It Works', 'Why CareerMate', 'Get Started'].map((item) => (
              <a 
                key={item}
                href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={(e) => {
                  e.preventDefault()
                  document.getElementById(item.toLowerCase().replace(/\s+/g, '-'))?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="text-sm text-slate-400 hover:text-white transition-colors relative group py-1"
              >
                {item}
                <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-gradient-to-r from-blue-400 to-emerald-400 group-hover:w-full transition-all duration-300" />
              </a>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-3">
            {loggedIn ? (
              <>
                <Link href="/dashboard" className="px-5 py-2.5 bg-gradient-to-r from-blue-500 via-emerald-400 to-cyan-400 text-white font-semibold rounded-xl hover:opacity-90 transition-all duration-300 text-sm shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 hover:scale-105">
                  Dashboard
                </Link>
                <button onClick={async () => {
                  const supabase = createClient()
                  await supabase.auth.signOut()
                  setLoggedIn(false)
                }} className="px-5 py-2.5 text-slate-400 hover:text-white text-sm font-medium transition-colors">
                  Log Out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="px-5 py-2.5 text-slate-400 hover:text-white text-sm font-medium transition-colors">
                  Sign In
                </Link>
                <Link href="/register" className="px-6 py-2.5 bg-gradient-to-r from-blue-500 via-emerald-400 to-cyan-400 animate-gradient text-white font-semibold rounded-xl hover:opacity-90 transition-all duration-300 text-sm shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 hover:scale-105">
                  Get Started Free
                </Link>
              </>
            )}
          </div>

          <button onClick={() => setMobileMenu(!mobileMenu)} className="lg:hidden text-slate-400 hover:text-white transition-colors">
            {mobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileMenu && (
          <div className="lg:hidden bg-[#070b14]/98 backdrop-blur-xl border-b border-white/5 px-6 pb-6 scale-in">
            <div className="flex flex-col gap-3">
              {['How It Works', 'Why CareerMate'].map((item) => (
                <a 
                  key={item}
                  href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={(e) => {
                    e.preventDefault()
                    document.getElementById(item.toLowerCase().replace(/\s+/g, '-'))?.scrollIntoView({ behavior: 'smooth' })
                    setMobileMenu(false)
                  }}
                  className="text-slate-400 py-2 hover:text-white transition-colors"
                >
                  {item}
                </a>
              ))}
              {loggedIn ? (
                <Link href="/dashboard" className="px-5 py-3 bg-gradient-to-r from-blue-500 via-emerald-400 to-cyan-400 text-white font-semibold rounded-xl text-center">Dashboard</Link>
              ) : (
                <>
                  <Link href="/login" className="px-5 py-3 border border-white/10 text-white rounded-xl text-center">Sign In</Link>
                  <Link href="/register" className="px-5 py-3 bg-gradient-to-r from-blue-500 via-emerald-400 to-cyan-400 text-white font-semibold rounded-xl text-center">Get Started Free</Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

    {/* Hero */}
      <section className="relative pt-32 lg:pt-44 pb-20 lg:pb-28 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-20%] right-[-10%] w-[700px] h-[700px] rounded-full bg-blue-500/[0.06] blur-[150px] animate-pulse-glow" />
          <div className="absolute top-[40%] left-[-5%] w-[500px] h-[500px] rounded-full bg-purple-500/[0.05] blur-[130px] animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
          <div className="absolute bottom-[-20%] right-[10%] w-[600px] h-[600px] rounded-full bg-emerald-500/[0.06] blur-[150px] animate-pulse-glow" style={{ animationDelay: '0.8s' }} />
          <div className="absolute bottom-[10%] left-[20%] w-[400px] h-[400px] rounded-full bg-cyan-400/[0.04] blur-[120px] animate-float-slow" />
        </div>

        {/* Floating elements */}
        <div className="absolute top-[15%] left-[5%] animate-float opacity-20">
          <Star className="w-10 h-10 text-blue-400" />
        </div>
        <div className="absolute top-[25%] right-[8%] animate-float opacity-20" style={{ animationDelay: '2s' }}>
          <Brain className="w-12 h-12 text-purple-400" />
        </div>
        <div className="absolute bottom-[25%] left-[8%] animate-float opacity-20" style={{ animationDelay: '4s' }}>
          <Target className="w-10 h-10 text-emerald-400" />
        </div>
        <div className="absolute bottom-[15%] right-[5%] animate-float-slow opacity-20">
          <Flame className="w-14 h-14 text-amber-400" />
        </div>
        <div className="absolute top-[50%] left-[50%] animate-float opacity-15" style={{ animationDelay: '3s' }}>
          <Sparkles className="w-8 h-8 text-cyan-400" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            
            {/* Badge */}
<div className="fade-in-up inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-emerald-500/20 border border-blue-400/30 text-transparent bg-clip-text font-semibold text-sm mb-8 animate-border-glow shadow-lg shadow-blue-500/10">
  <Sparkles className="w-4 h-4 text-blue-400" />
  <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent font-semibold">
    Pakistan's Smartest Career Coach
  </span>
</div>

            <h1 className="fade-in-up delay-100 text-4xl lg:text-6xl xl:text-7xl font-black leading-[1.05] tracking-tight mb-6">
              Your career,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-emerald-400 to-cyan-400 animate-gradient">
                finally clear
              </span>
            </h1>

            <p className="fade-in-up delay-200 text-base lg:text-lg text-slate-400 max-w-xl mx-auto mb-10 leading-relaxed">
              One deep AI conversation. A personalized 6-month roadmap. 
              Daily accountability. Built for Pakistani students and professionals.
            </p>

            <div className="fade-in-up delay-300 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 via-emerald-400 to-cyan-400 animate-gradient text-white font-bold rounded-2xl hover:opacity-90 transition-all duration-300 shadow-2xl shadow-emerald-500/20 hover:shadow-3xl hover:shadow-emerald-500/30 hover:scale-105">
                Start Your Deep Dive
                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
              </Link>
              <a href="#how-it-works" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/5 border border-white/10 text-white font-semibold rounded-2xl hover:bg-white/10 hover:scale-105 transition-all duration-300 backdrop-blur-sm">
                See How It Works
              </a>
            </div>

            <div className="fade-in-up delay-500 grid grid-cols-3 gap-8 mt-16 pt-12 border-t border-white/5">
              {[
                { icon: Brain, value: '25+', label: 'Deep Questions' },
                { icon: Target, value: '6-Month', label: 'Roadmap' },
                { icon: Flame, value: 'Streaks', label: 'Daily Tracking' },
              ].map((stat, i) => (
                <div key={i} className="text-center group hover:scale-110 transition-transform duration-300">
                  <stat.icon className="w-5 h-5 text-emerald-400 mx-auto mb-3 group-hover:text-blue-400 transition-colors" />
                  <div className="text-2xl lg:text-3xl font-bold mb-1">{stat.value}</div>
                  <div className="text-xs text-slate-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
{/* How It Works - Timeline + Bento Grid */}
<section id="how-it-works" className="py-24 lg:py-32 relative overflow-hidden">
  {/* Background */}
  <div className="absolute inset-0 bg-gradient-to-b from-[#070b14] via-[#0a1020] to-[#070b14] pointer-events-none" />
  <div className="absolute top-[-30%] right-[-15%] w-[500px] h-[500px] rounded-full bg-blue-600/[0.04] blur-[130px] pointer-events-none animate-pulse-glow" />
  <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full bg-indigo-500/[0.03] blur-[120px] pointer-events-none animate-pulse-glow" style={{ animationDelay: '1s' }} />
  <div className="absolute top-[50%] left-[50%] w-[300px] h-[300px] rounded-full bg-emerald-500/[0.02] blur-[100px] pointer-events-none animate-float-slow" />
  
  <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-8">
    <div className="text-center mb-20 fade-in-up">
      <span className="text-blue-400 text-sm font-semibold tracking-wider uppercase mb-3 block">Process</span>
      <h2 className="text-3xl lg:text-5xl font-bold mb-4">How It Works</h2>
      <p className="text-slate-400 text-lg max-w-lg mx-auto">Three steps from confusion to a 6-month career plan.</p>
    </div>

    {/* Timeline */}
    <div className="relative">
      {/* Vertical Line */}
      <div className="absolute left-8 lg:left-1/2 top-0 bottom-0 w-[2px] bg-gradient-to-b from-blue-500/40 via-emerald-500/40 to-cyan-500/40 rounded-full lg:-translate-x-px" />
      
      {/* Glow on the line */}
      <div className="absolute left-8 lg:left-1/2 top-0 bottom-0 w-[8px] bg-gradient-to-b from-blue-500/10 via-emerald-500/10 to-cyan-500/10 blur-sm lg:-translate-x-1/2 animate-pulse-glow" />

      {[
        {
          step: '01',
          icon: MessageCircle,
          title: 'Deep Dive Session',
          subtitle: '20-minute AI conversation',
          desc: 'AI asks you 25+ probing questions. Not generic — it tests what you actually know, reads between the lines, calls out contradictions, and challenges your assumptions about your own career.',
          bullets: ['Tests your actual knowledge', 'Reads between the lines', 'Adapts to Pakistani context', 'Detects fake vs real interests'],
          gradient: 'from-blue-500/20 to-indigo-500/20',
          borderHover: 'hover:border-blue-500/30',
          shadowHover: 'hover:shadow-blue-500/5',
          iconGradient: 'from-blue-500/20 to-indigo-500/20',
          iconBorder: 'border-blue-500/20',
          iconColor: 'text-blue-400',
          stepColor: 'group-hover:text-blue-500/[0.06]',
          dotColor: 'bg-blue-500',
          dotGlow: 'shadow-blue-500/50'
        },
        {
          step: '02',
          icon: Brain,
          title: 'Get Your Career Report',
          subtitle: 'Personalized & data-backed',
          desc: 'A detailed, personalized report with 3-5 career paths, real PKR salary ranges, Pakistan market analysis, sincerity scoring, and a month-by-month 6-month action roadmap — all backed by your exact words.',
          bullets: ['3-5 career paths with match %', 'Real PKR salary ranges', 'Pakistan market analysis', '6-month monthly roadmap'],
          gradient: 'from-emerald-500/20 to-teal-500/20',
          borderHover: 'hover:border-emerald-500/30',
          shadowHover: 'hover:shadow-emerald-500/5',
          iconGradient: 'from-emerald-500/20 to-teal-500/20',
          iconBorder: 'border-emerald-500/20',
          iconColor: 'text-emerald-400',
          stepColor: 'group-hover:text-emerald-500/[0.06]',
          dotColor: 'bg-emerald-500',
          dotGlow: 'shadow-emerald-500/50'
        },
        {
          step: '03',
          icon: ClipboardCheck,
          title: 'Take Action & Stay Accountable',
          subtitle: 'Daily progress tracking',
          desc: 'Monthly checklists, daily journal with AI feedback, streak tracking, and progress visualization keep you moving forward. The AI checks if your daily work aligns with your career goals.',
          bullets: ['Monthly action checklists', 'Daily journal + AI feedback', 'Streak tracking for motivation', 'Progress visualization'],
          gradient: 'from-purple-500/20 to-pink-500/20',
          borderHover: 'hover:border-purple-500/30',
          shadowHover: 'hover:shadow-purple-500/5',
          iconGradient: 'from-purple-500/20 to-pink-500/20',
          iconBorder: 'border-purple-500/20',
          iconColor: 'text-purple-400',
          stepColor: 'group-hover:text-purple-500/[0.06]',
          dotColor: 'bg-purple-500',
          dotGlow: 'shadow-purple-500/50'
        }
      ].map((item, i) => (
        <div key={i} className={`relative mb-16 last:mb-0 slide-in-left delay-${(i + 1) * 200}`}>
          {/* Timeline Dot */}
          <div className="absolute left-8 lg:left-1/2 top-8 z-20 lg:-translate-x-1/2">
            <div className={`w-5 h-5 rounded-full ${item.dotColor} shadow-lg ${item.dotGlow} ring-4 ring-[#0a1020] animate-pulse-glow`} style={{ animationDelay: `${i * 0.5}s` }} />
            <div className={`absolute inset-0 w-5 h-5 rounded-full ${item.dotColor} blur-md animate-pulse-glow`} style={{ animationDelay: `${i * 0.5}s` }} />
          </div>

          {/* Bento Card */}
          <div className={`ml-20 lg:ml-0 lg:w-[calc(50%-2rem)] ${i % 2 === 0 ? 'lg:mr-auto lg:pr-0' : 'lg:ml-auto lg:pl-0'}`}>
            <div className={`group relative rounded-3xl bg-white/[0.02] border border-white/[0.03] ${item.borderHover} transition-all duration-500 hover:bg-white/[0.03] hover:-translate-y-1 hover:shadow-2xl ${item.shadowHover} overflow-hidden`}>
              
              {/* Top gradient bar */}
              <div className={`h-1 bg-gradient-to-r ${item.gradient} opacity-50 group-hover:opacity-100 transition-opacity`} />
              
              <div className="p-6 lg:p-8">
                {/* Step number - large faded */}
                <div className={`absolute top-4 right-6 text-[100px] font-black text-white/[0.015] ${item.stepColor} transition-all duration-700 select-none leading-none`}>
                  {item.step}
                </div>

                {/* Icon + Title */}
                <div className="flex items-start gap-5 mb-5 relative">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.iconGradient} border ${item.iconBorder} flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:shadow-lg ${item.shadowHover} group-hover:rotate-3 transition-all duration-500`}>
                    <item.icon className={`w-7 h-7 ${item.iconColor}`} />
                  </div>
                  <div>
                    <h3 className="text-xl lg:text-2xl font-bold mb-1 group-hover:text-white transition-colors">{item.title}</h3>
                    <p className="text-sm text-slate-500">{item.subtitle}</p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-slate-400 text-sm leading-relaxed mb-5">{item.desc}</p>

                {/* Bullets in a bento sub-grid */}
                <div className="grid grid-cols-2 gap-2">
                  {item.bullets.map((bullet, j) => (
                    <div key={j} className="flex items-center gap-2 bg-white/[0.02] rounded-xl px-3 py-2 border border-white/[0.03] group-hover:border-white/[0.05] transition-all">
                      <div className={`w-1.5 h-1.5 rounded-full ${item.dotColor} flex-shrink-0`} />
                      <span className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors">{bullet}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
</section>

      {/* Why CareerMate - Masonry Bento Grid + Expandable Preview */}
<section id="features" className="py-24 lg:py-32 relative overflow-hidden">
  {/* Background */}
  <div className="absolute inset-0 bg-gradient-to-b from-[#070b14] via-[#0a1020] to-[#070b14] pointer-events-none" />
  <div className="absolute top-[-20%] left-[-15%] w-[500px] h-[500px] rounded-full bg-blue-600/[0.04] blur-[130px] pointer-events-none animate-pulse-glow" />
  <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-indigo-500/[0.03] blur-[120px] pointer-events-none animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
  
  <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-8">
    <div className="text-center mb-16 fade-in-up">
      <span className="text-blue-400 text-sm font-semibold tracking-wider uppercase mb-3 block">Why Us</span>
      <h2 className="text-3xl lg:text-5xl font-bold mb-4">Why CareerMate</h2>
      <p className="text-slate-400 text-lg max-w-lg mx-auto">Not a chatbot. Not a quiz. A real career discovery platform built for Pakistan.</p>
    </div>

    <MasonryFeatures />
  </div>
</section>

      {/* CTA */}
      <section id="cta" className="py-24 lg:py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[#070b14] via-transparent to-[#070b14] pointer-events-none" />
        
        <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500/10 via-emerald-500/10 to-cyan-500/10 border border-white/5 p-10 lg:p-16 text-center scale-in">
            <div className="absolute top-[-50%] left-[-20%] w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[100px] pointer-events-none animate-pulse-glow" />
            <div className="absolute bottom-[-50%] right-[-20%] w-[400px] h-[400px] rounded-full bg-emerald-500/5 blur-[100px] pointer-events-none animate-pulse-glow" style={{ animationDelay: '1s' }} />
            
            <div className="relative z-10">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">Ready to figure out your career?</h2>
              <p className="text-slate-400 text-lg max-w-md mx-auto mb-8">Start your first deep dive. It's free.</p>
              <Link href="/register" className="group inline-flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-blue-500 via-emerald-400 to-cyan-400 animate-gradient text-white font-bold rounded-2xl hover:opacity-90 transition-all duration-300 shadow-2xl shadow-emerald-500/20 hover:shadow-3xl hover:shadow-emerald-500/30 hover:scale-105 text-lg">
                Get Started Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
              </Link>
              <p className="text-slate-500 text-sm mt-4">No credit card. 2 free deep dives every week.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10 relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <Compass className="w-4 h-4" />
            <span>© 2026 CareerMate. Built in Pakistan.</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}


function MasonryFeatures() {
  const [expanded, setExpanded] = useState(null)

  const features = [
    {
      id: 'profiling',
      icon: Brain,
      title: 'Deep Profiling',
      short: 'Tests knowledge, not just asks questions',
      desc: 'AI asks academic-level questions to verify what you actually know. It reads between the lines, detects contradictions, and separates genuine interest from surface-level attraction.',
      bullets: ['Academic-level knowledge tests', 'Detects fake vs real interests', 'Cross-references earlier answers', 'Challenges contradictions directly'],
      stat: '89%',
      statLabel: 'of users discovered they liked something different than they thought',
      gradient: 'from-blue-500/20 to-indigo-500/20',
      border: 'border-blue-500/30',
      glow: 'shadow-blue-500/10',
      iconBg: 'from-blue-500/20 to-indigo-500/20',
      iconBorder: 'border-blue-500/20',
      iconColor: 'text-blue-400',
      textColor: 'text-blue-400',
      size: 'wide'
    },
    {
      id: 'pakistan',
      icon: Shield,
      title: 'Pakistan Reality Check',
      short: 'Real data. Real talk.',
      desc: 'We tell you about sifarish, gender biases, city disadvantages, and real PKR salary ranges. Sugar-coating won\'t get you a job — honest preparation will.',
      bullets: ['Real PKR salary data', 'Sifarish & networking awareness', 'City & gender bias acknowledged', 'Pakistani company names & job boards'],
      stat: 'PKR 40K-250K',
      statLabel: 'realistic salary ranges shared per career path',
      gradient: 'from-emerald-500/20 to-teal-500/20',
      border: 'border-emerald-500/30',
      glow: 'shadow-emerald-500/10',
      iconBg: 'from-emerald-500/20 to-teal-500/20',
      iconBorder: 'border-emerald-500/20',
      iconColor: 'text-emerald-400',
      textColor: 'text-emerald-400',
      size: 'tall'
    },
    {
      id: 'roadmap',
      icon: TrendingUp,
      title: '6-Month Roadmap',
      short: 'Month-by-month action plan',
      desc: 'A concrete, month-by-month plan with specific milestones, tasks, and deadlines. Each month builds on the last. You always know exactly what to do next.',
      bullets: ['Monthly milestones with deadlines', 'Specific, actionable tasks', 'Progress tracking built in', 'Adjusts as you complete tasks'],
      stat: '6',
      statLabel: 'months of structured guidance per deep dive',
      gradient: 'from-purple-500/20 to-pink-500/20',
      border: 'border-purple-500/30',
      glow: 'shadow-purple-500/10',
      iconBg: 'from-purple-500/20 to-pink-500/20',
      iconBorder: 'border-purple-500/20',
      iconColor: 'text-purple-400',
      textColor: 'text-purple-400',
      size: 'square'
    },
    {
      id: 'memory',
      icon: MessageCircle,
      title: 'Memory Across Sessions',
      short: 'Remembers everything you say',
      desc: 'CareerMate remembers every answer across sessions. It cross-references question 3 with question 18. It catches contradictions. Like a real coach who actually listens.',
      bullets: ['Full conversation memory', 'Cross-references all answers', 'Catches contradictions', 'No repeating yourself'],
      stat: '25+',
      statLabel: 'questions with full context remembered',
      gradient: 'from-amber-500/20 to-orange-500/20',
      border: 'border-amber-500/30',
      glow: 'shadow-amber-500/10',
      iconBg: 'from-amber-500/20 to-orange-500/20',
      iconBorder: 'border-amber-500/20',
      iconColor: 'text-amber-400',
      textColor: 'text-amber-400',
      size: 'square'
    },
    {
      id: 'streaks',
      icon: Flame,
      title: 'Daily Journal + Streaks',
      short: 'AI feedback on your progress',
      desc: 'Log what you did each day. The AI reviews it against your career goals and gives personalized feedback. Build streaks. Stay accountable.',
      bullets: ['Daily journal with AI review', 'Streak tracking for motivation', 'Mood & learning hours tracking', 'AI compares progress to goals'],
      stat: '🔥',
      statLabel: 'streak system keeps you coming back daily',
      gradient: 'from-rose-500/20 to-red-500/20',
      border: 'border-rose-500/30',
      glow: 'shadow-rose-500/10',
      iconBg: 'from-rose-500/20 to-red-500/20',
      iconBorder: 'border-rose-500/20',
      iconColor: 'text-rose-400',
      textColor: 'text-rose-400',
      size: 'wide'
    },
    {
      id: 'available',
      icon: Zap,
      title: 'Always Available',
      short: 'Desktop, tablet, mobile',
      desc: 'Your career coach is ready whenever you are. No appointments. No downloads. No waiting for office hours.',
      bullets: ['Works on all devices', 'No appointments needed', '2 free deep dives weekly', 'No credit card required'],
      stat: '24/7',
      statLabel: 'available whenever you need guidance',
      gradient: 'from-cyan-500/20 to-blue-500/20',
      border: 'border-cyan-500/30',
      glow: 'shadow-cyan-500/10',
      iconBg: 'from-cyan-500/20 to-blue-500/20',
      iconBorder: 'border-cyan-500/20',
      iconColor: 'text-cyan-400',
      textColor: 'text-cyan-400',
      size: 'tall'
    }
  ]

  return (
    <div>
     {/* Masonry Grid */}
<div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 transition-all duration-700 ${expanded ? 'hidden' : ''}`}>
  {features.map((feature) => (
    <div
      key={feature.id}
      onClick={() => setExpanded(feature.id)}
      className={`
        group relative p-8 rounded-3xl bg-white/[0.01] border border-white/[0.03] 
        hover:border-white/10 transition-all duration-500 cursor-pointer
        hover:-translate-y-1 hover:shadow-2xl ${feature.glow}
        ${feature.size === 'wide' ? 'lg:col-span-2 min-h-[200px]' : ''}
        ${feature.size === 'tall' ? 'lg:row-span-1 min-h-[280px]' : ''}
        ${feature.size === 'square' ? 'min-h-[200px]' : ''}
        fade-in-up
      `}
    >
      <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />
      
      <div className="relative h-full flex flex-col justify-between">
        <div>
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.iconBg} border ${feature.iconBorder} flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
            <feature.icon className={`w-7 h-7 ${feature.iconColor}`} />
          </div>
          <h3 className="text-xl font-bold mb-3 group-hover:text-white transition-colors">{feature.title}</h3>
          <p className="text-slate-500 text-sm leading-relaxed">{feature.short}</p>
        </div>
        
        <div className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-slate-600 mt-4">
          Click to explore →
        </div>
      </div>
    </div>
  ))}
</div>

      {/* Expanded Detail View */}
      {expanded && (() => {
        const feature = features.find(f => f.id === expanded)
        return (
          <div className="scale-in">
            <div className={`relative rounded-3xl bg-white/[0.02] border ${feature.border} overflow-hidden shadow-2xl ${feature.glow}`}>
              <div className={`h-1 bg-gradient-to-r ${feature.gradient}`} />
              
              <div className="p-8 lg:p-10">
                <button
                  onClick={() => setExpanded(null)}
                  className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all hover:scale-110"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>

                <div className="grid lg:grid-cols-2 gap-10">
                  <div className="flex flex-col justify-center items-center text-center">
                    <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${feature.iconBg} border ${feature.iconBorder} flex items-center justify-center mb-6 animate-float`}>
                      <feature.icon className={`w-12 h-12 ${feature.iconColor}`} />
                    </div>
                    <div className="text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-emerald-400 to-cyan-400 mb-3">
                      {feature.stat}
                    </div>
                    <p className="text-slate-400 text-sm max-w-xs">{feature.statLabel}</p>
                  </div>

                  <div>
                    <h3 className={`text-2xl lg:text-3xl font-bold mb-4 ${feature.textColor}`}>{feature.title}</h3>
                    <p className="text-slate-300 leading-relaxed mb-6">{feature.desc}</p>
                    
                    <div className="space-y-3">
                      {feature.bullets.map((bullet, i) => (
                        <div key={i} className="flex items-center gap-3 bg-white/[0.03] rounded-xl px-4 py-3 border border-white/[0.05] hover:border-white/10 transition-all hover:bg-white/[0.05]">
                          <div className={`w-2 h-2 rounded-full ${feature.iconColor.replace('text-', 'bg-')} flex-shrink-0`} />
                          <span className="text-slate-300 text-sm">{bullet}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Minimized Pills */}
            <div className="flex flex-wrap justify-center gap-3 mt-6">
              {features.filter(f => f.id !== expanded).map((f) => (
                <button
                  key={f.id}
                  onClick={() => setExpanded(f.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/[0.02] border border-white/[0.04] hover:border-white/15 transition-all duration-300 hover:bg-white/[0.04] hover:scale-105 text-sm`}
                >
                  <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${f.iconBg} border ${f.iconBorder} flex items-center justify-center`}>
                    <f.icon className={`w-3.5 h-3.5 ${f.iconColor}`} />
                  </div>
                  <span className="text-slate-400">{f.title}</span>
                </button>
              ))}
            </div>
          </div>
        )
      })()}
    </div>
  )
}