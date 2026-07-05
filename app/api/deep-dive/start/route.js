import { createClient } from '@/lib/supabase/server'
import { 
  getActiveSession, 
  getWeeklySessionCount,
  createSession,
  buildSystemPrompt
} from '@/lib/deep-dive'
import { fetchGemini } from '@/lib/ai/gemini'
import { createEmptyContext, buildQuestionPrompt } from '@/lib/context'
import { QUESTIONS } from '@/lib/questions'

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
      const context = activeSession.structured_context || createEmptyContext(profile)
      
      // Find current question number
      const currentQuestionNumber = qa.length + 1
      
      if (currentQuestionNumber > 20) {
        return Response.json({ error: 'Session complete — all 20 questions answered' }, { status: 400 })
      }
      
      const question = QUESTIONS[currentQuestionNumber - 1]
      const prompt = buildQuestionPrompt(context, question.question, currentQuestionNumber)
      
      const response = await fetchGemini([
        { role: 'system', content: buildSystemPrompt(profile) },
        { role: 'user', content: prompt }
      ])

      return Response.json({
        resumed: true,
        session_id: activeSession.session_id,
        question_number: currentQuestionNumber,
        total_answered: qa.length,
        question: response,
        question_id: question.id
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
    const context = createEmptyContext(profile)
    
    let session
    try {
      session = await createSession(user.id, weekCount, context)
    } catch (createError) {
      if (createError.message?.includes('duplicate') || createError.code === '23505') {
        const existingSession = await getActiveSession(user.id)
        if (existingSession) {
          const qa = existingSession.questions_answers || []
          const currentQuestionNumber = qa.length + 1
          const question = QUESTIONS[currentQuestionNumber - 1]
          const prompt = buildQuestionPrompt(context, question.question, currentQuestionNumber)
          
          const response = await fetchGemini([
            { role: 'system', content: buildSystemPrompt(profile) },
            { role: 'user', content: prompt }
          ])

          return Response.json({
            resumed: true,
            session_id: existingSession.session_id,
            question_number: currentQuestionNumber,
            total_answered: qa.length,
            question: response,
            question_id: question.id
          })
        }
      }
      throw createError
    }

    // First question
    const firstQuestion = QUESTIONS[0]
    const prompt = buildQuestionPrompt(context, firstQuestion.question, 1)
    
    const response = await fetchGemini([
      { role: 'system', content: buildSystemPrompt(profile) },
      { role: 'user', content: prompt }
    ])

    return Response.json({
      resumed: false,
      session_id: session.session_id,
      question_number: 1,
      total_answered: 0,
      question: response,
      question_id: firstQuestion.id,
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