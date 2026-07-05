import { createClient } from '@/lib/supabase/server'
import { 
  getSession,
  updateSession,
  completeSession,
  buildSystemPrompt,
  buildReportPrompt,
  buildTranscript,
  saveReport
} from '@/lib/deep-dive'
import { fetchGemini } from '@/lib/ai/gemini'
import { createEmptyContext, updateContext, buildQuestionPrompt, buildRetryPrompt } from '@/lib/context'
import { QUESTIONS, validateAnswer, getMaxRetries } from '@/lib/questions'

export async function POST(request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sessionId, answer, questionId } = await request.json()

    if (!sessionId || !answer) {
      return Response.json({ error: 'Missing sessionId or answer' }, { status: 400 })
    }

    // Get session
    const session = await getSession(sessionId)
    
    if (!session) {
      return Response.json({ error: 'Session not found' }, { status: 404 })
    }

    if (session.user_id !== user.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (session.status !== 'IN_PROGRESS') {
      return Response.json({ error: 'Session is not active' }, { status: 400 })
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Load context
    let context = session.structured_context || createEmptyContext(profile)

    // Get current question
    const currentQuestionNumber = (session.questions_answers?.length || 0) + 1
    const currentQuestion = QUESTIONS[currentQuestionNumber - 1]
    
    if (!currentQuestion) {
      return Response.json({ error: 'All questions completed' }, { status: 400 })
    }

    // Validate the answer
    const validation = validateAnswer(currentQuestion.id, answer)
    
    // Get retry count
    const retryCount = context.progress.retry_count?.[currentQuestion.id] || 0
    const maxRetries = getMaxRetries()

    // If answer is invalid and we haven't exceeded retries
    if (!validation.valid && retryCount < maxRetries) {
      // Increment retry count
      if (!context.progress.retry_count) context.progress.retry_count = {}
      context.progress.retry_count[currentQuestion.id] = retryCount + 1
      
      // Save retry count
      await updateSession(sessionId, { structured_context: context })

      // Ask AI to rephrase the question
 const retryPrompt = buildRetryPrompt(context, currentQuestion.question, answer, currentQuestion.id)
      const retryResponse = await fetchGemini([
        { role: 'system', content: buildSystemPrompt(profile) },
        { role: 'user', content: retryPrompt }
      ], { maxTokens: 200 })

      return Response.json({
        retry: true,
        question: retryResponse,
        question_number: currentQuestionNumber,
        question_id: currentQuestion.id,
        hint: validation.reason
      })
    }

    // Answer is valid (or max retries reached) — accept it
    // Update context with the answer
    context = updateContext(context, currentQuestion.id, answer)
    
    // Reset retry count for this question
    if (context.progress.retry_count) {
      delete context.progress.retry_count[currentQuestion.id]
    }

    // Add to Q&A history
    const updatedQA = [
      ...(session.questions_answers || []),
      {
        question: session.last_question || currentQuestion.question,
        answer: answer,
        question_id: currentQuestion.id,
        category: currentQuestion.category,
        timestamp: new Date().toISOString()
      }
    ]

    const nextQuestionNumber = currentQuestionNumber + 1

    // Check if session is complete
    if (currentQuestionNumber >= 20) {
      // Generate report
      const transcript = buildTranscript(updatedQA)
      await completeSession(sessionId, transcript)

      const reportPrompt = buildReportPrompt(profile, updatedQA)
      
      const reportResponse = await fetchGemini([
        { role: 'system', content: 'You are a career report generator. Return ONLY valid JSON.' },
        { role: 'user', content: reportPrompt }
      ], { maxTokens: 4000 })

      // Parse report
      let reportContent = null
      try {
        let cleaned = reportResponse
          .replace(/```json\s*/g, '').replace(/```\s*/g, '')
        const jsonStart = cleaned.indexOf('{')
        const jsonEnd = cleaned.lastIndexOf('}') + 1
        if (jsonStart >= 0 && jsonEnd > jsonStart) {
          cleaned = cleaned.slice(jsonStart, jsonEnd)
        }
        cleaned = cleaned.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']').replace(/\n/g, ' ').replace(/\t/g, ' ').trim()
        reportContent = JSON.parse(cleaned)
      } catch (parseError) {
        // Retry once
        try {
          const retryPrompt = `Generate a VALID JSON report. Return ONLY the JSON object.\n\n${reportPrompt}`
          const retryResponse = await fetchGemini([
            { role: 'system', content: 'Return ONLY valid JSON. No markdown.' },
            { role: 'user', content: retryPrompt }
          ])
          let cleanedRetry = retryResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '')
          const rs = cleanedRetry.indexOf('{'), re = cleanedRetry.lastIndexOf('}') + 1
          if (rs >= 0 && re > rs) cleanedRetry = cleanedRetry.slice(rs, re)
          cleanedRetry = cleanedRetry.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']').replace(/\n/g, ' ').trim()
          reportContent = JSON.parse(cleanedRetry)
        } catch (retryError) {
          return Response.json({ error: 'Failed to generate report' }, { status: 500 })
        }
      }

      if (reportContent) {
        await saveReport(user.id, sessionId, reportContent)

               // Create checklist from 6-month roadmap
        let allChecklistItems = []

        if (reportContent.six_month_roadmap) {
          Object.entries(reportContent.six_month_roadmap).forEach(([key, month]) => {
            if (month.checklist && month.checklist.length > 0) {
              month.checklist.forEach(item => {
                allChecklistItems.push({
                  task: item.task,
                  category: item.category || 'General',
                  priority: item.priority || 'MEDIUM',
                  deadline: item.deadline || 'This month',
                  month: parseInt(key.replace('month_', '')) || 1,
                  completed: false,
                  completed_at: null
                })
              })
            }
          })
        }

        // Fallback to flat checklist if no roadmap
        if (allChecklistItems.length === 0 && reportContent.checklist && reportContent.checklist.length > 0) {
          allChecklistItems = reportContent.checklist.map(item => ({
            task: item.task,
            category: item.category || 'General',
            priority: item.priority || 'MEDIUM',
            deadline: item.deadline || 'This month',
            month: item.month || 1,
            completed: false,
            completed_at: null
          }))
        }

        if (allChecklistItems.length > 0) {
          await supabase.from('user_checklists').insert({
            user_id: user.id,
            report_id: sessionId,
            month_number: 1,
            status: 'NOT_STARTED',
            items: allChecklistItems
          })
        }

        await updateSession(sessionId, {
          questions_answers: updatedQA,
          question_count: updatedQA.length,
          last_question: null,
          structured_context: context
        })

        return Response.json({
          complete: true,
          session_id: sessionId,
          total_questions: updatedQA.length,
          message: 'Your Career Deep Dive report is ready!'
        })
      }
    }

    // Not complete — get next question
  
const nextQuestion = QUESTIONS[currentQuestionNumber]
const prompt = buildQuestionPrompt(context, nextQuestion.question, nextQuestionNumber, nextQuestion.id)
    
    const aiResponse = await fetchGemini([
      { role: 'system', content: buildSystemPrompt(profile) },
      { role: 'user', content: prompt }
    ], { maxTokens: 300 })

    // Save
    await updateSession(sessionId, {
      questions_answers: updatedQA,
      question_count: updatedQA.length,
      last_question: aiResponse,
      structured_context: context
    })

    return Response.json({
      complete: false,
      session_id: sessionId,
      question_number: nextQuestionNumber,
      question: aiResponse,
      question_id: nextQuestion.id,
      questions_remaining: 20 - currentQuestionNumber
    })

  } catch (error) {
    console.error('Deep Dive Answer Error:', error)
    return Response.json(
      { error: error.message || 'Failed to process answer' },
      { status: 500 }
    )
  }
}