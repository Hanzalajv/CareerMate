import { createClient } from '@/lib/supabase/server'

export async function POST(request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { checklistId } = await request.json()

    const now = new Date()
    const deadline = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days

    const { data, error } = await supabase
      .from('user_checklists')
      .update({
        status: 'IN_PROGRESS',
        started_at: now.toISOString(),
        deadline_at: deadline.toISOString()
      })
      .eq('checklist_id', checklistId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error

    return Response.json({ checklist: data })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}