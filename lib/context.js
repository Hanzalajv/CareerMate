// ============================================================
// SIMPLE CONTEXT — Tracks what we learn about the user
// ============================================================
import { QUESTIONS } from '@/lib/questions'
/**
 * Creates an empty context object for a new session
 */
export function createEmptyContext(profile) {
  return {
    profile: {
      name: profile.display_name || 'Student',
      education: profile.education || 'Not specified',
      location: profile.location || 'Pakistan'
    },

    progress: {
      intention: null,           // Q1: job / university / career_switch / exploring
      current_question: 0,
      total_questions: 20,
      retry_count: {}            // { questionId: retriesUsed }
    },

    motivation: {
      primary_driver: null,      // Q2: passion / money / family_approval / escape / security
      urgency_level: null        // Derived: high / medium / low
    },

    family: {
      expectation: null,         // Q3: specific career or 'no pressure' or 'anything'
      pressure_level: null       // Derived: high / medium / low
    },

    financial: {
      runway_months: null,       // Q4: 0-3 / 3-6 / 6-12 / 12+
      minimum_income: null,      // Q5: PKR amount
      goal_5yr: null             // Derived from conversation
    },

    skills: {
      claimed: [],               // Q6: skills they say they have
      verified: [],              // Q7: [{skill, evidence}]
      aspired: [],               // Q8: [{skill, obstacle}]
      blind_spots: [],           // Q9: weaknesses they admit
      tested_and_failed: []      // Skills claimed but couldn't prove
    },

    work_style: {
      preference: null,          // Q10: solo / team / leader
      relocation: null,          // Q11: yes / no / only_if + constraint
      risk_tolerance: null       // Q12: stable / variable
    },

    experience: {
      earned_before: false,      // Q13: true / false
      earned_details: null,      // What they did
      has_portfolio: false,
      has_freelanced: false
    },

    market: {
      awareness_level: null,     // Q14: high / medium / low
      info_sources: [],          // Q14: family / social_media / job_boards / research
      researched: false,         // Q16: true / false
      knows_companies: [],       // Named companies
      knows_platforms: [],       // Rozee, LinkedIn, etc.
      named_careers: []          // Q14: careers they mentioned
    },

    network: {
      has_contacts: false,       // Q15: true / false
      contacts: []               // [{relationship, field}]
    },

    learning: {
      hours_per_week: null,      // Q17: number
      completion_history: null,  // Q18: 'completed something' or 'never finished'
      obstacles: []              // Q8: time / money / fear / guidance
    },

    long_term: {
      vision_5yr: null,          // Q20: their honest prediction
      backup_plan: null          // Q19: their Plan B
    }
  }
}

// ============================================================
// CONTEXT UPDATER — Simple extraction from answers
// ============================================================

/**
 * Updates context based on question ID and user's answer
 */
