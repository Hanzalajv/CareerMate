import { createClient } from '@/lib/supabase/server'

export async function GET(request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
      return Response.json({ error: 'Missing session_id' }, { status: 400 })
    }

    const { data: session, error } = await supabase
      .from('deep_dive_sessions')
      .select('session_id, questions_answers, question_count, status')
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .single()

    if (error) throw error

    return Response.json({ session })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}