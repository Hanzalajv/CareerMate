'use client'
import { useState, useEffect } from 'react'
import { loginUser, getCurrentUser } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const router = useRouter()

  // Check if user is already logged in
  useEffect(() => {
    getCurrentUser().then(u => {
      if (u) {
        router.replace('/dashboard')
      } else {
        setChecking(false)
      }
    })
  }, [])

  // Show nothing while checking
  if (checking) return null

  async function handleLogin(e) {
    e.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('Please enter your email address.')
      return
    }
    if (!password) {
      setError('Please enter your password.')
      return
    }

    setLoading(true)
    const { user, error: authError } = await loginUser(email, password)
    console.log('Login result:', user, authError)
    setLoading(false)

    if (authError) {
      setError(authError)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(160deg, #0F172A 0%, #1E293B 50%, #0F766E 100%)',
      padding: 24
    }}>
      <form onSubmit={handleLogin} style={{
        background: 'rgba(255,255,255,0.03)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 20, padding: 48, width: '100%', maxWidth: 420,
        boxShadow: '0 25px 60px rgba(0,0,0,0.3)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <span style={{ fontSize: 40 }}>🧭</span>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'white', marginTop: 12, letterSpacing: -1 }}>
            Welcome Back
          </h1>
          <p style={{ color: '#94A3B8', fontSize: 14, marginTop: 8 }}>
            Sign in to continue your career journey
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 10, padding: '12px 16px', marginBottom: 20,
            color: '#EF4444', fontSize: 13
          }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', color: '#94A3B8', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
            Email Address
          </label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{
              width: '100%', padding: '14px 16px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10, color: 'white', fontSize: 15,
              outline: 'none', transition: 'all 0.3s'
            }}
            onFocus={e => e.target.style.borderColor = '#10B981'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
        </div>

        <div style={{ marginBottom: 28 }}>
          <label style={{ display: 'block', color: '#94A3B8', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
            Password
          </label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{
              width: '100%', padding: '14px 16px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10, color: 'white', fontSize: 15,
              outline: 'none', transition: 'all 0.3s'
            }}
            onFocus={e => e.target.style.borderColor = '#10B981'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%', padding: '16px',
            background: loading ? '#0F766E' : '#10B981',
            color: 'white', border: 'none', borderRadius: 12,
            fontSize: 16, fontWeight: 700, cursor: loading ? 'wait' : 'pointer',
            transition: 'all 0.3s',
            boxShadow: '0 8px 30px rgba(16, 185, 129, 0.25)'
          }}
          onMouseEnter={e => {
            if (!loading) e.target.style.background = '#059669'
          }}
          onMouseLeave={e => {
            if (!loading) e.target.style.background = '#10B981'
          }}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>

        <p style={{ textAlign: 'center', marginTop: 24, color: '#64748B', fontSize: 14 }}>
          Don&apos;t have an account?{' '}
          <Link href="/register" style={{ color: '#10B981', fontWeight: 700, textDecoration: 'none' }}>
            Create one
          </Link>
        </p>
      </form>
    </div>
  )
}