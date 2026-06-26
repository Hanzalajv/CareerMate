import { createClient } from '@/lib/supabase/server'
import { getReport, getUserReports } from '@/lib/deep-dive'

export async function GET(request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')

    if (sessionId) {
      // Get specific report
      const report = await getReport(sessionId)
      
      if (!report) {
        return Response.json({ error: 'Report not found' }, { status: 404 })
      }

      if (report.user_id !== user.id) {
        return Response.json({ error: 'Unauthorized' }, { status: 403 })
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