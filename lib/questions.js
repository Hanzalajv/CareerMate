// ============================================================
// 20 HARDCODED QUESTIONS — The backbone of CareerMate
// ============================================================

export const QUESTIONS = [
  // PHASE 1: Intention & Reality Check
  {
    id: 1,
    question: "What brought you here — are you looking for a job, university guidance, a career switch, or are you just exploring your options?",
    category: "intention",
    minLength: 10,
    contextField: "progress.intention",
    validation: {
      mustNotBe: ['idk', 'i don\'t know', 'not sure', 'maybe', 'just looking'],
      shouldIndicate: ['job', 'university', 'career', 'switch', 'exploring', 'business', 'startup', 'guidance', 'clarity']
    }
  },
  {
    id: 2,
    question: "If money wasn't a factor, what would you do with your time?",
    category: "motivation",
    minLength: 10,
    contextField: "motivation.primary_driver",
    validation: {
      mustNotBe: ['idk', 'i don\'t know', 'sleep', 'nothing', 'just relax'],
      shouldIndicate: ['passion', 'learn', 'build', 'create', 'teach', 'help', 'travel', 'work']
    }
  },
  {
    id: 3,
    question: "What's the one career your family expects you to pursue?",
    category: "family",
    minLength: 5,
    contextField: "family.expectation",
    validation: {
      mustNotBe: ['idk', 'nothing', 'anything'],
      shouldIndicate: ['doctor', 'engineer', 'government', 'army', 'teacher', 'business', 'software', 'it', 'tech', 'css', 'pcs', 'banking', 'whatever', 'any']
    }
  },
  {
    id: 4,
    question: "How many months can you realistically go without income while you learn or search for the right opportunity?",
    category: "financial",
    minLength: 5,
    contextField: "financial.runway_months",
    validation: {
      mustNotBe: ['idk', 'i don\'t know'],
      shouldIndicate: ['month', 'year', '0', '1', '2', '3', '6', '12', 'supported', 'family']
    }
  },
  {
    id: 5,
    question: "What's the minimum monthly income you'd need to feel financially stable right now? Be specific — give me a number in PKR.",
    category: "financial",
    minLength: 5,
    contextField: "financial.minimum_income",
    validation: {
      mustNotBe: ['idk', 'i don\'t know', 'anything', 'whatever'],
      shouldIndicate: ['pkr', 'rs', 'rupees', 'lac', 'lakh', 'k', '000', 'crore']
    }
  },

  // PHASE 2: Skills — Claimed vs Real
  {
    id: 6,
    question: "What's something you're genuinely better at than most people you know? Don't be modest.",
    category: "skills",
    minLength: 10,
    contextField: "skills.claimed",
    validation: {
      mustNotBe: ['idk', 'nothing', 'i don\'t know', 'not sure'],
      shouldIndicate: ['speak', 'write', 'code', 'design', 'teach', 'explain', 'solve', 'build', 'create', 'lead', 'organize', 'learn']
    }
  },
  {
    id: 7,
    question: "What have you actually built, created, or done that you're proud of — even if it was small? A project, an event, a achievement.",
    category: "skills",
    minLength: 15,
    contextField: "skills.verified",
    requiresEvidence: true,
    validation: {
      mustNotBe: ['idk', 'nothing', 'i haven\'t', 'never'],
      shouldIndicate: ['built', 'made', 'created', 'project', 'app', 'website', 'event', 'won', 'completed', 'started', 'sold']
    }
  },
  {
    id: 8,
    question: "What's a skill you've always wanted to learn but never started? And what's stopped you?",
    category: "skills",
    minLength: 10,
    contextField: "skills.aspired",
    validation: {
      mustNotBe: ['idk', 'nothing', 'none'],
      shouldIndicate: ['learn', 'time', 'money', 'difficult', 'scared', 'lazy', 'busy', 'course', 'never']
    }
  },
  {
    id: 9,
    question: "If I asked someone who knows you well what your biggest weakness is, what would they say? Be honest.",
    category: "skills",
    minLength: 5,
    contextField: "skills.blind_spots",
    validation: {
      mustNotBe: ['idk', 'nothing', 'perfect', 'none'],
      shouldIndicate: ['lazy', 'procrastinate', 'angry', 'shy', 'quiet', 'distracted', 'late', 'bored', 'quit', 'focus', 'discipline']
    }
  },

  // PHASE 3: Work Reality & Environment
  {
    id: 10,
    question: "Do you work better alone, in a team, or leading a team? Give me a real example from your life.",
    category: "work_style",
    minLength: 10,
    contextField: "work_style.preference",
    validation: {
      mustNotBe: ['idk', 'both', 'depends'],
      shouldIndicate: ['alone', 'team', 'lead', 'group', 'solo', 'myself', 'people', 'manage']
    }
  },
  {
    id: 11,
    question: "Would you relocate to Karachi, Lahore, or Islamabad for the right job? What might stop you?",
    category: "work_style",
    minLength: 5,
    contextField: "work_style.relocation",
    validation: {
      mustNotBe: ['idk', 'maybe'],
      shouldIndicate: ['yes', 'no', 'family', 'money', 'move', 'relocate', 'stay', 'city', 'lahore', 'karachi', 'islamabad']
    }
  },
  {
    id: 12,
    question: "Would you rather have a stable job with fixed salary, or unpredictable income that could be much higher?",
    category: "work_style",
    minLength: 5,
    contextField: "work_style.risk_tolerance",
    validation: {
      mustNotBe: ['idk', 'both'],
      shouldIndicate: ['stable', 'fixed', 'unpredictable', 'higher', 'risk', 'safe', 'security', 'more']
    }
  },
  {
    id: 13,
    question: "Have you ever earned money yourself — freelancing, tutoring, selling anything, even a small amount?",
    category: "experience",
    minLength: 5,
    contextField: "experience.earned_before",
    validation: {
      mustNotBe: [],
      shouldIndicate: ['yes', 'no', 'freelance', 'tutor', 'sold', 'earned', 'made', 'worked', 'job', 'never']
    }
  },

  // PHASE 4: Market Awareness
  {
    id: 14,
    question: "Name three careers in Pakistan you think pay well right now. Where did you learn that?",
    category: "market",
    minLength: 10,
    contextField: "market.awareness_level",
    validation: {
      mustNotBe: ['idk', 'i don\'t know'],
      shouldIndicate: ['software', 'doctor', 'engineer', 'business', 'marketing', 'data', 'freelance', 'banking', 'it', 'tech']
    }
  },
  {
    id: 15,
    question: "Do you know anyone personally working in a field you're interested in? Who are they and what do they do?",
    category: "network",
    minLength: 5,
    contextField: "network.has_contacts",
    validation: {
      mustNotBe: [],
      shouldIndicate: ['yes', 'no', 'friend', 'family', 'cousin', 'uncle', 'senior', 'teacher', 'know', 'works']
    }
  },
  {
    id: 16,
    question: "Have you ever looked at job listings on Rozee.pk, LinkedIn, or other job boards? What did you find?",
    category: "market",
    minLength: 5,
    contextField: "market.researched",
    validation: {
      mustNotBe: [],
      shouldIndicate: ['yes', 'no', 'rozee', 'linkedin', 'indeed', 'job', 'posting', 'looked', 'searched', 'found', 'never']
    }
  },

  // PHASE 5: Commitment & Future
  {
    id: 17,
    question: "How many hours a week can you honestly dedicate to learning something new right now? Give me a number.",
    category: "learning",
    minLength: 3,
    contextField: "learning.hours_per_week",
    validation: {
      mustNotBe: ['idk', 'depends'],
      shouldIndicate: ['hour', 'hr', '0', '1', '2', '3', '4', '5', '10', '15', '20', '30', 'week']
    }
  },
  {
    id: 18,
    question: "Tell me about a time you started something and actually finished it — a course, a project, a book, anything.",
    category: "learning",
    minLength: 10,
    contextField: "learning.completion_history",
    validation: {
      mustNotBe: ['idk', 'nothing', 'never', 'i haven\'t'],
      shouldIndicate: ['completed', 'finished', 'did', 'built', 'made', 'course', 'project', 'book', 'started']
    }
  },
  {
    id: 19,
    question: "If your first career choice doesn't work out in 2 years, what's your backup plan?",
    category: "long_term",
    minLength: 5,
    contextField: "long_term.backup_plan",
    validation: {
      mustNotBe: ['idk', 'i don\'t know', 'nothing', 'no plan'],
      shouldIndicate: ['backup', 'plan', 'alternative', 'fallback', 'try', 'switch', 'start', 'learn', 'if']
    }
  },
  {
    id: 20,
    question: "Where do you genuinely see yourself in 5 years? Not your dream — your honest prediction.",
    category: "long_term",
    minLength: 10,
    contextField: "long_term.vision_5yr",
    validation: {
      mustNotBe: ['idk', 'i don\'t know'],
      shouldIndicate: ['job', 'career', 'earning', 'working', 'business', 'abroad', 'married', 'house', 'company']
    }
  }
]

