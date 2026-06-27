import { createClient } from '@/lib/supabase/server'
import { 
  getActiveSession, 
  createSession, 
  getWeeklySessionCount,
  buildSystemPrompt,
  buildQuestionPrompt,
  DEEP_DIVE_CATEGORIES,
  MINIMUM_QUESTIONS,
  MAXIMUM_QUESTIONS
} from '@/lib/deep-dive'
import { fetchGemini } from '@/lib/ai/gemini'

export async function POST(request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return Response.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Check for existing active session (resume)
    const activeSession = await getActiveSession(user.id)
    
    if (activeSession) {
      const qa = activeSession.questions_answers || []
      const questionNumber = qa.length + 1
      
      // Generate next question based on previous answers
      const prompt = buildQuestionPrompt(qa, questionNumber)
      
      const response = await fetchGemini([
        { role: 'system', content: buildSystemPrompt(profile) },
        { role: 'user', content: prompt }
      ])

      return Response.json({
        resumed: true,
        session_id: activeSession.session_id,
        question_number: questionNumber,
        total_answered: qa.length,
        question: response,
        category_progress: getCategoryProgress(qa)
      })
    }

    // Check weekly limit
    const weekCount = await getWeeklySessionCount(user.id)
    if (weekCount >= 2) {
      return Response.json({
        error: 'Weekly limit reached',
        message: 'You have completed 2 Deep Dive sessions this week. Next session available on Monday.',
        sessions_used: weekCount
      }, { status: 429 })
    }

    // Create new session
    let session
    try {
      session = await createSession(user.id)
    } catch (createError) {
      // If duplicate (race condition), fetch the active session instead
      if (createError.message?.includes('duplicate') || createError.code === '23505') {
        const existingSession = await getActiveSession(user.id)
        if (existingSession) {
          const qa = existingSession.questions_answers || []
          const questionNumber = qa.length + 1
          
          const prompt = buildQuestionPrompt(qa, questionNumber)
          const response = await fetchGemini([
            { role: 'system', content: buildSystemPrompt(profile) },
            { role: 'user', content: prompt }
          ])

          return Response.json({
            resumed: true,
            session_id: existingSession.session_id,
            question_number: questionNumber,
            total_answered: qa.length,
            question: response,
            category_progress: getCategoryProgress(qa)
          })
        }
      }
      throw createError
    }

    // Generate first question
    const firstPrompt = `Start the Career Deep Dive assessment. Ask the first question to understand their financial reality and current situation. Keep it practical and specific to Pakistan. Do NOT ask about their passions or dreams — start with their real-world constraints and needs.`

    const firstQuestion = await fetchGemini([
      { role: 'system', content: buildSystemPrompt(profile) },
      { role: 'user', content: firstPrompt }
    ])

    return Response.json({
      resumed: false,
      session_id: session.session_id,
      question_number: 1,
      total_answered: 0,
      question: firstQuestion,
      sessions_remaining: 2 - (weekCount + 1)
    })

  } catch (error) {
    console.error('Deep Dive Start Error:', error)
    return Response.json(
      { error: error.message || 'Failed to start session' },
      { status: 500 }
    )
  }
}

function getCategoryProgress(questionsAnswers) {
  const categoryCount = {}
  questionsAnswers.forEach(qa => {
    if (qa.category) {
      categoryCount[qa.category] = (categoryCount[qa.category] || 0) + 1
    }
  })
  
  return DEEP_DIVE_CATEGORIES.map(c => ({
    category: c.category,
    required: c.required,
    asked: categoryCount[c.category] || 0,
    complete: (categoryCount[c.category] || 0) >= c.required
  }))
}