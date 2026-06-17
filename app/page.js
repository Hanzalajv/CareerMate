'use client'
import { useState, useEffect } from 'react'
import { getCurrentUser } from '@/lib/auth'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function Home() {
  const [loaded, setLoaded] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setLoggedIn(false)
      }
    })
    
    getCurrentUser().then(u => {
      setLoggedIn(!!u)
      setLoaded(true)
    })
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #0F172A 0%, #1E293B 50%, #0F766E 100%)',
      color: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      overflow: 'hidden'
    }}>
      {/* Background Pattern */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        opacity: 0.03,
        backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
        backgroundSize: '60px 60px'
      }} />

      {/* Navigation */}
      <nav style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '24px 48px', position: 'relative', zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 28 }}>🧭</span>
          <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: 2 }}>CAREERMATE</span>
        </div>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          {loggedIn ? (
            <>
              <Link href="/dashboard" style={{
                padding: '10px 24px', borderRadius: 8, fontSize: 14, fontWeight: 600,
                background: '#10B981', color: 'white', textDecoration: 'none'
              }}>
                Dashboard
              </Link>
              <button onClick={async () => {
                const supabase = createClient()
                await supabase.auth.signOut()
                setLoggedIn(false)
              }} style={{
                padding: '10px 24px', borderRadius: 8, fontSize: 14, fontWeight: 600,
                background: 'transparent', color: '#EF4444',
                border: '1.5px solid rgba(239, 68, 68, 0.3)', cursor: 'pointer'
              }}>
                Log Out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" style={{
                padding: '10px 24px', borderRadius: 8, fontSize: 14, fontWeight: 600,
                color: 'white', textDecoration: 'none',
                border: '1.5px solid rgba(255,255,255,0.2)'
              }}>
                Sign In
              </Link>
              <Link href="/register" style={{
                padding: '10px 24px', borderRadius: 8, fontSize: 14, fontWeight: 600,
                background: '#10B981', color: 'white', textDecoration: 'none'
              }}>
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main style={{
        position: 'relative', zIndex: 10,
        maxWidth: 900, margin: '0 auto', padding: '80px 48px',
        textAlign: 'center'
      }}>
        <div style={{
          display: 'inline-block',
          padding: '8px 20px', borderRadius: 50,
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          fontSize: 14, color: '#10B981', fontWeight: 600,
          marginBottom: 32,
          opacity: loaded ? 1 : 0,
          transform: loaded ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.6s ease-out'
        }}>
          AI-Powered Career Counseling
        </div>

        <h1 style={{
          fontSize: 72, fontWeight: 900, lineHeight: 1.1,
          marginBottom: 24, letterSpacing: -2,
          opacity: loaded ? 1 : 0,
          transform: loaded ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 0.6s ease-out 0.1s'
        }}>
          Your AI Career<br />
          <span style={{ color: '#10B981' }}>Coach</span>
        </h1>

        <p style={{
          fontSize: 20, color: '#94A3B8', lineHeight: 1.6,
          maxWidth: 600, margin: '0 auto 48px',
          opacity: loaded ? 1 : 0,
          transform: loaded ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.6s ease-out 0.2s'
        }}>
          A deep, multi-session AI conversation that understands your skills, 
          passions, and constraints — then delivers personalized career recommendations 
          with accountability tracking.
        </p>

        <div style={{
          display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap',
          opacity: loaded ? 1 : 0,
          transform: loaded ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.6s ease-out 0.3s'
        }}>
          <Link href="/register" style={{
            padding: '18px 36px', borderRadius: 12,
            background: '#10B981', color: 'white',
            fontSize: 18, fontWeight: 700, textDecoration: 'none',
            boxShadow: '0 8px 30px rgba(16, 185, 129, 0.3)'
          }}>
            Find Your Career Path — Free
          </Link>
          <Link href="/how-it-works" style={{
            padding: '18px 36px', borderRadius: 12,
            background: 'rgba(255,255,255,0.05)', color: 'white',
            fontSize: 18, fontWeight: 600, textDecoration: 'none',
            border: '1.5px solid rgba(255,255,255,0.15)'
          }}>
            Learn More
          </Link>
        </div>

        {/* Stats */}
        <div style={{
          display: 'flex', gap: 48, justifyContent: 'center', marginTop: 80,
          opacity: loaded ? 1 : 0,
          transform: loaded ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.6s ease-out 0.4s'
        }}>
          {[
            { value: '8+', label: 'Deep Questions' },
            { value: '3', label: 'Career Paths' },
            { value: '24h', label: 'Analysis Time' },
            { value: '🔥', label: 'Streak Tracking' },
          ].map((stat, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#10B981' }}>{stat.value}</div>
              <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </main>

      {/* Features Section */}
      <section style={{
        position: 'relative', zIndex: 10,
        maxWidth: 1000, margin: '0 auto', padding: '80px 48px',
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 24
      }}>
        {[
          { 
            icon: '🧠', 
            title: 'Deep Profiling', 
            desc: 'AI asks 20+ realistic, contextual questions about your skills, interests, environment, and constraints — not generic surface-level questions.' 
          },
          { 
            icon: '⏳', 
            title: 'Delayed Analysis', 
            desc: 'After your session, the AI takes 24 hours to deeply analyze your profile and deliver truly personalized career recommendations.' 
          },
          { 
            icon: '📋', 
            title: 'Weekly Checklists', 
            desc: 'Get actionable weekly checklists with 5 specific tasks to explore your recommended career paths and build momentum.' 
          },
          { 
            icon: '🔥', 
            title: 'Streak Tracking', 
            desc: 'Log your daily progress and build a streak. Stay accountable to your career goals with gamified motivation.' 
          },
          { 
            icon: '💬', 
            title: 'Conversational Memory', 
            desc: 'The AI remembers everything you\'ve told it across sessions. No repeating yourself. A real conversation that builds over time.' 
          },
          { 
            icon: '📱', 
            title: 'Works Anywhere', 
            desc: 'Available on desktop, tablet, and mobile. Your career coach is always with you — no downloads required.' 
          },
        ].map((feature, i) => (
          <div key={i} style={{
            padding: 28, borderRadius: 16,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)'
          }}>
            <div style={{ fontSize: 36, marginBottom: 16 }}>{feature.icon}</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{feature.title}</h3>
            <p style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.6 }}>{feature.desc}</p>
          </div>
        ))}
      </section>

      {/* Call to Action */}
      <section style={{
        position: 'relative', zIndex: 10,
        maxWidth: 800, margin: '0 auto', padding: '80px 48px',
        textAlign: 'center'
      }}>
        <div style={{
          padding: 60, borderRadius: 24,
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.15)'
        }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, marginBottom: 16 }}>
            Ready to Find Your Career Path?
          </h2>
          <p style={{ fontSize: 18, color: '#94A3B8', maxWidth: 500, margin: '0 auto 32px' }}>
            Join thousands of students discovering their ideal careers with AI-powered coaching.
          </p>
          <Link href="/register" style={{
            padding: '18px 48px', borderRadius: 12,
            background: '#10B981', color: 'white',
            fontSize: 18, fontWeight: 700, textDecoration: 'none',
            display: 'inline-block',
            boxShadow: '0 8px 30px rgba(16, 185, 129, 0.3)'
          }}>
            Get Started — It's Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        position: 'relative', zIndex: 10,
        textAlign: 'center', padding: '40px 48px',
        color: '#475569', fontSize: 13,
        borderTop: '1px solid rgba(255,255,255,0.05)'
      }}>
        © 2026 CareerMate. Your AI career coach that actually knows you.
      </footer>
    </div>
  )
}