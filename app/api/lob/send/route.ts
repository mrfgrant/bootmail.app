import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { letterId } = await request.json()
    if (!letterId) return NextResponse.json({ error: 'Letter ID required' }, { status: 400 })

    const supabase = createAdminClient()

    // Fetch letter with recruit and profile
    const { data: letter, error: letterErr } = await supabase
      .from('letters')
      .select('*, recruits(*), profiles(full_name, email)')
      .eq('id', letterId)
      .single()

    if (letterErr || !letter) {
      return NextResponse.json({ error: 'Letter not found' }, { status: 404 })
    }

    const recruit = letter.recruits
    const sender = letter.profiles

    if (!recruit?.address_line1 || !recruit?.city || !recruit?.state || !recruit?.zip) {
      return NextResponse.json({ 
        error: 'Recruit address is incomplete. Please update the recruit record first.' 
      }, { status: 400 })
    }

    // Build letter HTML
    const letterHtml = buildLetterHtml(letter, recruit, sender)

    // Send to Lob
    const lobBody: any = {
      description: 'BootMail Letter - ' + recruit.full_name,
      to: {
        name: recruit.full_name,
        address_line1: recruit.address_line1,
        address_city: recruit.city,
        address_state: recruit.state,
        address_zip: recruit.zip,
        address_country: 'US',
      },
      from: {
        name: 'BootMail',
        address_line1: '246 Robert C Daniel Pkwy',
        address_line2: '#1162',
        address_city: 'Augusta',
        address_state: 'GA',
        address_zip: '30909',
        address_country: 'US',
      },
      file: '<!DOCTYPE html><html>' + letterHtml + '</html>',
      color: true,
      double_sided: false,
      address_placement: 'top_first_page',
      mail_type: 'usps_first_class',
    }

    // Add address_line2 if exists
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

    // Update letter status in DB
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
    })

  } catch (error: any) {
    console.error('Send to Lob error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function buildLetterHtml(letter: any, recruit: any, sender: any): string {
  const date = new Date(letter.submitted_at ?? letter.created_at)
    .toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  const escapedBody = (letter.body ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  const photoSection = letter.photo_urls?.length > 0
    ? `<div style="margin-top:24px;border-top:1px solid #e8ddd0;padding-top:16px;">
        <p style="font-family:Courier,monospace;font-size:9px;color:#999;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">
          Photos (${letter.photo_urls.length})
        </p>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">
          ${letter.photo_urls.map((url: string) =>
            `<img src="${url}" style="width:100%;aspect-ratio:1;object-fit:cover;" />`
          ).join('')}
        </div>
      </div>`
    : ''

  return `
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; }
  body { margin: 0; padding: 0; font-family: Georgia, serif; color: #1a1a16; font-size: 13px; }
  .page { padding: 0.75in 0.75in 0.5in 0.75in; }
  .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #1a1a16; padding-bottom: 12px; margin-bottom: 20px; }
  .logo { font-family: Arial, sans-serif; font-size: 20px; font-weight: 900; letter-spacing: 4px; color: #1a1a16; }
  .logo span { color: #d4a017; }
  .date { font-family: Courier, monospace; font-size: 10px; color: #555; }
  .address-block { font-family: Courier, monospace; font-size: 11px; line-height: 1.7; margin-bottom: 20px; color: #1a1a16; }
  .body { font-size: 12.5px; line-height: 1.85; white-space: pre-wrap; margin-bottom: 24px; }
  .footer { margin-top: 24px; border-top: 1px solid #e8ddd0; padding-top: 10px; font-family: Courier, monospace; font-size: 8px; color: #bbb; text-align: center; text-transform: uppercase; letter-spacing: 2px; }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="logo">BOOT<span>MAIL</span></div>
    <div class="date">${date}</div>
  </div>
  <div class="address-block">
    <strong>${recruit.full_name}</strong><br>
    ${recruit.address_line1}<br>
    ${recruit.address_line2 ? recruit.address_line2 + '<br>' : ''}
    ${recruit.city}, ${recruit.state} ${recruit.zip}
  </div>
  <div class="body">${escapedBody}</div>
  ${photoSection}
  <div class="footer">Sent with BootMail &middot; bootmail.app &middot; More Than Mail. It's Morale.</div>
</div>
</body>
`
}
