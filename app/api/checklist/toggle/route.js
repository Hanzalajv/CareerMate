import { createClient } from '@/lib/supabase/server'

import { checklistLimiter } from '@/lib/rate-limit'


export async function POST(request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    
// After auth check:
const rateCheck = checklistLimiter.check(user.id)
if (!rateCheck.allowed) {
  return Response.json({ error: 'Slow down.' }, { status: 429 })
}

    const { checklistId, itemIndex } = await request.json()

    const { data: checklist } = await supabase
      .from('user_checklists')
      .select('items, status')
      .eq('checklist_id', checklistId)
      .eq('user_id', user.id)
      .single()

    if (!checklist) {
      return Response.json({ error: 'Checklist not found' }, { status: 404 })
    }

    // Toggle the item
    const items = [...checklist.items]
    items[itemIndex] = {
      ...items[itemIndex],
      completed: !items[itemIndex].completed,
      completed_at: !items[itemIndex].completed ? new Date().toISOString() : null
    }

    // Check if all items complete
    const allComplete = items.every(item => item.completed)
    
    const { data, error } = await supabase
      .from('user_checklists')
      .update({
        items,
        status: allComplete ? 'COMPLETED' : checklist.status,
        completed_at: allComplete ? new Date().toISOString() : null
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