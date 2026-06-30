import { createClient } from '@/lib/supabase/server'
import { 
  getSession,
  updateSession,
  completeSession,
  buildSystemPrompt,
  buildQuestionPrompt,
  buildReportPrompt,
  buildTranscript,
  saveReport,
  MINIMUM_QUESTIONS,
  MAXIMUM_QUESTIONS,
  DEEP_DIVE_CATEGORIES
} from '@/lib/deep-dive'
import { fetchGemini } from '@/lib/ai/gemini'

export async function POST(request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sessionId, answer } = await request.json()

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

    // Determine which category the last question belonged to
    const lastCategory = detectCategory(session.questions_answers, answer)

    // Add answer to session
    const updatedQA = [
      ...(session.questions_answers || []),
      {
        question: session.last_question || 'Question',
        answer: answer,
        category: lastCategory,
        timestamp: new Date().toISOString()
      }
    ]

    const questionNumber = updatedQA.length + 1
    // Check if session should end
    const shouldEnd = checkIfShouldEnd(updatedQA)

    // Also check the latest AI question for [Progress: 20/20]
    const lastAIQuestion = session.last_question || ''
    const aiSaysComplete = lastAIQuestion.includes('[Progress: 20/20]') ||
                           lastAIQuestion.includes('[Progress:20/20]')

    if (shouldEnd || aiSaysComplete) {
      // Complete the session
      const transcript = buildTranscript(updatedQA)
      await completeSession(sessionId, transcript)

      // Generate report
      const reportPrompt = buildReportPrompt(profile, updatedQA)
      
      const reportResponse = await fetchGemini([
        { role: 'system', content: 'You are a career report generator. Return ONLY valid JSON.' },
        { role: 'user', content: reportPrompt }
      ], { maxTokens: 4000 })
      // Parse and save report
      let reportContent = null

      // First attempt
      try {
        let cleanedResponse = reportResponse
        
        // Remove markdown code blocks
        cleanedResponse = cleanedResponse.replace(/```json\s*/g, '')
        cleanedResponse = cleanedResponse.replace(/```\s*/g, '')
        
        // Find JSON object boundaries
        const jsonStart = cleanedResponse.indexOf('{')
        const jsonEnd = cleanedResponse.lastIndexOf('}') + 1
        
        if (jsonStart >= 0 && jsonEnd > jsonStart) {
          cleanedResponse = cleanedResponse.slice(jsonStart, jsonEnd)
        }
        
        // Try to fix common JSON issues
        cleanedResponse = cleanedResponse
          .replace(/,\s*}/g, '}')
          .replace(/,\s*]/g, ']')
          .replace(/\n/g, ' ')
          .replace(/\t/g, ' ')
          .trim()
        
        reportContent = JSON.parse(cleanedResponse)
        
      } catch (parseError) {
        console.error('Report parsing error (first attempt):', parseError)
        console.error('Raw response (first 500 chars):', reportResponse.slice(0, 500))
        
        // Second attempt with stricter prompt
        try {
          console.log('Retrying report generation...')
          
          const retryPrompt = `Your previous response had formatting errors. Generate a VALID JSON report now. Return ONLY the JSON object. Start with { and end with }. No markdown, no explanations, no text outside the JSON.

${reportPrompt}`
          
          const retryResponse = await fetchGemini([
            { role: 'system', content: 'You are a JSON generator. Return ONLY valid JSON. No markdown. No explanations. Start with { and end with }.' },
            { role: 'user', content: retryPrompt }
          ])
          
          let cleanedRetry = retryResponse
            .replace(/```json\s*/g, '')
            .replace(/```\s*/g, '')
          
          const jsonStart = cleanedRetry.indexOf('{')
          const jsonEnd = cleanedRetry.lastIndexOf('}') + 1
          
          if (jsonStart >= 0 && jsonEnd > jsonStart) {
            cleanedRetry = cleanedRetry.slice(jsonStart, jsonEnd)
          }
          
          cleanedRetry = cleanedRetry
            .replace(/,\s*}/g, '}')
            .replace(/,\s*]/g, ']')
            .replace(/\n/g, ' ')
            .replace(/\t/g, ' ')
            .trim()
          
          reportContent = JSON.parse(cleanedRetry)
          console.log('Retry succeeded!')
          
        } catch (retryError) {
          console.error('Report parsing error (retry also failed):', retryError)
          console.error('Retry response (first 500 chars):', retryResponse?.slice(0, 500))
          return Response.json(
            { error: 'Failed to generate report after multiple attempts. Please start a new session.' },
            { status: 500 }
          )
        }
      }

      // If we have report content, save it
      if (reportContent) {
        await saveReport(user.id, sessionId, reportContent)

        // Create checklist from report
if (reportContent.checklist && reportContent.checklist.length > 0) {
  const checklistItems = reportContent.checklist.map(item => ({
    task: item.task,
    category: item.category || 'General',
    priority: item.priority || 'MEDIUM',
    deadline: item.deadline || 'This month',
    completed: false,
    completed_at: null
  }))

  await supabase
    .from('user_checklists')
    .insert({
      user_id: user.id,
      report_id: sessionId,
      month_number: 1,
      status: 'NOT_STARTED',
      items: checklistItems
    })
}

        // Update session with last Q&A
        await updateSession(sessionId, {
          questions_answers: updatedQA,
          question_count: updatedQA.length,
          last_question: null
        })

        return Response.json({
          complete: true,
          session_id: sessionId,
          total_questions: updatedQA.length,
          message: 'Your Career Deep Dive report is ready!',
          report_id: reportContent.report_id
        })
      }
    }

    // Generate next question
    const questionPrompt = buildQuestionPrompt(updatedQA, questionNumber)
    
   const nextQuestion = await fetchGemini([
  { role: 'user', content: questionPrompt }
], { maxTokens: 500 })

    // Save updated session
    await updateSession(sessionId, {
      questions_answers: updatedQA,
      question_count: updatedQA.length,
      last_question: nextQuestion
    })

    // Calculate category progress
    const categoryProgress = getCategoryProgress(updatedQA)

    return Response.json({
      complete: false,
      session_id: sessionId,
      question_number: questionNumber,
      question: nextQuestion,
      category_progress: categoryProgress,
      questions_remaining: MINIMUM_QUESTIONS - updatedQA.length
    })

  } catch (error) {
    console.error('Deep Dive Answer Error:', error)
    return Response.json(
      { error: error.message || 'Failed to process answer' },
      { status: 500 }
    )
  }
}

