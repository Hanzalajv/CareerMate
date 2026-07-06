import { createClient } from '@/lib/supabase/server'

export async function GET(request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return Response.json({ error: 'Not authenticated — RLS requires login' }, { status: 401 })
    }

    const results = {}
    let passed = 0
    let failed = 0

    // 1. Test user_profiles
    const { data: profile, error: p1 } = await supabase
      .from('user_profiles').select('*').eq('user_id', user.id).maybeSingle()
    results.user_profiles_read_own = { passed: !p1 && profile, error: p1?.message }
    if (!p1 && profile) passed++; else failed++

    // 2. Test deep_dive_sessions
    const { data: sessions, error: p2 } = await supabase
      .from('deep_dive_sessions').select('*').eq('user_id', user.id).limit(1)
    results.deep_dive_sessions_read_own = { passed: !p2, error: p2?.message }
    if (!p2) passed++; else failed++

    // 3. Test deep_dive_reports
    const { data: reports, error: p3 } = await supabase
      .from('deep_dive_reports').select('*').eq('user_id', user.id).limit(1)
    results.deep_dive_reports_read_own = { passed: !p3, error: p3?.message }
    if (!p3) passed++; else failed++

    // 4. Test user_checklists
    const { data: checklists, error: p4 } = await supabase
      .from('user_checklists').select('*').eq('user_id', user.id).limit(1)
    results.user_checklists_read_own = { passed: !p4, error: p4?.message }
    if (!p4) passed++; else failed++

    // 5. Test daily_journals
    const { data: journals, error: p5 } = await supabase
      .from('daily_journals').select('*').eq('user_id', user.id).limit(1)
    results.daily_journals_read_own = { passed: !p5, error: p5?.message }
    if (!p5) passed++; else failed++

    // 6. Test streaks
    const { data: streak, error: p6 } = await supabase
      .from('streaks').select('*').eq('user_id', user.id).maybeSingle()
    results.streaks_read_own = { passed: !p6, error: p6?.message }
    if (!p6) passed++; else failed++

    // 7. Test knowledge_chunks (public)
    const { data: knowledge, error: p7 } = await supabase
      .from('knowledge_chunks').select('*').limit(1)
    results.knowledge_chunks_read = { passed: !p7, error: p7?.message }
    if (!p7) passed++; else failed++

    // 8. Test insert into daily_journals
    const today = new Date().toISOString().split('T')[0]
    const { error: p8 } = await supabase
      .from('daily_journals')
      .upsert({
        user_id: user.id,
        entry_date: today,
        what_i_did: 'RLS test entry',
        learning_hours: 0
      }, { onConflict: 'user_id,entry_date' })
    results.daily_journals_insert = { passed: !p8, error: p8?.message }
    if (!p8) passed++; else failed++

    // 9. Test update streaks
    const { error: p9 } = await supabase
      .from('streaks')
      .upsert({
        user_id: user.id,
        daily_streak: 0,
        daily_last_date: today
      }, { onConflict: 'user_id' })
    results.streaks_upsert = { passed: !p9, error: p9?.message }
    if (!p9) passed++; else failed++

    // 10. Test CROSS-USER ACCESS (should FAIL)
    const { data: otherUserData, error: p10 } = await supabase
      .from('user_profiles')
      .select('*')
      .neq('user_id', user.id)
      .limit(1)
    // This should return empty array (RLS blocks), not error
    const crossUserBlocked = !p10 && (!otherUserData || otherUserData.length === 0)
    results.cross_user_access_blocked = { passed: crossUserBlocked, detail: 'Should return empty — other users data is blocked' }
    if (crossUserBlocked) passed++; else failed++

    return Response.json({
      summary: { passed, failed, total: passed + failed },
      timestamp: new Date().toISOString(),
      user_id: user.id,
      results
    })

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}