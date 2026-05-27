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
      return NextResponse.json({ error: 'Recruit address is incomplete. Please update the recruit record first.' }, { status: 400 })
    }

    // Build letter HTML
    const letterHtml = buildLetterHtml(letter, recruit, sender)

    // Send to Lob
    const lobResponse = await fetch('https://api.lob.com/v1/letters', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(process.env.LOB_API_KEY + ':').toString('base64'),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description: 'BootMail Letter - ' + recruit.full_name,
        to: {
          name: recruit.full_name,
          address_line1: recruit.address_line1,
          address_line2: recruit.address_line2 || undefined,
          address_city: recruit.city,
          address_state: recruit.state,
          address_zip: recruit.zip,
          address_country: 'US',
        },
        from: {
          name: 'BootMail',
          address_line1: '123 Main Street',
          address_city: 'Austin',
          address_state: 'TX',
          address_zip: '78701',
          address_country: 'US',
        },
        file: '<html>' + letterHtml + '</html>',
        color: true,
        double_sided: false,
        address_placement: 'top_first_page',
        mail_type: 'usps_first_class',
      }),
    })

    const lobData = await lobResponse.json()

    if (!lobResponse.ok) {
      console.error('Lob error:', lobData)
      return NextResponse.json({ 
        error: lobData.error?.message ?? 'Lob API error',
        details: lobData 
      }, { status: 500 })
    }

    console.log('Lob letter created:', lobData.id, 'tracking:', lobData.tracking_number)

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
      tracking: lobData.tracking_number,
      expectedDelivery: lobData.expected_delivery_date,
    })

  } catch (error: any) {
    console.error('Send to Lob error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function buildLetterHtml(letter: any, recruit: any, sender: any): string {
  const date = new Date(letter.submitted_at ?? letter.created_at)
    .toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  const photoSection = letter.photo_urls?.length > 0
    ? '<div style="margin-top:24px;border-top:1px solid #e8ddd0;padding-top:16px;">' +
      '<p style="font-family:Courier,monospace;font-size:9px;color:#999;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">Photos</p>' +
      '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">' +
      letter.photo_urls.map((url: string) =>
        '<img src="' + url + '" style="width:100%;aspect-ratio:1;object-fit:cover;" />'
      ).join('') +
      '</div></div>'
    : ''

  return `
<head>
<meta charset="utf-8">
<style>
  body { margin: 0; padding: 0; font-family: Georgia, serif; color: #1a1a16; }
  .page { padding: 0.5in; max-width: 8.5in; }
  .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #1a1a16; padding-bottom: 12px; margin-bottom: 24px; }
  .logo { font-family: Arial, sans-serif; font-size: 22px; font-weight: 900; letter-spacing: 4px; }
  .logo span { color: #d4a017; }
  .meta { font-family: Courier, monospace; font-size: 10px; color: #555; text-align: right; line-height: 1.6; }
  .address-block { font-family: Courier, monospace; font-size: 12px; line-height: 1.7; margin-bottom: 24px; }
  .body { font-size: 13px; line-height: 1.9; white-space: pre-wrap; min-height: 200px; }
  .footer { margin-top: 32px; border-top: 1px solid #e8ddd0; padding-top: 12px; font-family: Courier, monospace; font-size: 9px; color: #bbb; text-align: center; text-transform: uppercase; letter-spacing: 2px; }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="logo">BOOT<span>MAIL</span></div>
    <div class="meta">
      <div>${date}</div>
    </div>
  </div>

  <div class="address-block">
    <strong>${recruit.full_name}</strong><br>
    ${recruit.address_line1}<br>
    ${recruit.address_line2 ? recruit.address_line2 + '<br>' : ''}
    ${recruit.city}, ${recruit.state} ${recruit.zip}
  </div>

  <div class="body">${letter.body?.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>

  ${photoSection}

  <div class="footer">
    Sent with BootMail &middot; bootmail.app &middot; More Than Mail. It&apos;s Morale.
  </div>
</div>
</body>
`
}
