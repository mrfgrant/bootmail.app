import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { letterId, status, trackingNumber } = await request.json()
    const supabase = createAdminClient()

    const updates: Record<string, string> = { status }
    if (trackingNumber) updates.tracking_number = trackingNumber
    if (status === 'printed') updates.printed_at = new Date().toISOString()
    if (status === 'mailed') updates.mailed_at = new Date().toISOString()
    if (status === 'delivered') updates.delivered_at = new Date().toISOString()

    const { error } = await supabase
      .from('letters')
      .update(updates)
      .eq('id', letterId)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
