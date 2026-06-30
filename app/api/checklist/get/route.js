import { createClient } from '@/lib/supabase/server'

export async function GET(request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const reportId = searchParams.get('report_id')
    const checklistId = searchParams.get('checklist_id')

    if (checklistId) {
      const { data, error } = await supabase
        .from('user_checklists')
        .select('*')
        .eq('checklist_id', checklistId)
        .eq('user_id', user.id)
        .single()

      if (error) throw error
      return Response.json({ checklist: data })
    }

    if (reportId) {
      const { data, error } = await supabase
        .from('user_checklists')
        .select('*')
        .eq('report_id', reportId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return Response.json({ checklists: data })
    }

    // All checklists for user
    const { data, error } = await supabase
      .from('user_checklists')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    return Response.json({ checklists: data })

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}