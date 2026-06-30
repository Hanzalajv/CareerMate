import { createClient } from '@/lib/supabase/server'

export async function POST(request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { checklistId } = await request.json()

    const { data: checklist } = await supabase
      .from('user_checklists')
      .select('status, paused_at')
      .eq('checklist_id', checklistId)
      .eq('user_id', user.id)
      .single()

    if (!checklist) {
      return Response.json({ error: 'Checklist not found' }, { status: 404 })
    }

    let newStatus, pausedAt, totalPausedMs = 0

    if (checklist.status === 'PAUSED') {
      // Resume
      newStatus = 'IN_PROGRESS'
      pausedAt = null

      // Calculate paused duration
      if (checklist.paused_at) {
        const pausedDuration = Date.now() - new Date(checklist.paused_at).getTime()
        const { data: current } = await supabase
          .from('user_checklists')
          .select('total_paused_ms')
          .eq('checklist_id', checklistId)
          .single()
        totalPausedMs = (current?.total_paused_ms || 0) + pausedDuration
      }
    } else {
      // Pause
      newStatus = 'PAUSED'
      pausedAt = new Date().toISOString()
    }

    const updateData = {
      status: newStatus,
      paused_at: pausedAt
    }
    
    if (totalPausedMs > 0) {
      updateData.total_paused_ms = totalPausedMs
    }

    const { data, error } = await supabase
      .from('user_checklists')
      .update(updateData)
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