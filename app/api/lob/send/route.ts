import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

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
    const sender = letter.profiles

    if (!recruit?.address_line1 || !recruit?.city || !recruit?.state || !recruit?.zip) {
      return NextResponse.json({ 
        error: 'Recruit address is incomplete. Please update the recruit record first.' 
      }, { status: 400 })
    }

    // Convert photos to base64 so Lob can render them
    const photoBase64s: string[] = []
    if (letter.photo_urls?.length > 0) {
      for (const url of letter.photo_urls) {
        try {
          const imgRes = await fetch(url)
          if (imgRes.ok) {
            const buffer = await imgRes.arrayBuffer()
            const b64 = Buffer.from(buffer).toString('base64')
            const mime = imgRes.headers.get('content-type') ?? 'image/jpeg'
            photoBase64s.push(`data:${mime};base64,${b64}`)
          }
        } catch (e) {
          console.error('Photo fetch failed:', url, e)
        }
      }
    }

    const letterHtml = buildLetterHtml(letter, recruit, sender, photoBase64s)

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
      // Use insert_blank_page so address window is on a separate page
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
    })

  } catch (error: any) {
    console.error('Send to Lob error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function buildLetterHtml(letter: any, recruit: any, sender: any, photoBase64s: string[]): string {
  const date = new Date(letter.submitted_at ?? letter.created_at)
    .toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  const escapedBody = (letter.body ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Photos as base64 inline — Lob can render these
  const photoSection = photoBase64s.length > 0
    ? `<div style="margin-top:24px;border-top:1px solid #e8ddd0;padding-top:16px;page-break-inside:avoid;">
        <p style="font-family:Courier,monospace;font-size:9px;color:#999;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;">
          Photos (${photoBase64s.length})
        </p>
        <table width="100%" cellpadding="4" cellspacing="0">
          <tr>
            ${photoBase64s.map(b64 =>
              `<td width="${Math.floor(100/Math.min(photoBase64s.length,3))}%" style="vertical-align:top;">
                <img src="${b64}" style="width:100%;display:block;" />
              </td>`
            ).join('')}
          </tr>
        </table>
      </div>`
    : ''

  return `
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Georgia, serif; color: #1a1a16; font-size: 13px; }
  .page { padding: 0.75in; }
  .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #1a1a16; padding-bottom: 12px; margin-bottom: 20px; }
  .logo { font-family: Arial, sans-serif; font-size: 20px; font-weight: 900; letter-spacing: 4px; }
  .logo span { color: #d4a017; }
  .date { font-family: Courier, monospace; font-size: 10px; color: #555; }
  .address-block { font-family: Courier, monospace; font-size: 11px; line-height: 1.7; margin-bottom: 20px; }
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
