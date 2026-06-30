'use client'
import { useState, useEffect } from 'react'
import { getCurrentUser, getOrCreateProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { 
  Compass, Star, Rocket, Lightbulb, Target, BookOpen, Brain, 
  Dumbbell, Flame, Zap, GraduationCap, Trophy, Palette, Crown,
  Sprout, Sparkles, User, MapPin, Check, ArrowRight, X
} from 'lucide-react'

const AVATAR_ICONS = [
  { icon: Compass, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', label: 'Explorer' },
  { icon: Star, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: 'Star' },
  { icon: Rocket, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', label: 'Ambitious' },
  { icon: Lightbulb, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', label: 'Thinker' },
  { icon: Target, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', label: 'Focused' },
  { icon: Brain, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', label: 'Intellectual' },
  { icon: Flame, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', label: 'Passionate' },
  { icon: Zap, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', label: 'Energetic' },
  { icon: GraduationCap, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', label: 'Scholar' },
  { icon: Trophy, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: 'Winner' },
  { icon: Palette, color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20', label: 'Creative' },
  { icon: Crown, color: 'text-slate-300', bg: 'bg-slate-500/10', border: 'border-slate-500/20', label: 'Leader' },
  { icon: Sprout, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', label: 'Growing' },
  { icon: Sparkles, color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20', label: 'Dreamer' },
  { icon: Dumbbell, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', label: 'Disciplined' },
  { icon: BookOpen, color: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/20', label: 'Learner' },
]

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

    const [displayName, setDisplayName] = useState('')
    const [selectedAvatar, setSelectedAvatar] = useState(0)
    const [education, setEducation] = useState('')
    const [selectedInterests, setSelectedInterests] = useState([])
    const [skills, setSkills] = useState('')
    const [careerGoals, setCareerGoals] = useState('')
    const [preferredWorkEnvironment, setPreferredWorkEnvironment] = useState('')
    const [location, setLocation] = useState('')

    useEffect(() => {
        getCurrentUser().then(async u => {
            if (!u) { router.push('/login'); return }
            setUser(u)

            const { data: profile, error: profileError } = await getOrCreateProfile(u.id, u.user_metadata?.display_name || '')
            
            if (profileError) { setLoading(false); return }

            if (profile) {
                if (profile.display_name) setDisplayName(profile.display_name)
                if (profile.education) setEducation(profile.education)
                if (profile.interests && profile.interests.length > 0) setSelectedInterests(profile.interests)
                if (profile.skills && profile.skills.length > 0) setSkills(profile.skills.join(', '))
                if (profile.location) setLocation(profile.location)
                if (profile.preferences?.work_environment) setPreferredWorkEnvironment(profile.preferences.work_environment)
                if (profile.preferences?.career_goals) setCareerGoals(profile.preferences.career_goals)
                
                if (profile.is_complete) { router.push('/dashboard'); return }
            }

            setLoading(false)
        })
    }, [])

    const toggleInterest = (interest) => {
        setSelectedInterests(prev =>
            prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
        )
    }

    async function handleSubmit(e) {
        e.preventDefault()
        setError('')
        setSaving(true)

        if (!displayName.trim() || displayName.trim().length < 2) {
            setError('Please enter a valid display name (minimum 2 characters).'); setSaving(false); return
        }
        if (!education) {
            setError('Please select your education level.'); setSaving(false); return
        }
        if (selectedInterests.length === 0) {
            setError('Please select at least one area of interest.'); setSaving(false); return
        }

        try {
            const profileData = {
                user_id: user.id,
                display_name: displayName.trim(),
                avatar: AVATAR_ICONS[selectedAvatar].label,
                education,
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

            const { error: upsertError } = await supabase
                .from('user_profiles')
                .upsert(profileData, { onConflict: 'user_id' })

            if (upsertError) throw upsertError

            setSuccess(true)
            setTimeout(() => router.push('/onboarding'), 2000)
        } catch (err) {
            setError(err.message || 'Something went wrong. Please try again.')
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

    if (success) {
        return (
            <div className="min-h-screen bg-[#070b14] flex items-center justify-center p-6">
                <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/[0.06] rounded-3xl p-12 lg:p-14 text-center max-w-md w-full shadow-2xl shadow-black/50 scale-in">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6 animate-float">
                        <Check className="w-10 h-10 text-emerald-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-3">Profile Complete!</h1>
                    <p className="text-slate-400 text-base mb-2">Welcome, {displayName}</p>
                    <p className="text-slate-600 text-sm">Redirecting you to your career journey...</p>
                </div>
            </div>
        )
    }

    const SelectedAvatarIcon = AVATAR_ICONS[selectedAvatar].icon

    return (
        <div className="min-h-screen bg-[#070b14] flex items-center justify-center relative overflow-hidden p-6">
            {/* Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-500/[0.03] blur-[140px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-emerald-500/[0.03] blur-[130px]" />
            </div>

            {/* Grid texture */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.015]" style={{
                backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
                backgroundSize: '50px 50px'
            }} />

            <form onSubmit={handleSubmit} className="relative z-10 w-full max-w-xl">
                <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/[0.06] rounded-3xl p-8 lg:p-10 shadow-2xl shadow-black/50 max-h-[88vh] overflow-y-auto">
                    
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 via-emerald-500/20 to-cyan-500/20 border border-white/10 mb-5">
                            <User className="w-8 h-8 text-emerald-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">Tell Us About Yourself</h1>
                        <p className="text-slate-500 text-sm">This helps us personalize your career journey.</p>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 flex items-start gap-3">
                            <X className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Display Name */}
                    <div className="mb-6">
                        <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                            Display Name *
                        </label>
                        <input
                            type="text"
                            placeholder="Your full name"
                            value={displayName}
                            onChange={e => setDisplayName(e.target.value)}
                            maxLength={30}
                            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3.5 text-white placeholder-slate-600 text-base outline-none focus:border-emerald-500/50 focus:bg-white/[0.05] transition-all duration-300"
                        />
                    </div>

                    {/* Avatar Picker */}
                    <div className="mb-6">
                        <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">
                            Choose Your Avatar
                        </label>
                        
                        {/* Current selection preview */}
                        <div className="flex items-center gap-4 mb-4 p-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
                            <div className={`w-14 h-14 rounded-2xl ${AVATAR_ICONS[selectedAvatar].bg} border ${AVATAR_ICONS[selectedAvatar].border} flex items-center justify-center flex-shrink-0`}>
                                <SelectedAvatarIcon className={`w-7 h-7 ${AVATAR_ICONS[selectedAvatar].color}`} />
                            </div>
                            <div>
                                <p className="text-white text-sm font-medium">{AVATAR_ICONS[selectedAvatar].label}</p>
                                <p className="text-slate-500 text-xs">This represents you on CareerMate</p>
                            </div>
                        </div>

                        {/* Icon grid */}
                        <div className="grid grid-cols-8 gap-2.5">
                            {AVATAR_ICONS.map((item, i) => {
                                const Icon = item.icon
                                return (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => setSelectedAvatar(i)}
                                        title={item.label}
                                        className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 ${
                                            selectedAvatar === i
                                                ? `${item.bg} border ${item.border} scale-110 shadow-lg`
                                                : 'bg-white/[0.02] border border-transparent hover:bg-white/[0.06] hover:border-white/[0.08]'
                                        }`}
                                    >
                                        <Icon className={`w-5 h-5 ${selectedAvatar === i ? item.color : 'text-slate-600'}`} />
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Education */}
                    <div className="mb-6">
                        <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                            Education Level *
                        </label>
                        <select
                            value={education}
                            onChange={e => setEducation(e.target.value)}
                            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3.5 text-white text-base outline-none focus:border-emerald-500/50 transition-all duration-300 cursor-pointer [&>option]:bg-slate-800 [&>option]:text-white [&>option]:py-2"
                        >
                            <option value="">Select your education level</option>
                            {EDUCATION_LEVELS.map(level => (
                                <option key={level} value={level}>{level}</option>
                            ))}
                        </select>
                    </div>

                    {/* Interests */}
                    <div className="mb-6">
                        <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">
                            Areas of Interest *
                        </label>
                        <p className="text-slate-600 text-xs mb-3">Select all that apply — we'll use this to personalize your career recommendations.</p>
                        <div className="flex flex-wrap gap-2.5">
                            {INTERESTS.map(interest => (
                                <button
                                    key={interest}
                                    type="button"
                                    onClick={() => toggleInterest(interest)}
                                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                                        selectedInterests.includes(interest)
                                            ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 shadow-sm'
                                            : 'bg-white/[0.02] border border-white/[0.05] text-slate-400 hover:text-white hover:bg-white/[0.05] hover:border-white/[0.1]'
                                    }`}
                                >
                                    {interest}
                                </button>
                            ))}
                        </div>
                        {selectedInterests.length > 0 && (
                            <p className="text-emerald-400 text-xs mt-2">{selectedInterests.length} selected</p>
                        )}
                    </div>

                    {/* Skills */}
                    <div className="mb-6">
                        <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                            Skills
                        </label>
                        <p className="text-slate-600 text-xs mb-2">Enter your skills separated by commas. What are you naturally good at?</p>
                        <input
                            type="text"
                            placeholder="e.g. Python, Communication, Leadership, Problem Solving"
                            value={skills}
                            onChange={e => setSkills(e.target.value)}
                            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3.5 text-white placeholder-slate-600 text-base outline-none focus:border-emerald-500/50 focus:bg-white/[0.05] transition-all duration-300"
                        />
                    </div>

                    {/* Location */}
                    <div className="mb-6">
                        <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                            Location
                        </label>
                        <p className="text-slate-600 text-xs mb-2">Helps us give you local job market insights and realistic salary data.</p>
                        <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                            <input
                                type="text"
                                placeholder="City, Country (e.g. Lahore, Pakistan)"
                                value={location}
                                onChange={e => setLocation(e.target.value)}
                                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-slate-600 text-base outline-none focus:border-emerald-500/50 focus:bg-white/[0.05] transition-all duration-300"
                            />
                        </div>
                    </div>

                    {/* Work Environment */}
                    <div className="mb-6">
                        <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">
                            Preferred Work Environment
                        </label>
                        <p className="text-slate-600 text-xs mb-3">Do you like working alone, in teams, or a mix? This helps us match you with the right career paths.</p>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { value: 'Remote', desc: 'Work from anywhere' },
                                { value: 'Hybrid', desc: 'Mix of office & home' },
                                { value: 'In-Office', desc: 'Traditional office setting' },
                                { value: 'Flexible', desc: 'Adaptable to any setup' },
                            ].map(env => (
                                <button
                                    key={env.value}
                                    type="button"
                                    onClick={() => setPreferredWorkEnvironment(env.value)}
                                    className={`px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 text-left ${
                                        preferredWorkEnvironment === env.value
                                            ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 shadow-sm'
                                            : 'bg-white/[0.02] border border-white/[0.05] text-slate-400 hover:text-white hover:bg-white/[0.05] hover:border-white/[0.1]'
                                    }`}
                                >
                                    <span className="block">{env.value}</span>
                                    <span className="block text-xs mt-0.5 opacity-70">{env.desc}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Career Goals */}
                    <div className="mb-8">
                        <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                            Career Goals
                        </label>
                        <p className="text-slate-600 text-xs mb-2">What do you hope to achieve in your career? What are you curious about?</p>
                        <textarea
                            placeholder="e.g. I want to work in tech but I'm not sure which path to take. I enjoy problem-solving and want a career that pays well in Pakistan..."
                            value={careerGoals}
                            onChange={e => setCareerGoals(e.target.value)}
                            rows={4}
                            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3.5 text-white placeholder-slate-600 text-base outline-none focus:border-emerald-500/50 focus:bg-white/[0.05] transition-all duration-300 resize-none"
                        />
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={saving}
                        className="group w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-2xl hover:opacity-90 transition-all duration-300 shadow-xl shadow-emerald-500/20 hover:shadow-2xl hover:shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-base"
                    >
                        <span className="inline-flex items-center gap-2">
                            {saving ? 'Saving...' : 'Continue to Onboarding'}
                            {!saving && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                        </span>
                    </button>

                    <p className="text-slate-600 text-xs text-center mt-5">
                        Fields marked with * are required. We'll use this information to personalize your entire CareerMate experience.
                    </p>
                </div>
            </form>
        </div>
    )
}