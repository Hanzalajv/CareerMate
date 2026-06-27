import { createClient } from '@/lib/supabase/server'

// ============================================================
// CONSTANTS
// ============================================================

export const DEEP_DIVE_CATEGORIES = [
  {
    category: "Financial Reality",
    required: 3,
    topics: [
      "Current financial needs",
      "Income expectations (now vs 5 years)",
      "Willingness to trade passion for money",
      "Financial dependents"
    ]
  },
  {
    category: "Current Skills & Earning Potential",
    required: 3,
    topics: [
      "Existing marketable skills",
      "Access to laptop/internet",
      "English proficiency",
      "Fastest skill to learn for income"
    ]
  },
  {
    category: "Family & Social Context",
    required: 3,
    topics: [
      "Family career expectations",
      "Parental pressure vs freedom",
      "Family financial dependency",
      "Support for non-traditional paths"
    ]
  },
  {
    category: "Work Style & Environment",
    required: 2,
    topics: [
      "Office job vs remote vs own business",
      "Relocation willingness within Pakistan",
      "Structured vs flexible work"
    ]
  },
  {
    category: "Market Awareness",
    required: 3,
    topics: [
      "Knowledge of in-demand Pakistani careers",
      "Awareness of freelancing vs job vs business",
      "Exposure to online earning",
      "Realistic market understanding"
    ]
  },
  {
    category: "Learning Capacity & Commitment",
    required: 3,
    topics: [
      "Hours available per week for learning",
      "History of completing courses/goals",
      "Current obstacles (money/time/guidance/fear)",
      "Readiness for a structured plan"
    ]
  },
  {
    category: "Long-Term Direction",
    required: 3,
    topics: [
      "5-year vision (realistic, not fantasy)",
      "Backup plan if dream fails",
      "Stay in Pakistan or go abroad mindset",
      "Definition of career success"
    ]
  }
]

export const MINIMUM_QUESTIONS = 20
export const MAXIMUM_QUESTIONS = 30

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

