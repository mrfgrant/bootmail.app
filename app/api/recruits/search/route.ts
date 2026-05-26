import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get('name') ?? ''
  const branch = request.nextUrl.searchParams.get('branch') ?? ''

  if (!name.trim()) {
    return NextResponse.json({ results: [] })
  }

  const supabase = createAdminClient()

  let query = supabase
    .from('recruits')
    .select('id, full_name, branch, training_base, city, state, status, ship_date, owner_id')
    .ilike('full_name', '%' + name.trim() + '%')

  if (branch) query = query.eq('branch', branch)

  const { data, error } = await query.limit(10)

  if (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ results: data ?? [] })
}
