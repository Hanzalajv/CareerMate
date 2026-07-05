import { createClient } from '@/lib/supabase/server'
import { getReport, getUserReports } from '@/lib/deep-dive'
import { fetchGemini } from '@/lib/ai/gemini'
import { getKnowledgeContext } from '@/lib/knowledge'

export async function GET(request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')
    const enhance = searchParams.get('enhance') === 'true'

    if (sessionId) {
      // Get specific report
      const report = await getReport(sessionId)
      
      if (!report) {
        return Response.json({ error: 'Report not found' }, { status: 404 })
      }

      if (report.user_id !== user.id) {
        return Response.json({ error: 'Unauthorized' }, { status: 403 })
      }

      // If enhancement requested and report exists, add reasoning
      if (enhance && report.report_content) {
        const enhancedReport = await enhanceReportWithReasoning(report, user.id)
        if (enhancedReport) {
          return Response.json({ report: { ...report, report_content: enhancedReport } })
        }
      }

      return Response.json({ report })
    }

    // Get all reports for user
    const reports = await getUserReports(user.id)
    return Response.json({ reports })

  } catch (error) {
    console.error('Deep Dive Report Error:', error)
    return Response.json(
      { error: error.message || 'Failed to fetch report' },
      { status: 500 }
    )
  }
}

/**
 * Enhances an existing report with reasoning: why each career was suggested,
 * what specific user answers led to conclusions, and market rationale
 */
async function enhanceReportWithReasoning(report, userId) {
  try {
    const supabase = await createClient()
    
    // Get the session to access Q&A
    const { data: session } = await supabase
      .from('deep_dive_sessions')
      .select('questions_answers, structured_context')
      .eq('session_id', report.session_id)
      .single()

    if (!session) return null

    const reportContent = report.report_content
    const qa = session.questions_answers || []
    const context = session.structured_context || {}

    // Get user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    // Build enhancement prompt
    const enhancementPrompt = buildEnhancementPrompt(reportContent, qa, context, profile)
    
    const enhancedResponse = await fetchGemini([
      { role: 'system', content: 'You are a career report enhancer. Add reasoning and evidence to reports. Return ONLY valid JSON.' },
      { role: 'user', content: enhancementPrompt }
    ], { maxTokens: 3000 })

    // Parse enhanced report
    try {
      let cleaned = enhancedResponse
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
      const jsonStart = cleaned.indexOf('{')
      const jsonEnd = cleaned.lastIndexOf('}') + 1
      if (jsonStart >= 0 && jsonEnd > jsonStart) {
        cleaned = cleaned.slice(jsonStart, jsonEnd)
      }
      cleaned = cleaned.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']').trim()
      
      const enhancedContent = JSON.parse(cleaned)
      
      // Save enhanced report
      await supabase
        .from('deep_dive_reports')
        .update({ report_content: enhancedContent })
        .eq('report_id', report.report_id)
      
      return enhancedContent
    } catch (parseError) {
      console.error('Enhancement parse error:', parseError)
      return null
    }
  } catch (error) {
    console.error('Enhancement error:', error)
    return null
  }
}

function buildEnhancementPrompt(reportContent, qa, context, profile) {
  // Extract key Q&A exchanges
  const keyExchanges = qa
    .filter(item => item.answer && item.answer.length > 20)
    .slice(-15)
    .map((item, i) => `Q: ${item.question}\nA: ${item.answer}`)
    .join('\n\n')

  // Extract verified skills
  const verifiedSkills = context.skills?.verified?.map(s => 
    typeof s === 'string' ? s : `${s.skill} (evidence: ${s.evidence})`
  ).join(', ') || 'None'

  // Extract tested and failed
  const failedSkills = context.skills?.tested_and_failed?.join(', ') || 'None'

  // Extract financial goals
  const financialGoal = context.financial?.goal_5yr || 'Not specified'

  // Extract family context
  const familyExpectation = context.family?.expectation || 'Not specified'

  return `You are enhancing a career report. The original report exists but needs reasoning added.

USER PROFILE:
- Name: ${profile?.display_name || 'Student'}
- Education: ${profile?.education || 'Not specified'}
- Location: ${profile?.location || 'Pakistan'}

WHAT WE LEARNED ABOUT THIS USER:
- Verified skills: ${verifiedSkills}
- Failed knowledge tests: ${failedSkills}
- Financial goal: ${financialGoal}
- Family expectation: ${familyExpectation}
- Sincerity score: ${context.motivation?.sincerity_score || 'N/A'}/10
- Primary motivation: ${context.motivation?.primary_driver || 'Not determined'}

KEY CONVERSATION EXCHANGES:
${keyExchanges}

ORIGINAL REPORT (enhance this):
${JSON.stringify(reportContent, null, 2)}

═══════════════════════════════════════
ENHANCEMENT TASK
═══════════════════════════════════════

Enhance this report by adding the following to EACH career path:

1. "why_suggested.rationale" — A clear paragraph explaining:
   - Exactly what the user SAID that made you suggest this career
   - What market DATA supports this choice
   - Why this career fits THEIR specific profile, skills, and constraints

2. "why_suggested.evidence_quotes" — Array of 2-3 direct quotes from the user that support this recommendation

3. "why_suggested.alternatives_considered" — 1-2 other careers you considered but rejected, and WHY you rejected them based on the user's profile

Also add to the report:

4. "reasoning_summary" — A section explaining the overall logic:
   - What key insights drove the recommendations
   - What contradictions or surprises you found
   - Why certain paths were ruled out

5. For each strength in "strengths" — add "source_quote" showing exactly what the user said that proves this

6. For each blind_spot — add "related_quote" showing what the user DIDN'T mention

CRITICAL:
- Reference EXACT quotes from the conversation
- Explain WHY, not just WHAT
- Be honest about limitations in the user's profile
- Return the ENTIRE report as valid JSON (the original + enhancements)
- Return ONLY the JSON object, no markdown, no explanations outside the JSON`
}