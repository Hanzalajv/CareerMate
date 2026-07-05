import { createClient } from '@/lib/supabase/server'

// Topic to keyword mapping for knowledge search
const TOPIC_KEYWORDS = {
  financial_reality: ['salary', 'income', 'finance', 'banking', 'IT', 'software', 'freelance', 'digital marketing', 'data'],
  skills: ['software', 'developer', 'Python', 'JavaScript', 'learning', 'portfolio', 'certification', 'bootcamp', 'course'],
  family_context: ['family', 'gender', 'women', 'barriers', 'pressure', 'networking', 'sifarish', 'connections'],
  work_environment: ['remote', 'office', 'freelance', 'gig', 'flexible', 'city', 'relocation'],
  market_awareness: ['IT', 'software', 'companies', 'job boards', 'LinkedIn', 'Rozee', 'startup', 'e-commerce', 'EdTech'],
  learning_capacity: ['learning', 'platform', 'course', 'Coursera', 'DigiSkills', 'Udemy', 'bootcamp', 'NAVTTC', 'alternative'],
  long_term_direction: ['career path', 'growth', 'future', 'income', 'multiple', 'portfolio', 'gig economy'],
  backup_plan: ['freelance', 'alternative', 'remote', 'international', 'business', 'startup'],
  general: ['IT', 'software', 'salary', 'career', 'Pakistan', 'job', 'market']
}

// Keywords that indicate user context for better search
const USER_CONTEXT_KEYWORDS = {
  python: ['Python', 'software', 'developer', 'IT', 'freelance'],
  javascript: ['JavaScript', 'React', 'web', 'software', 'developer'],
  'data science': ['data', 'analyst', 'data science', 'SQL', 'Python', 'Tableau'],
  design: ['design', 'graphic', 'UX', 'UI', 'creative', 'video'],
  marketing: ['digital marketing', 'social media', 'SEO', 'content', 'marketing'],
  finance: ['finance', 'banking', 'accountant', 'commerce', 'MBA'],
  business: ['business', 'startup', 'entrepreneur', 'e-commerce', 'logistics'],
  government: ['government', 'PSEB', 'NAVTTC', 'PITB', 'civil', 'public'],
  abroad: ['international', 'remote', 'freelance', 'global', 'foreign', 'visa']
}

/**
 * Search knowledge chunks relevant to a topic and user context
 */
export async function searchKnowledge(topic, userContext = {}) {
  const supabase = await createClient()
  
  // Get base keywords from topic
  const topicKeys = TOPIC_KEYWORDS[topic] || TOPIC_KEYWORDS.general
  
  // Get user-specific keywords from their skills/interests
  const userKeys = []
  if (userContext.skills) {
    userContext.skills.forEach(skill => {
      const skillLower = skill.toLowerCase()
      Object.entries(USER_CONTEXT_KEYWORDS).forEach(([key, keywords]) => {
        if (skillLower.includes(key)) userKeys.push(...keywords)
      })
    })
  }
  if (userContext.interests) {
    userContext.interests.forEach(interest => {
      const intLower = interest.toLowerCase()
      Object.entries(USER_CONTEXT_KEYWORDS).forEach(([key, keywords]) => {
        if (intLower.includes(key)) userKeys.push(...keywords)
      })
    })
  }

  // Combine and deduplicate keywords
  const allKeywords = [...new Set([...topicKeys, ...userKeys])]
  
  // Build OR query for keyword matching
  const keywordConditions = allKeywords.map(k => `keywords.cs.{${k}}`).join(',')
  
  try {
    const { data, error } = await supabase
      .from('knowledge_chunks')
      .select('topic, content, source')
      .or(keywordConditions)
      .limit(5)

    if (error) {
      console.error('Knowledge search error:', error)
      return []
    }

    return data || []
  } catch (err) {
    console.error('Knowledge search failed:', err)
    return []
  }
}

/**
 * Format knowledge chunks into prompt-ready text
 */
export function formatKnowledgeForPrompt(chunks, maxChunks = 4) {
  if (!chunks || chunks.length === 0) return ''
  
  const selected = chunks.slice(0, maxChunks)
  
  return `RELEVANT PAKISTAN MARKET FACTS (use this data, don't make up numbers):
${selected.map((c, i) => `${i + 1}. [${c.topic}] ${c.content}`).join('\n\n')}`
}

/**
 * Get knowledge for a specific topic and format it for the prompt
 */
export async function getKnowledgeContext(topic, userContext = {}) {
  const chunks = await searchKnowledge(topic, userContext)
  return formatKnowledgeForPrompt(chunks)
}