'use client'
import { useState, useEffect } from 'react'
import { getCurrentUser, getOrCreateProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const EMOJI_AVATARS = ['🧭', '🌟', '🚀', '💡', '🎯', '📚', '🧠', '💪', '🔥', '⚡', '🎓', '🏆', '🌈', '🦅', '🌱', '✨']

const EDUCATION_LEVELS = [
    'High School Student',
    'College Freshman',
    'College Sophomore',
    'College Junior',
    'College Senior',
    "Bachelor's Graduate",
    "Master's Student",
    "Master's Graduate",
    'PhD Student',
    'PhD Graduate',
    'Professional',
    'Career Changer'
]

const INTERESTS = [
    'Technology', 'Science', 'Arts', 'Business', 'Healthcare',
    'Education', 'Engineering', 'Finance', 'Marketing', 'Design',
    'Writing', 'Research', 'Social Impact', 'Entrepreneurship',
    'Data Science', 'AI/ML', 'Software Development', 'Product Management'
]

export default function SetupProfile() {
    const supabase = createClient()
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const router = useRouter()

    // Form fields
    const [displayName, setDisplayName] = useState('')
    const [selectedEmoji, setSelectedEmoji] = useState('🧭')
    const [education, setEducation] = useState('')
    const [selectedInterests, setSelectedInterests] = useState([])
    const [skills, setSkills] = useState('')
    const [careerGoals, setCareerGoals] = useState('')
    const [preferredWorkEnvironment, setPreferredWorkEnvironment] = useState('')
    const [location, setLocation] = useState('')

    useEffect(() => {
        getCurrentUser().then(async u => {
            if (!u) {
                router.push('/login')
                return
            }
            setUser(u)

            // Check if profile exists, if not create one
            const { data: profile, error: profileError } = await getOrCreateProfile(u.id, u.user_metadata?.display_name || '')
            
            if (profileError) {
                console.error('Profile error:', profileError)
                setLoading(false)
                return
            }

            if (profile) {
                // Pre-fill form with existing data
                if (profile.display_name) setDisplayName(profile.display_name)
                if (profile.avatar) setSelectedEmoji(profile.avatar)
                if (profile.education) setEducation(profile.education)
                if (profile.interests && profile.interests.length > 0) setSelectedInterests(profile.interests)
                if (profile.skills && profile.skills.length > 0) setSkills(profile.skills.join(', '))
                if (profile.location) setLocation(profile.location)
                if (profile.preferences?.work_environment) setPreferredWorkEnvironment(profile.preferences.work_environment)
                if (profile.preferences?.career_goals) setCareerGoals(profile.preferences.career_goals)
                
                // If profile is complete, redirect to dashboard
                if (profile.is_complete) {
                    router.push('/dashboard')
                    return
                }
            }

            setLoading(false)
        })
    }, [])

    const toggleInterest = (interest) => {
        setSelectedInterests(prev =>
            prev.includes(interest)
                ? prev.filter(i => i !== interest)
                : [...prev, interest]
        )
    }

    async function handleSubmit(e) {
        e.preventDefault()
        setError('')
        setSaving(true)

        // Validation
        if (!displayName.trim() || displayName.trim().length < 2) {
            setError('Please enter a valid display name (minimum 2 characters).')
            setSaving(false)
            return
        }

        if (!education) {
            setError('Please select your education level.')
            setSaving(false)
            return
        }

        if (selectedInterests.length === 0) {
            setError('Please select at least one area of interest.')
            setSaving(false)
            return
        }

        try {
            const profileData = {
                user_id: user.id,
                display_name: displayName.trim(),
                avatar: selectedEmoji,
                education: education,
                interests: selectedInterests,
                skills: skills.split(',').map(s => s.trim()).filter(Boolean),
                location: location.trim() || null,
                preferences: {
                    work_environment: preferredWorkEnvironment || null,
                    career_goals: careerGoals.trim() || null
                },
                onboarding_answers: [],
                onboarding_completed: false,
                is_complete: true,
                updated_at: new Date().toISOString()
            }

            console.log('Saving profile data:', profileData)

            const { data, error: upsertError } = await supabase
                .from('user_profiles')
                .upsert(profileData, {
                    onConflict: 'user_id'
                })
                .select()

            if (upsertError) {
                console.error('Upsert error:', upsertError)
                throw upsertError
            }

            console.log('Profile saved successfully:', data)

            setSuccess(true)
            setSaving(false)

            // In setup-profile/page.js — after successful save
if (data?.onboarding_completed) {
    router.push('/dashboard')
} else {
    router.push('/onboarding')
}

            setTimeout(() => {
                router.push('/onboarding')
            }, 2000)

        } catch (err) {
            console.error('Error saving profile:', err)
            setError(err.message || 'Something went wrong. Please try again.')
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

    if (success) {
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
                    <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
                    <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Profile Complete!</h1>
                    <p style={{ color: '#94A3B8', fontSize: 16, marginBottom: 8 }}>
                        Welcome, {displayName}
                    </p>
                    <p style={{ color: '#64748B', fontSize: 14 }}>
                        Redirecting you to your career journey...
                    </p>
                </div>
            </div>
        )
    }

    // ... rest of the form JSX (same as before)
    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(160deg, #0F172A 0%, #1E293B 50%, #0F766E 100%)',
            padding: 24
        }}>
            <form onSubmit={handleSubmit} style={{
                background: 'rgba(255,255,255,0.03)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 20,
                padding: 48,
                width: '100%',
                maxWidth: 560,
                boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
                maxHeight: '90vh',
                overflowY: 'auto'
            }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <h1 style={{ fontSize: 28, fontWeight: 800, color: 'white' }}>Tell Us About Yourself</h1>
                    <p style={{ color: '#94A3B8', fontSize: 14, marginTop: 8 }}>
                        This helps us personalize your career journey
                    </p>
                </div>

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

                {/* Display Name */}
                <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', color: '#94A3B8', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                        Display Name *
                    </label>
                    <input
                        type="text"
                        placeholder="Your name"
                        value={displayName}
                        onChange={e => setDisplayName(e.target.value)}
                        maxLength={30}
                        style={{
                            width: '100%',
                            padding: '14px 16px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 10,
                            color: 'white',
                            fontSize: 15,
                            outline: 'none',
                            transition: 'border 0.2s'
                        }}
                        onFocus={e => e.target.style.borderColor = '#10B981'}
                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                    />
                </div>

                {/* Avatar */}
                <div style={{ marginBottom: 20, textAlign: 'center' }}>
                    <label style={{ display: 'block', color: '#94A3B8', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                        Avatar
                    </label>
                    <div style={{ fontSize: 48, marginBottom: 8 }}>{selectedEmoji}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                        {EMOJI_AVATARS.map(emoji => (
                            <button
                                key={emoji}
                                type="button"
                                onClick={() => setSelectedEmoji(emoji)}
                                style={{
                                    fontSize: 28,
                                    padding: 8,
                                    borderRadius: 12,
                                    background: selectedEmoji === emoji ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)',
                                    border: selectedEmoji === emoji ? '2px solid #10B981' : '2px solid transparent',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Education */}
                <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', color: '#94A3B8', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                        Education Level *
                    </label>
                    <select
                        value={education}
                        onChange={e => setEducation(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '14px 16px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 10,
                            color: 'white',
                            fontSize: 15,
                            outline: 'none'
                        }}
                    >
                        <option value="">Select your education level</option>
                        {EDUCATION_LEVELS.map(level => (
                            <option key={level} value={level} style={{ background: '#1E293B' }}>{level}</option>
                        ))}
                    </select>
                </div>

                {/* Interests */}
                <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', color: '#94A3B8', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                        Areas of Interest * <span style={{ color: '#64748B', fontWeight: 400 }}>(select all that apply)</span>
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {INTERESTS.map(interest => (
                            <button
                                key={interest}
                                type="button"
                                onClick={() => toggleInterest(interest)}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: 20,
                                    fontSize: 13,
                                    fontWeight: 500,
                                    background: selectedInterests.includes(interest) ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)',
                                    border: selectedInterests.includes(interest) ? '1px solid #10B981' : '1px solid rgba(255,255,255,0.1)',
                                    color: selectedInterests.includes(interest) ? '#10B981' : '#94A3B8',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {interest}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Skills */}
                <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', color: '#94A3B8', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                        Skills <span style={{ color: '#64748B', fontWeight: 400 }}>(comma separated)</span>
                    </label>
                    <input
                        type="text"
                        placeholder="e.g. Python, Communication, Leadership"
                        value={skills}
                        onChange={e => setSkills(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '14px 16px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 10,
                            color: 'white',
                            fontSize: 15,
                            outline: 'none'
                        }}
                        onFocus={e => e.target.style.borderColor = '#10B981'}
                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                    />
                </div>

                {/* Location */}
                <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', color: '#94A3B8', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                        Location <span style={{ color: '#64748B', fontWeight: 400 }}>(optional)</span>
                    </label>
                    <input
                        type="text"
                        placeholder="City, Country (helps with local job market insights)"
                        value={location}
                        onChange={e => setLocation(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '14px 16px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 10,
                            color: 'white',
                            fontSize: 15,
                            outline: 'none'
                        }}
                        onFocus={e => e.target.style.borderColor = '#10B981'}
                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                    />
                </div>

                {/* Work Environment */}
                <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', color: '#94A3B8', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                        Preferred Work Environment <span style={{ color: '#64748B', fontWeight: 400 }}>(optional)</span>
                    </label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {['Remote', 'Hybrid', 'In-Office', 'Flexible'].map(env => (
                            <button
                                key={env}
                                type="button"
                                onClick={() => setPreferredWorkEnvironment(env)}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: 20,
                                    fontSize: 13,
                                    fontWeight: 500,
                                    background: preferredWorkEnvironment === env ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)',
                                    border: preferredWorkEnvironment === env ? '1px solid #10B981' : '1px solid rgba(255,255,255,0.1)',
                                    color: preferredWorkEnvironment === env ? '#10B981' : '#94A3B8',
                                    cursor: 'pointer'
                                }}
                            >
                                {env}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Career Goals */}
                <div style={{ marginBottom: 28 }}>
                    <label style={{ display: 'block', color: '#94A3B8', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                        Career Goals <span style={{ color: '#64748B', fontWeight: 400 }}>(optional)</span>
                    </label>
                    <textarea
                        placeholder="What do you hope to achieve in your career? What are you curious about?"
                        value={careerGoals}
                        onChange={e => setCareerGoals(e.target.value)}
                        rows={3}
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
                </div>

                <button
                    type="submit"
                    disabled={saving}
                    style={{
                        width: '100%',
                        padding: '16px',
                        background: saving ? '#0F766E' : '#10B981',
                        color: 'white',
                        border: 'none',
                        borderRadius: 12,
                        fontSize: 16,
                        fontWeight: 700,
                        cursor: saving ? 'wait' : 'pointer',
                        boxShadow: '0 8px 30px rgba(16,185,129,0.25)',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => { if (!saving) e.target.style.background = '#059669' }}
                    onMouseLeave={e => { if (!saving) e.target.style.background = '#10B981' }}
                >
                    {saving ? 'Saving...' : 'Continue to Onboarding →'}
                </button>

                <p style={{ textAlign: 'center', marginTop: 16, color: '#64748B', fontSize: 12 }}>
                    Fields with * are required. We'll use this to personalize your experience.
                </p>
            </form>
        </div>
    )
}