export function updateContext(context, questionId, answer) {
  const updated = JSON.parse(JSON.stringify(context))
  const answerText = answer.trim()
  const lowerAnswer = answerText.toLowerCase()

  switch (questionId) {
    case 1: // Intention
      if (lowerAnswer.includes('job') || lowerAnswer.includes('work') || lowerAnswer.includes('earn')) {
        updated.progress.intention = 'job'
      } else if (lowerAnswer.includes('university') || lowerAnswer.includes('study') || lowerAnswer.includes('degree')) {
        updated.progress.intention = 'university'
      } else if (lowerAnswer.includes('switch') || lowerAnswer.includes('change')) {
        updated.progress.intention = 'career_switch'
      } else if (lowerAnswer.includes('business') || lowerAnswer.includes('startup') || lowerAnswer.includes('entrepreneur')) {
        updated.progress.intention = 'business'
      } else {
        updated.progress.intention = 'exploring'
      }
      updated.motivation.urgency_level = lowerAnswer.includes('urgent') || lowerAnswer.includes('desperate') || lowerAnswer.includes('immediately') ? 'high' : 'medium'
      break

    case 2: // Motivation
      if (lowerAnswer.includes('money') || lowerAnswer.includes('earn') || lowerAnswer.includes('income')) {
        updated.motivation.primary_driver = 'money'
      } else if (lowerAnswer.includes('passion') || lowerAnswer.includes('love') || lowerAnswer.includes('enjoy')) {
        updated.motivation.primary_driver = 'passion'
      } else if (lowerAnswer.includes('family') || lowerAnswer.includes('parents') || lowerAnswer.includes('approval')) {
        updated.motivation.primary_driver = 'family_approval'
      } else if (lowerAnswer.includes('abroad') || lowerAnswer.includes('leave') || lowerAnswer.includes('escape')) {
        updated.motivation.primary_driver = 'escape'
      } else if (lowerAnswer.includes('security') || lowerAnswer.includes('stable') || lowerAnswer.includes('safe')) {
        updated.motivation.primary_driver = 'security'
      } else {
        updated.motivation.primary_driver = 'other'
      }
      break

    case 3: // Family expectation
      const careerWords = ['doctor', 'engineer', 'government', 'army', 'teacher', 'business', 'software', 'it', 'tech', 'css', 'pcs', 'banking', 'lawyer', 'police']
      const foundCareer = careerWords.find(w => lowerAnswer.includes(w))
      updated.family.expectation = foundCareer || 'anything'
      updated.family.pressure_level = lowerAnswer.includes('pressure') || lowerAnswer.includes('expect') || lowerAnswer.includes('force') ? 'high' : 
        lowerAnswer.includes('support') || lowerAnswer.includes('free') || lowerAnswer.includes('whatever') ? 'low' : 'medium'
      break

    case 4: // Financial runway
      if (lowerAnswer.includes('0') || lowerAnswer.includes('none') || lowerAnswer.includes('no')) {
        updated.financial.runway_months = '0-3'
      } else if (lowerAnswer.includes('1') || lowerAnswer.includes('2') || lowerAnswer.includes('3')) {
        updated.financial.runway_months = '3-6'
      } else if (lowerAnswer.includes('6') || lowerAnswer.includes('half year')) {
        updated.financial.runway_months = '6-12'
      } else {
        updated.financial.runway_months = '12+'
      }
      break

    case 5: // Minimum income
      const incomeMatch = answerText.match(/(\d[\d,]*)\s*(k|thousand|lacs?|lakhs?|crore|pkr|rs|rupees)/i)
      if (incomeMatch) {
        updated.financial.minimum_income = incomeMatch[0]
      }
      break

    case 6: // Skills claimed
      const skillIndicators = ['python', 'javascript', 'java', 'react', 'node', 'sql', 'excel', 'c++', 'c#', '.net', 'php', 'html', 'css', 'writing', 'speaking', 'teaching', 'design', 'marketing', 'sales', 'leadership', 'communication', 'management']
      skillIndicators.forEach(skill => {
        if (lowerAnswer.includes(skill) && !updated.skills.claimed.includes(skill)) {
          updated.skills.claimed.push(skill)
        }
      })
      if (updated.skills.claimed.length === 0 && answerText.length > 5) {
        updated.skills.claimed.push(answerText.substring(0, 50))
      }
      break

    case 7: // Verified skills
      if (lowerAnswer.includes('built') || lowerAnswer.includes('made') || lowerAnswer.includes('created') || lowerAnswer.includes('project') || lowerAnswer.includes('app') || lowerAnswer.includes('website')) {
        // Check which skill was verified
        updated.skills.claimed.forEach(skill => {
          if (lowerAnswer.includes(skill)) {
            updated.skills.verified.push({ skill, evidence: answerText.substring(0, 100) })
          }
        })
        // If no specific skill matched but has evidence
        if (updated.skills.verified.length === 0 && answerText.length > 20) {
          updated.skills.verified.push({ skill: 'general', evidence: answerText.substring(0, 100) })
        }
      }
      break

    case 8: // Aspired skills + obstacles
      if (lowerAnswer.includes('time')) updated.learning.obstacles.push('time')
      if (lowerAnswer.includes('money') || lowerAnswer.includes('expensive') || lowerAnswer.includes('cost')) updated.learning.obstacles.push('money')
      if (lowerAnswer.includes('scared') || lowerAnswer.includes('fear') || lowerAnswer.includes('afraid')) updated.learning.obstacles.push('fear')
      if (lowerAnswer.includes('guidance') || lowerAnswer.includes('don\'t know how') || lowerAnswer.includes('where to start')) updated.learning.obstacles.push('guidance')
      if (lowerAnswer.includes('lazy') || lowerAnswer.includes('discipline') || lowerAnswer.includes('motivation')) updated.learning.obstacles.push('discipline')
      if (answerText.length > 10) {
        updated.skills.aspired.push(answerText.substring(0, 80))
      }
      break

    case 9: // Blind spots
      if (answerText.length > 5) {
        updated.skills.blind_spots.push(answerText.substring(0, 80))
      }
      break

    case 10: // Work style
      if (lowerAnswer.includes('alone') || lowerAnswer.includes('solo') || lowerAnswer.includes('myself') || lowerAnswer.includes('independent')) {
        updated.work_style.preference = 'solo'
      } else if (lowerAnswer.includes('team') || lowerAnswer.includes('group') || lowerAnswer.includes('people') || lowerAnswer.includes('collaborate')) {
        updated.work_style.preference = 'team'
      } else if (lowerAnswer.includes('lead') || lowerAnswer.includes('manage') || lowerAnswer.includes('direct')) {
        updated.work_style.preference = 'leader'
      }
      break

    case 11: // Relocation
      if (lowerAnswer.includes('yes') || lowerAnswer.includes('can') || lowerAnswer.includes('will') || lowerAnswer.includes('ready')) {
        updated.work_style.relocation = 'yes'
      } else if (lowerAnswer.includes('no') || lowerAnswer.includes('can\'t') || lowerAnswer.includes('won\'t')) {
        updated.work_style.relocation = 'no'
        // Extract constraint
        if (lowerAnswer.includes('family')) updated.work_style.relocation += ': family'
        else if (lowerAnswer.includes('money')) updated.work_style.relocation += ': money'
      } else {
        updated.work_style.relocation = 'maybe'
      }
      break

    case 12: // Risk tolerance
      if (lowerAnswer.includes('stable') || lowerAnswer.includes('fixed') || lowerAnswer.includes('secure') || lowerAnswer.includes('safe')) {
        updated.work_style.risk_tolerance = 'stable'
      } else if (lowerAnswer.includes('higher') || lowerAnswer.includes('unpredictable') || lowerAnswer.includes('variable') || lowerAnswer.includes('risk')) {
        updated.work_style.risk_tolerance = 'variable'
      }
      break

    case 13: // Earned before
      if (lowerAnswer.includes('yes') || lowerAnswer.includes('earned') || lowerAnswer.includes('made') || lowerAnswer.includes('worked') || lowerAnswer.includes('freelance') || lowerAnswer.includes('tutor') || lowerAnswer.includes('sold')) {
        updated.experience.earned_before = true
        updated.experience.earned_details = answerText.substring(0, 100)
        if (lowerAnswer.includes('freelance')) updated.experience.has_freelanced = true
      } else if (lowerAnswer.includes('no') || lowerAnswer.includes('never')) {
        updated.experience.earned_before = false
      }
      break

    case 14: // Market awareness
      updated.market.named_careers = answerText.split(/[,;]/).map(s => s.trim()).filter(s => s.length > 2)
      if (lowerAnswer.includes('rozee') || lowerAnswer.includes('linkedin') || lowerAnswer.includes('indeed')) {
        updated.market.awareness_level = 'high'
        updated.market.knows_platforms = ['Rozee.pk', 'LinkedIn'].filter(p => lowerAnswer.includes(p.toLowerCase()))
      } else if (lowerAnswer.includes('family') || lowerAnswer.includes('friend') || lowerAnswer.includes('told')) {
        updated.market.awareness_level = 'medium'
        updated.market.info_sources.push('word_of_mouth')
      } else if (lowerAnswer.includes('social media') || lowerAnswer.includes('tiktok') || lowerAnswer.includes('youtube') || lowerAnswer.includes('facebook')) {
        updated.market.awareness_level = 'medium'
        updated.market.info_sources.push('social_media')
      } else if (lowerAnswer.includes('research') || lowerAnswer.includes('google') || lowerAnswer.includes('searched')) {
        updated.market.awareness_level = 'high'
        updated.market.info_sources.push('research')
      } else {
        updated.market.awareness_level = 'low'
      }
      break

    case 15: // Network
      if (lowerAnswer.includes('yes') || lowerAnswer.includes('know') || lowerAnswer.includes('friend') || lowerAnswer.includes('cousin') || lowerAnswer.includes('uncle') || lowerAnswer.includes('senior')) {
        updated.network.has_contacts = true
        updated.network.contacts.push(answerText.substring(0, 80))
      } else {
        updated.network.has_contacts = false
      }
      break

    case 16: // Market research
      updated.market.researched = lowerAnswer.includes('yes') || lowerAnswer.includes('looked') || lowerAnswer.includes('searched') || lowerAnswer.includes('found')
      if (lowerAnswer.includes('rozee')) updated.market.knows_platforms.push('Rozee.pk')
      if (lowerAnswer.includes('linkedin')) updated.market.knows_platforms.push('LinkedIn')
      break

    case 17: // Learning hours
      const hoursMatch = answerText.match(/(\d+)/)
      if (hoursMatch) {
        updated.learning.hours_per_week = parseInt(hoursMatch[1])
      }
      break

    case 18: // Completion history
      if (lowerAnswer.includes('completed') || lowerAnswer.includes('finished') || lowerAnswer.includes('done') || lowerAnswer.includes('built') || lowerAnswer.includes('made')) {
        updated.learning.completion_history = 'completer'
      } else if (lowerAnswer.includes('never') || lowerAnswer.includes('haven\'t') || lowerAnswer.includes('started but')) {
        updated.learning.completion_history = 'non_completer'
      } else {
        updated.learning.completion_history = answerText.substring(0, 80)
      }
      break

    case 19: // Backup plan
      updated.long_term.backup_plan = answerText.substring(0, 150)
      break

    case 20: // 5-year vision
      updated.long_term.vision_5yr = answerText.substring(0, 200)
      break
  }

  // Update progress
  updated.progress.current_question = questionId

  return updated
}

