import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/server'

// ⚠️ Resend initialized INSIDE the handler so env vars are available at runtime
export async function POST(request: NextRequest) {
  try {
    const { email, name, branch } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    // Save to Supabase
    const supabase = createAdminClient()
    const { error: dbError } = await supabase
      .from('waitlist')
      .insert({ email, name: name || null, branch: branch || null, source: 'landing' })

    if (dbError) {
      if (dbError.code === '23505') {
        return NextResponse.json({ error: 'already_on_list' }, { status: 409 })
      }
      throw dbError
    }

    // Send welcome email — initialize Resend here, not at module level
    const resend = new Resend(process.env.RESEND_API_KEY)
    const firstName = name?.split(' ')[0] || 'there'
    const branchEmoji: Record<string, string> = {
      army: '🪖', marines: '🦅', navy: '⚓',
      airforce: '✈️', coastguard: '🚢', spaceforce: '🚀'
    }
    const emoji = branch ? (branchEmoji[branch] || '🎖️') : '🎖️'

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: email,
      subject: "You're on the BootMail waitlist 🎖️",
      html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0e8;padding:40px 20px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
<tr><td style="background:#1a1a16;padding:32px 40px;text-align:center;">
  <div style="font-family:Arial,sans-serif;font-size:32px;font-weight:900;letter-spacing:6px;color:#fff;">BOOT<span style="color:#d4a017;">MAIL</span></div>
  <div style="font-family:Courier,monospace;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#c8b89a;margin-top:8px;">More Than Mail. It's Morale.</div>
</td></tr>
<tr><td style="background:#4a5240;padding:48px 40px;text-align:center;">
  <div style="font-size:48px;margin-bottom:16px;">${emoji}</div>
  <div style="font-family:Arial,sans-serif;font-size:28px;font-weight:900;letter-spacing:3px;color:#fff;text-transform:uppercase;margin-bottom:12px;">You're In, ${firstName}.</div>
  <div style="font-family:Georgia,serif;font-style:italic;font-size:16px;color:#c8b89a;line-height:1.6;">You're on the BootMail early access waitlist.<br>When we launch, you'll be first — with <strong style="color:#fff;">5 free letters</strong> waiting for you.</div>
</td></tr>
<tr><td style="background:#fffbf0;padding:32px 40px;border-left:4px solid #d4a017;">
  <div style="font-family:Courier,monospace;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#d4a017;margin-bottom:8px;">🏅 Founding Member Benefit</div>
  <div style="font-family:Georgia,serif;font-size:15px;color:#444;line-height:1.6;">As an early access member, you'll receive <strong>5 free letters</strong> when we launch and <strong>locked-in founding member pricing</strong> — your rate never goes up.</div>
</td></tr>
<tr><td style="background:#fff;padding:32px 40px;text-align:center;border-top:1px solid #e8ddd0;">
  <div style="font-family:Georgia,serif;font-size:14px;color:#666;margin-bottom:16px;">Know another military family? Share BootMail with them.</div>
  <a href="https://bootmail.app" style="display:inline-block;background:#4a5240;color:#fff;font-family:Courier,monospace;font-size:11px;letter-spacing:3px;text-transform:uppercase;padding:14px 28px;text-decoration:none;">Share bootmail.app →</a>
</td></tr>
<tr><td style="background:#1a1a16;padding:24px 40px;text-align:center;">
  <div style="font-family:Courier,monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#4a4a40;">© 2026 BootMail · bootmail.app</div>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`,
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Waitlist error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
