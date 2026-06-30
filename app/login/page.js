'use client'
import { useState, useEffect } from 'react'
import { loginUser, getCurrentUser } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Compass, Mail, Lock, ArrowRight, Eye, EyeOff, X } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [focused, setFocused] = useState('')
  const router = useRouter()

  useEffect(() => {
    getCurrentUser().then(u => {
      if (u) router.replace('/dashboard')
      else setChecking(false)
    })
  }, [])

  if (checking) return null

  async function handleLogin(e) {
    e.preventDefault()
    setError('')

    if (!email.trim()) { setError('Please enter your email address.'); return }
    if (!password) { setError('Please enter your password.'); return }

    setLoading(true)
    const { user, error: authError } = await loginUser(email, password)
    setLoading(false)

    if (authError) {
      setError(authError)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070b14] relative overflow-hidden p-6">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-30%] right-[-20%] w-[600px] h-[600px] rounded-full bg-emerald-500/[0.04] blur-[150px]" />
        <div className="absolute bottom-[-30%] left-[-20%] w-[500px] h-[500px] rounded-full bg-blue-500/[0.04] blur-[140px]" />
      </div>

      {/* Grid texture */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.02]" style={{
        backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
        backgroundSize: '50px 50px'
      }} />

      <form onSubmit={handleLogin} className="relative z-10 w-full max-w-md">
        <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/[0.06] rounded-3xl p-8 lg:p-10 shadow-2xl shadow-black/50">
          
          {/* Logo + Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-blue-500/20 to-cyan-500/20 border border-white/10 mb-5">
              <Compass className="w-8 h-8 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-slate-500 text-sm">Sign in to continue your career journey.</p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 flex items-start gap-3">
              <X className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Email */}
          <div className="mb-5">
            <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Email Address</label>
            <div className={`relative rounded-xl border transition-all duration-300 ${focused === 'email' ? 'border-emerald-500/50 bg-white/[0.04]' : 'border-white/[0.08] bg-white/[0.02]'}`}>
              <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${focused === 'email' ? 'text-emerald-400' : 'text-slate-600'}`} />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused('')}
                className="w-full bg-transparent text-white placeholder-slate-600 text-sm py-3.5 pl-11 pr-4 rounded-xl outline-none"
              />
            </div>
          </div>

          {/* Password */}
          <div className="mb-8">
            <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Password</label>
            <div className={`relative rounded-xl border transition-all duration-300 ${focused === 'password' ? 'border-emerald-500/50 bg-white/[0.04]' : 'border-white/[0.08] bg-white/[0.02]'}`}>
              <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${focused === 'password' ? 'text-emerald-400' : 'text-slate-600'}`} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused('')}
                className="w-full bg-transparent text-white placeholder-slate-600 text-sm py-3.5 pl-11 pr-12 rounded-xl outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="group relative w-full py-4 bg-gradient-to-r from-emerald-400 via-blue-400 to-cyan-400 animate-gradient text-white font-bold rounded-2xl hover:opacity-90 transition-all duration-300 shadow-xl shadow-emerald-500/20 hover:shadow-2xl hover:shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="inline-flex items-center gap-2">
              {loading ? 'Signing in...' : 'Sign In'}
              {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
            </span>
          </button>

          {/* Register link */}
          <p className="text-center text-slate-500 text-sm mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </form>
    </div>
  )
}