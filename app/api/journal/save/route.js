import { createClient } from '@/lib/supabase/server'
import { journalLimiter } from '@/lib/rate-limit'
import { sanitizeInput } from '@/lib/sanitize'

export async function POST(request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limit check
    const rateCheck = journalLimiter.check(user.id)
    if (!rateCheck.allowed) {
      return Response.json({ error: 'Journal already saved today.' }, { status: 429 })
    }

    const { entry_date, what_i_did, learning_hours, challenges_faced, mood } = await request.json()
    const cleanWhatIDid = sanitizeInput(what_i_did)
    const cleanChallenges = sanitizeInput(challenges_faced)
    const cleanMood = sanitizeInput(mood)
    const today = new Date().toISOString().split('T')[0]

    // Save journal entry
    const { data: journal, error } = await supabase
      .from('daily_journals')
      .upsert({
        user_id: user.id,
        entry_date: entry_date || today,
        what_i_did: cleanWhatIDid,
        learning_hours: learning_hours || 0,
        challenges_faced: cleanChallenges,
        mood: cleanMood
      }, {
        onConflict: 'user_id,entry_date'
      })
      .select()
      .single()

    if (error) throw error

    // Update daily streak
    await updateDailyStreak(supabase, user.id)

    return Response.json({ journal })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}

async function updateDailyStreak(supabase, userId) {
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  const { data: streak } = await supabase
    .from('streaks')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!streak) {
    await supabase.from('streaks').insert({
      user_id: userId,
      daily_streak: 1,
      daily_longest: 1,
      daily_last_date: today
    })
    return
  }

  if (streak.daily_last_date === today) return

  if (streak.daily_last_date === yesterday) {
    const newStreak = streak.daily_streak + 1
    await supabase.from('streaks')
      .update({
        daily_streak: newStreak,
        daily_longest: newStreak > streak.daily_longest ? newStreak : streak.daily_longest,
        daily_last_date: today
      })
      .eq('streak_id', streak.streak_id)
  } else {
    await supabase.from('streaks')
      .update({
        daily_streak: 1,
        daily_last_date: today
      })
      .eq('streak_id', streak.streak_id)
  }
}