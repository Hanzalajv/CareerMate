import { createClient } from '@/lib/supabase/server'
import { fetchGemini } from '@/lib/ai/gemini'

export async function POST(request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { journal_id } = await request.json()

    // Get journal entry
    const { data: journal } = await supabase
      .from('daily_journals')
      .select('*')
      .eq('journal_id', journal_id)
      .eq('user_id', user.id)
      .single()

    if (!journal) {
      return Response.json({ error: 'Journal not found' }, { status: 404 })
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Get latest report summary
    const { data: report } = await supabase
      .from('deep_dive_reports')
      .select('report_content')
      .eq('user_id', user.id)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const reportSummary = report?.report_content?.summary || 'No career report yet.'

    // Get active checklist
    const { data: checklist } = await supabase
      .from('user_checklists')
      .select('items')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const prompt = `You are CareerMate, reviewing a user's daily journal entry.

USER: ${profile?.display_name || 'Student'}
CAREER GOAL: ${reportSummary}
ACTIVE TASKS: ${checklist?.items?.filter(i => !i.completed).map(i => i.task).join(', ') || 'None'}

TODAY'S JOURNAL:
- What they did: ${journal.what_i_did || 'Nothing written'}
- Learning hours: ${journal.learning_hours || 0}
- Challenges: ${journal.challenges_faced || 'None mentioned'}
- Mood: ${journal.mood || 'Not specified'}

Give a BRIEF, warm, personal response (2-4 sentences):
1. Acknowledge their effort specifically
2. If what they did aligns with their career goals, praise that. If not, gently nudge them.
3. If they faced challenges, offer ONE practical tip.
4. End with encouragement.

Keep it short and personal. Use their name.`

    const feedback = await fetchGemini([
      { role: 'system', content: 'You are a supportive career coach. Be brief, warm, and personal.' },
      { role: 'user', content: prompt }
    ], { maxTokens: 300 })

    // Save feedback
    await supabase
      .from('daily_journals')
      .update({ ai_feedback: feedback })
      .eq('journal_id', journal_id)

    return Response.json({ feedback })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}