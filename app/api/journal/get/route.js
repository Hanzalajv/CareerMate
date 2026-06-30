import { createClient } from '@/lib/supabase/server'

export async function GET(request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const limit = parseInt(searchParams.get('limit') || '30')

    if (date) {
      const { data, error } = await supabase
        .from('daily_journals')
        .select('*')
        .eq('user_id', user.id)
        .eq('entry_date', date)
        .maybeSingle()

      if (error) throw error
      return Response.json({ journal: data })
    }

    const { data, error } = await supabase
      .from('daily_journals')
      .select('*')
      .eq('user_id', user.id)
      .order('entry_date', { ascending: false })
      .limit(limit)

    if (error) throw error
    return Response.json({ journals: data })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}