function detectCategory(previousQA, answer) {
  // Simple keyword-based category detection
  const answerText = answer.toLowerCase()
  
  const categoryKeywords = {
    'Financial Reality': ['money', 'earn', 'income', 'salary', 'pkr', 'lakh', 'crore', 'financial', 'pay', 'budget'],
    'Current Skills & Earning Potential': ['skill', 'laptop', 'internet', 'english', 'computer', 'learn', 'course', 'certificate'],
    'Family & Social Context': ['family', 'parents', 'mother', 'father', 'pressure', 'expect', 'support', 'allow'],
    'Work Style & Environment': ['office', 'home', 'remote', 'business', 'freelance', 'move', 'relocate', 'city'],
    'Market Awareness': ['market', 'demand', 'scope', 'future', 'trend', 'opportunity', 'know about'],
    'Learning Capacity & Commitment': ['hour', 'time', 'study', 'focus', 'dedicate', 'commit', 'finish', 'quit'],
    'Long-Term Direction': ['year', 'future', 'goal', 'dream', 'abroad', 'foreign', 'visa', 'settle', 'backup']
  }

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => answerText.includes(keyword))) {
      return category
    }
  }

  // Fallback: use last category or general
  if (previousQA && previousQA.length > 0) {
    const lastCat = previousQA[previousQA.length - 1].category
    if (lastCat) return lastCat
  }

  return 'General'
}
function checkIfShouldEnd(questionsAnswers) {
  const count = questionsAnswers.length

  // Check if AI has already said 20/20
  let maxProgress = 0
  questionsAnswers.forEach(qa => {
    const match = qa.question?.match(/\[Progress:\s*(\d+)\/20\]/)
    if (match) {
      const progress = parseInt(match[1])
      if (progress > maxProgress) maxProgress = progress
    }
  })
  
  // End if AI said 20/20
  if (maxProgress >= 20) return true

  // Must have at least minimum questions
  if (count < MINIMUM_QUESTIONS) return false

  // Check if all categories are covered
  const categoryCount = {}
  questionsAnswers.forEach(qa => {
    if (qa.category) {
      categoryCount[qa.category] = (categoryCount[qa.category] || 0) + 1
    }
  })

  const allCategoriesCovered = DEEP_DIVE_CATEGORIES.every(c => 
    (categoryCount[c.category] || 0) >= c.required
  )

  // End if all categories covered OR max questions reached
  return allCategoriesCovered || count >= MAXIMUM_QUESTIONS
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