export async function createSession(userId) {
  const supabase = await createClient()

  const weekCount = await getWeeklySessionCount(userId)
  if (weekCount >= 2) {
    throw new Error('Weekly session limit reached. Next session available next week.')
  }

  const { data, error } = await supabase
    .from('deep_dive_sessions')
    .insert({
      user_id: userId,
      session_number: weekCount + 1,
      status: 'IN_PROGRESS',
      questions_answers: [],
      question_count: 0,
      total_questions: MINIMUM_QUESTIONS
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

  // Mark session as analyzed
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
  return `You are CareerMate, a warm and experienced career counselor in Pakistan. You're having a real conversation with someone who needs guidance.

USER PROFILE:
- Name: ${profile.display_name || 'Student'}
- Education: ${profile.education || 'Not specified'}
- Location: ${profile.location || 'Pakistan'}
- Skills: ${profile.skills?.join(', ') || 'Not specified'}
- Interests: ${profile.interests?.join(', ') || 'Not specified'}
- Work Preference: ${profile.preferences?.work_environment || 'Not specified'}
- Career Goals: ${profile.preferences?.career_goals || 'Not specified'}

YOUR ROLE:
You're doing a Career Deep Dive — a conversation to understand this person deeply and guide them toward a realistic career in Pakistan.

TOPICS TO COVER (organically, not in order):
- Financial needs and expectations
- Current skills and how quickly they can earn
- Family pressure and expectations
- Work environment preferences
- Knowledge of the Pakistani job market
- Learning capacity and commitment
- Long-term vision

CONVERSATION STYLE:
- This is a CONVERSATION, not an interview. Talk like a real person.
- If they give a short or irrelevant answer, ACKNOWLEDGE it first, then gently guide back.
  Example: "I get it, not everyone has this figured out yet. Let me ask it differently..."
- If they seem confused or frustrated, stop and address that first.
  Example: "I know these questions can feel a bit much. Let's take a step back..."
- If they say something interesting, FOLLOW UP naturally.
  Example: "That's interesting — tell me more about that..."
- If they ask YOU a question, answer it briefly, then continue.
- NEVER sound like you're reading from a script.
- NEVER ignore what they just said to ask your next question.
- NEVER apologize unnecessarily. Don't say "sorry" or "my apologies."
- NEVER show internal data or categories to the user.

PROGRESS TRACKING:
- You must track how many MEANINGFUL answers the user has given.
- A meaningful answer is thoughtful, detailed, or reveals something about them.
- Short answers like "idk", "yes", "no", "ok", "what", "hmm" are NOT meaningful.
- At the END of EVERY response, include the progress like this: [Progress: X/20]
- X = number of meaningful answers so far.
- If the current answer was meaningful, increase X by 1.
- If the current answer was short or dismissive, keep X the same.
- Example: "That makes sense. [Progress: 4/20] Now tell me..."
- Example: "No worries, let's try a different angle. [Progress: 3/20] What about..."
- When X reaches 20, say EXACTLY:
  "I now have enough insight to create your Career Deep Dive report. Let me analyze everything and prepare your personalized guidance. This will take just a moment..."
- You can go up to 25 total questions if needed to reach 20 meaningful answers.
- NEVER exceed [Progress: 20/20].

DO NOT give career advice during the questions. Save it all for the final report.`
}

export function buildQuestionPrompt(questionsAnswers, questionNumber) {
  const recentQA = questionsAnswers.slice(-5)
  const lastAnswer = questionsAnswers[questionsAnswers.length - 1]?.answer || ''

  // Count questions per category
  const categoryCount = {}
  questionsAnswers.forEach(qa => {
    if (qa.category) {
      categoryCount[qa.category] = (categoryCount[qa.category] || 0) + 1
    }
  })

  const progress = DEEP_DIVE_CATEGORIES.map(c => {
    const asked = categoryCount[c.category] || 0
    const done = asked >= c.required
    return `${c.category}: ${asked}/${c.required} ${done ? '✅' : '⬜'}`
  }).join('\n')

  const incompleteCategories = DEEP_DIVE_CATEGORIES
    .filter(c => (categoryCount[c.category] || 0) < c.required)
    .map(c => c.category)

  // Extract all questions already asked
  const askedQuestions = questionsAnswers.map(qa => qa.question)

  return `Question #${questionNumber}

CATEGORY PROGRESS (for you only, DO NOT show to user):
${progress}

${incompleteCategories.length > 0 ? `STILL NEEDED: ${incompleteCategories.join(', ')}` : 'ALL CATEGORIES COVERED. Ask follow-ups if needed or wrap up.'}

QUESTIONS ALREADY ASKED (DO NOT REPEAT THESE):
${askedQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

RECENT CONVERSATION:
${recentQA.map(qa => `You: ${qa.question}\nUser: ${qa.answer}`).join('\n\n')}

THE USER JUST SAID: "${lastAnswer}"

YOUR TASK:
1. ACKNOWLEDGE what they just said. If it's off-topic, short, or confused, respond to that naturally first.
2. Decide if their answer was MEANINGFUL (thoughtful, detailed, revealing) or NOT (short, dismissive, "idk", "yes", "no", "ok").
3. Include [Progress: X/20] at the end of your response.
   - If meaningful, increase X by 1.
   - If not meaningful, keep X the same.
4. Ask your next question naturally. Prioritize incomplete categories.
5. Keep it 1-3 sentences. Be warm, direct, and conversational.

CRITICAL: 
- Do NOT show the category progress or internal data to the user.
- Do NOT repeat a question you've already asked.
- The [Progress: X/20] is the ONLY thing you show to the user about progress.`
}

export function buildReportPrompt(profile, questionsAnswers) {
  const qaFormatted = questionsAnswers.map((qa, i) =>
    `Q${i + 1} [${qa.category || 'General'}]: ${qa.question}\nA: ${qa.answer}`
  ).join('\n\n')

  return `You are CareerMate, a senior career counselor specializing in the Pakistani job market.

Generate a comprehensive Career Deep Dive report based on this assessment.

USER PROFILE:
- Name: ${profile.display_name}
- Education: ${profile.education}
- Location: ${profile.location || 'Pakistan'}
- Skills: ${profile.skills?.join(', ') || 'Not specified'}
- Interests: ${profile.interests?.join(', ') || 'Not specified'}
- Work Preference: ${profile.preferences?.work_environment || 'Not specified'}
- Career Goals: ${profile.preferences?.career_goals || 'Not specified'}

COMPLETE ASSESSMENT (${questionsAnswers.length} questions):
${qaFormatted}

Generate a report in this EXACT JSON format. Return ONLY valid JSON, no markdown, no explanation outside the JSON.

{
  "summary": "2-3 sentence overall assessment of this person's situation and potential",
  "career_paths": [
    {
      "title": "Career name relevant to Pakistan",
      "match_percentage": 85,
      "description": "Why this career fits their specific profile and answers",
      "pakistan_scope": "Current demand and future outlook in Pakistan",
      "salary_range_pakistan": "Realistic salary range in PKR (entry to experienced)",
      "education_required": "What degree, certification, or skills needed",
      "time_to_start_earning": "How quickly they can start earning (e.g., 3 months, 1 year, 4 years)",
      "growth_outlook": "HIGH, MEDIUM, or LOW",
      "where_to_learn": ["Specific Pakistani institutions, online platforms, or programs"],
      "next_steps": ["Step 1", "Step 2", "Step 3"]
    }
  ],
  "strengths": ["3-5 specific strengths based on their answers"],
  "areas_to_develop": ["2-3 practical skills or mindsets they need to work on"],
  "pakistan_market_insight": "2-3 sentences on the current Pakistani job market relevant to their profile",
  "income_reality_check": "Honest assessment of their income expectations vs market reality",
  "immediate_actions": ["3-5 things they can do THIS WEEK"],
  "three_month_plan": ["3 specific milestones for the next 3 months"],
  "long_term_vision": "Suggested 5-year trajectory based on their profile",
  "checklist": [
    {
      "task": "Specific, actionable task",
      "category": "Education, Skills, Networking, Application, Mindset",
      "priority": "HIGH, MEDIUM, or LOW",
      "deadline": "This week, 2 weeks, 1 month, 3 months"
    }
  ]
}

IMPORTANT:
- Career paths MUST be realistic for Pakistan (not Silicon Valley dreams unless they're exceptional)
- Include both traditional paths (government, banking, teaching) AND modern ones (tech, freelancing, digital marketing) if relevant
- Be honest if their expectations are unrealistic
- The checklist must be specific and actionable
- Return ONLY the JSON object, nothing else`
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