import { createClient } from '@/lib/supabase/server'

export async function GET(request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: streak, error } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) throw error

    return Response.json({
      streak: streak || {
        daily_streak: 0,
        daily_longest: 0,
        weekly_streak: 0,
        weekly_longest: 0
      }
    })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}