// ============================================================
// PROMPT BUILDER — Simple, just enough context
// ============================================================

/**
 * Builds a minimal prompt for the AI to ask the current question
 */export function buildQuestionPrompt(context, questionText, questionNumber, questionId) {
  const p = context.profile
  const question = QUESTIONS.find(q => q.id === questionId)

  let prompt = `You are CareerMate, a friendly career coach in Pakistan.

USER: ${p.name}, ${p.education}, ${p.location}`

  // Add what we've learned so far
  if (context.progress.intention) {
    prompt += `\nINTENTION: ${context.progress.intention}`
  }
  if (context.motivation.primary_driver) {
    prompt += `\nMOTIVATION: ${context.motivation.primary_driver}`
  }
  if (context.family.expectation) {
    prompt += `\nFAMILY EXPECTS: ${context.family.expectation}`
  }
  if (context.financial.minimum_income) {
    prompt += `\nINCOME NEED: ${context.financial.minimum_income}`
  }
  if (context.skills.claimed.length > 0) {
    prompt += `\nSKILLS MENTIONED: ${context.skills.claimed.join(', ')}`
  }
  if (context.skills.verified.length > 0) {
    prompt += `\nVERIFIED: ${context.skills.verified.map(s => typeof s === 'string' ? s : s.skill).join(', ')}`
  }
  if (context.work_style.preference) {
    prompt += `\nWORK STYLE: ${context.work_style.preference}`
  }
  if (context.work_style.relocation) {
    prompt += `\nRELOCATION: ${context.work_style.relocation}`
  }
  if (context.learning.hours_per_week) {
    prompt += `\nLEARNING HOURS: ${context.learning.hours_per_week}/week`
  }

  prompt += `\n\nQUESTION ${questionNumber} OF 20: "${questionText}"

WHAT WE NEED FROM THIS ANSWER: ${question?.contextField || 'general information'}
CATEGORY: ${question?.category || 'general'}

Ask this question naturally. Reference what you already know about them.
If their answer is vague, gently push for specifics.
Keep it 1-3 sentences. Be conversational.`

  return prompt
}

/**
 * Builds prompt for retry when answer is invalid
 */export function buildRetryPrompt(context, questionText, previousAnswer, questionId) {
  const question = QUESTIONS.find(q => q.id === questionId)

  return `You are CareerMate. The user gave a short or vague answer.

QUESTION: "${questionText}"
THEIR ANSWER: "${previousAnswer}"
WHAT WE NEED: ${question?.contextField || 'more detail'}
CATEGORY: ${question?.category || 'general'}

Ask them again differently. Gently push for the specific information we need.
Keep it 1-2 sentences. Be encouraging.`
}