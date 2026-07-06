'use client'
import { useState, useEffect } from 'react'
import { registerUser, getCurrentUser } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Compass, Mail, Lock, User, ArrowRight, Eye, EyeOff, Check, X } from 'lucide-react'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [focused, setFocused] = useState('')
  const router = useRouter()
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false)

  // Password validation checks
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*]/.test(password),
    match: password === confirmPassword && confirmPassword.length > 0
  }

  useEffect(() => {
    getCurrentUser().then(u => {
      if (u) router.replace('/dashboard')
      else setChecking(false)
    })
  }, [])

  if (checking) return null

  async function handleRegister(e) {
    e.preventDefault()
    setError('')
    if (!agreedToPrivacy) {
  setError('Please agree to the Privacy Policy to continue.')
  return
}
    if (!displayName.trim()) { setError('Please enter your full name.'); return }
    if (!email.trim()) { setError('Please enter your email address.'); return }
    if (!checks.length) { setError('Password must be at least 8 characters.'); return }
    if (!checks.uppercase) { setError('Password must contain at least one uppercase letter.'); return }
    if (!checks.number) { setError('Password must contain at least one number.'); return }
    if (!checks.special) { setError('Password must contain at least one special character.'); return }
    if (!checks.match) { setError('Passwords do not match.'); return }

    setLoading(true)
    const { user, error: authError } = await registerUser(email, password, displayName)
    setLoading(false)

    if (authError) {
      setError(authError)
    } else {
      router.push('/setup-profile')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070b14] relative overflow-hidden p-6">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-30%] left-[-20%] w-[600px] h-[600px] rounded-full bg-blue-500/[0.04] blur-[150px]" />
        <div className="absolute bottom-[-30%] right-[-20%] w-[500px] h-[500px] rounded-full bg-emerald-500/[0.04] blur-[140px]" />
      </div>

      {/* Grid texture */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.02]" style={{
        backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
        backgroundSize: '50px 50px'
      }} />

      
      <form onSubmit={handleRegister} className="relative z-10 w-full max-w-md">
        {/* Card */}
        <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/[0.06] rounded-3xl p-8 lg:p-10 shadow-2xl shadow-black/50">
          
          {/* Logo + Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 via-emerald-500/20 to-cyan-500/20 border border-white/10 mb-5">
              <Compass className="w-8 h-8 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Join CareerMate</h1>
            <p className="text-slate-500 text-sm">Start your career discovery journey.</p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 flex items-start gap-3">
              <X className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Full Name */}
          <div className="mb-5">
            <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Full Name</label>
            <div className={`relative rounded-xl border transition-all duration-300 ${focused === 'name' ? 'border-emerald-500/50 bg-white/[0.04]' : 'border-white/[0.08] bg-white/[0.02]'}`}>
              <User className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${focused === 'name' ? 'text-emerald-400' : 'text-slate-600'}`} />
              <input
                type="text"
                placeholder="Your full name"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                onFocus={() => setFocused('name')}
                onBlur={() => setFocused('')}
                className="w-full bg-transparent text-white placeholder-slate-600 text-sm py-3.5 pl-11 pr-4 rounded-xl outline-none"
              />
            </div>
          </div>

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
          <div className="mb-5">
            <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Password</label>
            <div className={`relative rounded-xl border transition-all duration-300 ${focused === 'password' ? 'border-emerald-500/50 bg-white/[0.04]' : 'border-white/[0.08] bg-white/[0.02]'}`}>
              <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${focused === 'password' ? 'text-emerald-400' : 'text-slate-600'}`} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a strong password"
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

            {/* Password strength indicators */}
            {password.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mt-3">
                {[
                  { label: '8+ characters', passed: checks.length },
                  { label: 'Uppercase letter', passed: checks.uppercase },
                  { label: 'Number', passed: checks.number },
                  { label: 'Special character', passed: checks.special },
                ].map((check, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${check.passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700/50 text-slate-600'}`}>
                      {check.passed ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    </div>
                    <span className={`text-xs ${check.passed ? 'text-emerald-400' : 'text-slate-600'}`}>{check.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="mb-8">
            <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Confirm Password</label>
            <div className={`relative rounded-xl border transition-all duration-300 ${focused === 'confirm' ? checks.match ? 'border-emerald-500/50 bg-white/[0.04]' : 'border-red-500/50 bg-white/[0.04]' : 'border-white/[0.08] bg-white/[0.02]'}`}>
              <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${focused === 'confirm' ? checks.match ? 'text-emerald-400' : 'text-red-400' : 'text-slate-600'}`} />
              <input
                type={showConfirm ? 'text' : 'password'}
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                onFocus={() => setFocused('confirm')}
                onBlur={() => setFocused('')}
                className="w-full bg-transparent text-white placeholder-slate-600 text-sm py-3.5 pl-11 pr-12 rounded-xl outline-none"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword.length > 0 && checks.match && (
              <p className="text-emerald-400 text-xs mt-2 flex items-center gap-1.5">
                <Check className="w-3 h-3" /> Passwords match
              </p>
            )}
          </div>
          {/* Privacy Agreement */}
<div className="mb-6 w-full">
  <label className="flex items-start gap-3 cursor-pointer w-full">
    <div className="flex-shrink-0 mt-0.5">
      <input
        type="checkbox"
        checked={agreedToPrivacy}
        onChange={(e) => setAgreedToPrivacy(e.target.checked)}
        className="w-4 h-4 rounded border-white/[0.15] bg-white/[0.03] text-emerald-500 focus:ring-emerald-500"
      />
    </div>
    <span className="text-slate-400 text-xs leading-relaxed">
      I agree to the{' '}
      <Link href="/privacy" className="text-emerald-400 hover:text-emerald-300 underline">
        Privacy Policy
      </Link>
      {' '}and consent to my data being processed by AI services for career guidance.
    </span>
  </label>
</div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="group relative w-full py-4 bg-gradient-to-r from-blue-500 via-emerald-400 to-cyan-400 animate-gradient text-white font-bold rounded-2xl hover:opacity-90 transition-all duration-300 shadow-xl shadow-emerald-500/20 hover:shadow-2xl hover:shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="inline-flex items-center gap-2">
              {loading ? 'Creating account...' : 'Create Account'}
              {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
            </span>
          </button>

          {/* Login link */}
          <p className="text-center text-slate-500 text-sm mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </form>
    </div>
  )
}