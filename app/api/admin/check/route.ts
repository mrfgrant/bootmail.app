import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

const ADMIN_EMAILS = ['jamie@mrfgrant.com']

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()
    const supabase = createAdminClient()
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single()
    const isAdmin = ADMIN_EMAILS.includes(profile?.email ?? '')
    return NextResponse.json({ isAdmin })
  } catch {
    return NextResponse.json({ isAdmin: false })
  }
}
