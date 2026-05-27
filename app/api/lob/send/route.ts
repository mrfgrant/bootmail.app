import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

const LOB_TEMPLATE_ID = 'tmpl_d8a92492a60e8e1'
const RETURN_ADDRESS = {
  name: 'BootMail',
  address_line1: '246 Robert C Daniel Pkwy',
  address_line2: '#1162',
  address_city: 'Augusta',
  address_state: 'GA',
  address_zip: '30909',
  address_country: 'US',
}

export async function POST(request: NextRequest) {
  try {
    const { letterId } = await request.json()
    if (!letterId) return NextResponse.json({ error: 'Letter ID required' }, { status: 400 })

    const supabase = createAdminClient()

    const { data: letter, error: letterErr } = await supabase
      .from('letters')
      .select('*, recruits(*), profiles(full_name, email)')
      .eq('id', letterId)
      .single()

    if (letterErr || !letter) {
      return NextResponse.json({ error: 'Letter not found' }, { status: 404 })
    }

    const recruit = letter.recruits

    if (!recruit?.address_line1 || !recruit?.city || !recruit?.state || !recruit?.zip) {
      return NextResponse.json({
        error: 'Recruit address is incomplete. Please update the recruit record first.'
      }, { status: 400 })
    }

    // Build merge variables — pass photo URLs directly (public Supabase storage)
    // Do NOT use base64 — too large for Lob merge variables
    const mergeVariables: Record<string, string> = {
      date: new Date(letter.submitted_at ?? letter.created_at)
        .toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      recipient_name: recruit.full_name,
      recipient_address_line1: recruit.address_line1,
      recipient_address_line2: recruit.address_line2 ?? '',
      recipient_city: recruit.city,
      recipient_state: recruit.state,
      recipient_zip: recruit.zip,
      body: letter.body ?? '',
    }

    // Add photo URLs directly — Lob fetches them at render time
    const photos = letter.photo_urls ?? []
    photos.slice(0, 6).forEach((url: string, i: number) => {
      mergeVariables[`photo${i + 1}`] = url
    })

    console.log('Sending to Lob:', recruit.full_name, '| photos:', photos.length)

    const lobBody: Record<string, any> = {
      description: `BootMail - ${recruit.full_name} - ${mergeVariables.date}`,
      to: {
        name: recruit.full_name,
        address_line1: recruit.address_line1,
        address_city: recruit.city,
        address_state: recruit.state,
        address_zip: recruit.zip,
        address_country: 'US',
      },
      from: RETURN_ADDRESS,
      file: LOB_TEMPLATE_ID,
      merge_variables: mergeVariables,
      color: true,
      double_sided: false,
      address_placement: 'insert_blank_page',
      mail_type: 'usps_first_class',
    }

    if (recruit.address_line2) {
      lobBody.to.address_line2 = recruit.address_line2
    }

    const lobResponse = await fetch('https://api.lob.com/v1/letters', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(process.env.LOB_API_KEY + ':').toString('base64'),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(lobBody),
    })

    const lobData = await lobResponse.json()

    if (!lobResponse.ok) {
      console.error('Lob error:', JSON.stringify(lobData))
      return NextResponse.json({
        error: lobData.error?.message ?? 'Lob API error',
        details: lobData,
      }, { status: 500 })
    }

    console.log('Lob letter created:', lobData.id)

    await supabase
      .from('letters')
      .update({
        status: 'processing',
        lob_letter_id: lobData.id,
        tracking_number: lobData.tracking_number ?? null,
        printed_at: new Date().toISOString(),
      })
      .eq('id', letterId)

    return NextResponse.json({
      success: true,
      lobId: lobData.id,
      tracking: lobData.tracking_number ?? null,
      expectedDelivery: lobData.expected_delivery_date ?? null,
      photos: photos.length,
    })

  } catch (error: any) {
    console.error('Send to Lob error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