// ============================================================
// VALIDATION HELPER
// ============================================================

/**
 * Checks if a user answer is valid based on question rules
 * Returns { valid: boolean, reason: string }
 */
export function validateAnswer(questionId, answer) {
  const question = QUESTIONS.find(q => q.id === questionId)
  if (!question) return { valid: true, reason: 'Question not found, accepting answer' }
  
  const answerText = answer.toLowerCase().trim()
  
  // Check minimum length
  if (answerText.length < question.minLength) {
    return { 
      valid: false, 
      reason: `Please give me a bit more detail — at least a sentence or two.` 
    }
  }
  
  // Check for mustNotBe words (exact matches for short answers)
  if (question.validation.mustNotBe.length > 0) {
    const exactMatch = question.validation.mustNotBe.some(word => answerText === word)
    if (exactMatch) {
      return { 
        valid: false, 
        reason: `I need a bit more than that. ${question.question}` 
      }
    }
  }
  
  // If answer is short and vague
  if (answerText.length < 20 && question.validation.shouldIndicate.length > 0) {
    const hasIndicator = question.validation.shouldIndicate.some(word => answerText.includes(word))
    if (!hasIndicator) {
      return { 
        valid: false, 
        reason: `Can you be more specific? Give me a real example or some detail.` 
      }
    }
  }
  
  return { valid: true, reason: null }
}

/**
 * Get retry count for a question (max 2 retries before accepting anyway)
 */
export function getMaxRetries() {
  return 2
}



// ============================================================
// AI RELEVANCE CHECK
// ============================================================

export async function checkAnswerRelevance(question, answer) {
  try {
    const { fetchGemini } = await import('@/lib/ai/gemini')
    
    const prompt = `You are validating if a user's answer is relevant to the question asked.

QUESTION: "${question}"
USER'S ANSWER: "${answer}"

Is this answer relevant to the question? Return ONLY JSON:
{"relevant": true/false, "reason": "brief reason if not relevant"}`

    const response = await fetchGemini([{ role: 'user', content: prompt }], { maxTokens: 100 })
    
    const cleaned = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
    return JSON.parse(cleaned)
  } catch (error) {
    return { relevant: true }
  }
}