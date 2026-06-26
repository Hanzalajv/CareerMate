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
  return `You are CareerMate, a practical career guide for Pakistani students and young professionals.

USER PROFILE:
- Name: ${profile.display_name || 'Student'}
- Education: ${profile.education || 'Not specified'}
- Location: ${profile.location || 'Pakistan'}
- Skills: ${profile.skills?.join(', ') || 'Not specified'}
- Interests: ${profile.interests?.join(', ') || 'Not specified'}
- Work Preference: ${profile.preferences?.work_environment || 'Not specified'}
- Career Goals: ${profile.preferences?.career_goals || 'Not specified'}

YOUR ROLE — Career Deep Dive Assessment:

You have already reviewed their profile. Now dig deeper using these specific questions as your guide. Ask ONE at a time. Do NOT repeat questions you've already asked.

CORE QUESTIONS (ask these, adapted to the user's profile):

MONEY & REALITY:
1. How much do you need to earn per month right now to feel stable?
2. In 5 years, what income would make you feel you've made it?
3. Is there a career in Pakistan you know pays well but you're not sure how to get into it?
4. Would you rather earn PKR 100K doing something boring, or PKR 50K doing something interesting?

SKILLS & SHORTEST PATH TO INCOME:
5. What's one thing you already know how to do that people would pay for?
6. If you had 3 months to learn a skill and start earning, what would you pick?
7. Do you have access to a laptop and stable internet? Be honest.
8. Can you communicate in English confidently, or does that hold you back?

FAMILY & SOCIAL PRESSURE:
9. What career would make your parents proud — even if you don't care about it?
10. Is there a career your family has already suggested? What is it?
11. Would your family support you doing something non-traditional, like freelancing or tech?
12. Are you expected to support your family financially, or just yourself?

REALISTIC PATHWAYS:
13. Do you know anyone in Pakistan earning well without a government job? What do they do?
14. Would you rather work in an office, from home, or run your own small business?
15. Are you willing to move to Karachi/Lahore/Islamabad for work, or must you stay in your city?
16. If you had to start earning within 6 months with the skills you have right now, what would you do?

MARKET AWARENESS:
17. Name 3 careers in Pakistan that you think are in high demand right now.
18. Have you ever searched online for 'high paying skills in Pakistan'? What did you find?
19. Do you know the difference between a job, freelancing, and running a business — and which one suits you?
20. If I told you that learning a skill for 3-6 months could double your income, would you do it?

COMMITMENT CHECK:
21. How many hours a week can you realistically spend learning something new?
22. Have you ever started an online course and not finished it? Why?
23. What's stopping you right now from starting — money, time, guidance, or fear?
24. Are you ready to follow a step-by-step plan if I give you one?

RULES:
- Ask ONE question at a time
- Track which questions you've already asked — NEVER repeat
- You can ask follow-up questions to go deeper on an answer
- Adapt the wording to sound natural and conversational
- After covering enough questions (minimum 20), when you have real insight, say EXACTLY:
  "I now have enough insight to create your Career Deep Dive report. Let me analyze everything and prepare your personalized guidance. This will take just a moment..."

DO NOT give career advice during the questions. Save it all for the final report.
DO NOT show any category progress, question numbers, or internal data to the user.`
}


export function buildQuestionPrompt(questionsAnswers, questionNumber) {
  const recentQA = questionsAnswers.slice(-5)

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

  return `Career Deep Dive — Question #${questionNumber}

CATEGORY PROGRESS (for you only, DO NOT show to user):
${progress}

${incompleteCategories.length > 0 ? `STILL NEEDED: ${incompleteCategories.join(', ')}` : 'ALL CATEGORIES COVERED. Ask follow-ups if needed or wrap up.'}

QUESTIONS ALREADY ASKED (DO NOT REPEAT THESE):
${askedQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

RECENT ANSWERS:
${recentQA.map(qa => `Q: ${qa.question}\nA: ${qa.answer}`).join('\n\n')}

Ask your next question. Pick from the core questions list that hasn't been asked yet.
If all core questions are covered, ask a relevant follow-up based on their answers.
Keep it to 1-2 sentences. Be practical, warm, and direct.

CRITICAL: 
- Do NOT show the category progress or question numbers to the user
- Do NOT repeat a question you've already asked
- Just ask the question, nothing else`
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