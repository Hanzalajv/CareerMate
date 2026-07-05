import { createClient } from '@/lib/supabase/server'

// ============================================================
// CONSTANTS
// ============================================================

export const MINIMUM_QUESTIONS = 20
export const MAXIMUM_QUESTIONS = 20

// ============================================================
// SESSION MANAGEMENT
// ============================================================

export async function getWeeklySessionCount(userId) {
  const supabase = await createClient()
  const weekStart = getWeekStartDate()

  const { count, error } = await supabase
    .from('deep_dive_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', weekStart)

  if (error) throw error
  return count || 0
}

export async function getActiveSession(userId) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('deep_dive_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'IN_PROGRESS')
    .maybeSingle()

  if (error) throw error
  return data
}

export async function createSession(userId, weekCount, context) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('deep_dive_sessions')
    .insert({
      user_id: userId,
      session_number: weekCount + 1,
      status: 'IN_PROGRESS',
      questions_answers: [],
      question_count: 0,
      total_questions: 20,
      structured_context: context
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getSession(sessionId) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('deep_dive_sessions')
    .select('*')
    .eq('session_id', sessionId)
    .single()

  if (error) throw error
  return data
}

export async function updateSession(sessionId, updates) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('deep_dive_sessions')
    .update(updates)
    .eq('session_id', sessionId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function completeSession(sessionId, transcript) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('deep_dive_sessions')
    .update({
      status: 'COMPLETED',
      raw_transcript: transcript,
      completed_at: new Date().toISOString()
    })
    .eq('session_id', sessionId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getUserSessions(userId, limit = 10) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('deep_dive_sessions')
    .select('session_id, session_number, status, question_count, started_at, completed_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

// ============================================================
// REPORT MANAGEMENT
// ============================================================

export async function saveReport(userId, sessionId, reportContent) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('deep_dive_reports')
    .insert({
      user_id: userId,
      session_id: sessionId,
      report_content: reportContent,
      checklist_generated: false
    })
    .select()
    .single()

  if (error) throw error

  await updateSession(sessionId, { status: 'ANALYZED' })

  return data
}

export async function getReport(sessionId) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('deep_dive_reports')
    .select('*')
    .eq('session_id', sessionId)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function getUserReports(userId) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('deep_dive_reports')
    .select(`
      report_id,
      session_id,
      generated_at,
      checklist_generated,
      session:deep_dive_sessions!inner(session_number, question_count)
    `)
    .eq('user_id', userId)
    .order('generated_at', { ascending: false })

  if (error) throw error
  return data
}

export async function markChecklistGenerated(reportId) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('deep_dive_reports')
    .update({ checklist_generated: true })
    .eq('report_id', reportId)

  if (error) throw error
}

// ============================================================
// AI PROMPT BUILDERS
// ============================================================

export function buildSystemPrompt(profile) {
  return `You are CareerMate, a friendly and perceptive career coach in Pakistan. You help people discover their ideal career path through a structured conversation.

Your role:
- Ask questions naturally, like a real person
- Reference things the user has already told you
- If the user gives a short or vague answer, gently ask for more detail
- Keep responses 1-3 sentences
- NEVER apologize. No "sorry."
- NEVER give career advice during questions — save it for the report
- Be warm, direct, and conversational`
}

export function buildReportPrompt(profile, questionsAnswers) {
  const qaFormatted = questionsAnswers.map((qa, i) =>
    `Q${i + 1} [${qa.category || 'General'}]: ${qa.question}\nA: ${qa.answer}`
  ).join('\n\n')

  const userQuotes = questionsAnswers
    .filter(qa => qa.answer && qa.answer.length > 30)
    .map(qa => `"${qa.answer.slice(0, 150)}"`)
    .slice(-10)

  return `You are CareerMate, a senior career strategist who creates deeply personalized, evidence-backed career reports. Your reports are worth paying for because they reference exact user statements, explain WHY every recommendation was made, and are brutally honest about the Pakistani market.

═══════════════════════════════════════
USER PROFILE
═══════════════════════════════════════
- Name: ${profile.display_name}
- Education: ${profile.education}
- Location: ${profile.location || 'Pakistan'}
- Skills: ${profile.skills?.join(', ') || 'Not specified'}
- Interests: ${profile.interests?.join(', ') || 'Not specified'}
- Work Preference: ${profile.preferences?.work_environment || 'Not specified'}
- Career Goals: ${profile.preferences?.career_goals || 'Not specified'}

═══════════════════════════════════════
COMPLETE ASSESSMENT (${questionsAnswers.length} questions answered)
═══════════════════════════════════════
${qaFormatted}

═══════════════════════════════════════
KEY USER QUOTES (Reference these in the report)
═══════════════════════════════════════
${userQuotes.map((q, i) => `Quote ${i + 1}: ${q}`).join('\n')}

═══════════════════════════════════════
REPORT REQUIREMENTS
═══════════════════════════════════════

Generate a comprehensive, premium-quality report. Return ONLY valid JSON, no markdown, no text outside the JSON.

{
  "user_snapshot": {
    "name": "${profile.display_name}",
    "sincerity_score": 7,
    "sincerity_explanation": "1-2 sentences explaining the sincerity score",
    "true_intention": "What they REALLY want — job, uni, switch, startup, stability, or escape",
    "immediate_goal": "The most urgent thing they need right now",
    "persona_summary": "2-3 sentences describing who this person is as a career seeker"
  },
  "summary": "3-4 sentence holistic assessment. Reference specific things they said.",
  "career_paths": [
    {
      "title": "Career name relevant to Pakistan",
      "match_percentage": 85,
      "why_suggested": {
        "based_on_their_words": "Quote exactly what they said that made you suggest this",
        "based_on_market": "Market-driven reason with real data",
        "based_on_profile": "How their education/skills/location fit"
      },
      "pakistan_scope": "Current demand, cities, companies, remote possibilities",
      "salary_range_pakistan": "Entry: PKR XX,XXX | 3 years: PKR XX,XXX | Senior: PKR XX,XXX",
      "education_required": "Specific degrees, certifications, institutions",
      "time_to_first_income": "E.g., '3 months freelance', '4 years degree'",
      "growth_outlook": "HIGH, MEDIUM, or LOW",
      "barriers_for_them": "Specific challenges for THIS person",
      "how_to_overcome": "Concrete steps",
      "where_to_start": ["Specific platform/institution", "Step 2", "Step 3"],
      "who_to_connect_with": "Types of people to network with in Pakistan"
    }
  ],
  "strengths": [
    {
      "strength": "Specific strength",
      "evidence": "Quote them directly"
    }
  ],
  "blind_spots": [
    {
      "blind_spot": "Something they never mentioned",
      "why_it_matters": "Why ignoring this hurts them"
    }
  ],
  "areas_to_develop": [
    {
      "skill": "Specific skill",
      "why_needed": "How this gap holds them back",
      "how_to_learn": "Concrete resource"
    }
  ],
  "pakistan_market_reality": {
    "overall_insight": "2-3 sentences on Pakistani market",
    "their_advantage": "What works in their favor",
    "their_disadvantage": "What works against them"
  },
  "income_reality_check": {
    "their_expectation": "What they want to earn",
    "market_reality": "What's realistic",
    "gap_analysis": "How to bridge the gap"
  },
  "six_month_roadmap": {
    "month_1": { "theme": "Foundation", "milestones": ["M1", "M2", "M3"], "checklist": [{"task": "Task", "category": "Skills", "priority": "HIGH"}] },
    "month_2": { "theme": "Skill Building", "milestones": ["M1", "M2", "M3"], "checklist": [{"task": "Task", "category": "Skills", "priority": "HIGH"}] },
    "month_3": { "theme": "Portfolio", "milestones": ["M1", "M2", "M3"], "checklist": [{"task": "Task", "category": "Application", "priority": "MEDIUM"}] },
    "month_4": { "theme": "Networking", "milestones": ["M1", "M2", "M3"], "checklist": [{"task": "Task", "category": "Networking", "priority": "MEDIUM"}] },
    "month_5": { "theme": "Applications", "milestones": ["M1", "M2", "M3"], "checklist": [{"task": "Task", "category": "Application", "priority": "HIGH"}] },
    "month_6": { "theme": "Launch", "milestones": ["M1", "M2", "M3"], "checklist": [{"task": "Task", "category": "Application", "priority": "HIGH"}] }
  },
  "if_this_fails": {
    "backup_path": "Plan B career in Pakistan",
    "why_backup": "Why this makes sense",
    "transition_plan": "How to pivot in 12 months"
  },
  "final_word": "2-3 sentence personal closing. Address them by name. Reference something they shared."
}

CRITICAL RULES:
- Reference EXACT quotes from the user.
- Every career must have a CLEAR "why" tied to their words, market, and profile.
- Be BRUTALLY honest about unrealistic expectations.
- The 6-month roadmap must be personalized, not generic.
- Use real Pakistani institution names, job boards, and company names.
- All salary figures in PKR.
- Return ONLY the JSON object.`
}

// ============================================================
// HELPERS
// ============================================================

function getWeekStartDate() {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(now.setDate(diff))
  monday.setHours(0, 0, 0, 0)
  return monday.toISOString()
}

export function buildTranscript(questionsAnswers) {
  return questionsAnswers.map((qa, i) =>
    `Q${i + 1}: ${qa.question}\nA: ${qa.answer}`
  ).join('\n\n')
}