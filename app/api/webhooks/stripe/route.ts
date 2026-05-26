import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/server'

// Critical: tell Next.js not to parse the body
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
})

export async function POST(request: NextRequest) {
  let body: string
  try {
    body = await request.text()
  } catch {
    return NextResponse.json({ error: 'Could not read body' }, { status: 400 })
  }

  const sig = request.headers.get('stripe-signature')
  if (!sig) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not set')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 400 })
  }

  console.log('Webhook received:', event.type)

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const { letterId, letters } = session.metadata ?? {}
    const letterCount = parseInt(letters ?? '1')

    const supabase = createAdminClient()
    const customerEmail = session.customer_details?.email
    
    console.log('Processing payment for:', customerEmail, 'letters:', letterCount)

    if (!customerEmail) {
      return NextResponse.json({ received: true })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, letter_credits')
      .eq('email', customerEmail)
      .single()

    if (!profile) {
      console.error('Profile not found for email:', customerEmail)
      return NextResponse.json({ received: true })
    }

    // Add credits
    const currentCredits = profile.letter_credits ?? 0
    const creditsToAdd = letterCount - (letterId ? 1 : 0)
    const newCredits = currentCredits + creditsToAdd

    const { error: creditError } = await supabase
      .from('profiles')
      .update({ letter_credits: newCredits })
      .eq('id', profile.id)

    if (creditError) {
      console.error('Credit update error:', creditError)
    } else {
      console.log('Credits updated:', currentCredits, '->', newCredits)
    }

    // Mark draft letter as paid
    if (letterId) {
      await supabase
        .from('letters')
        .update({ 
          status: 'paid', 
          submitted_at: new Date().toISOString(),
          price_paid: (session.amount_total ?? 0) / 100,
        })
        .eq('id', letterId)
    }

    // Save order
    const { error: orderError } = await supabase.from('orders').insert({
      profile_id: profile.id,
      order_type: 'letters',
      stripe_session_id: session.id,
      stripe_payment_intent: session.payment_intent as string,
      amount_total: (session.amount_total ?? 0) / 100,
      status: 'paid',
      letter_ids: letterId ? [letterId] : [],
      paid_at: new Date().toISOString(),
      line_items: [{
        name: 'BootMail ' + letterCount + ' Letter Bundle',
        quantity: 1,
        unit_price: (session.amount_total ?? 0) / 100,
        total: (session.amount_total ?? 0) / 100,
      }],
    })

    if (orderError) {
      console.error('Order save error:', orderError)
    } else {
      console.log('Order saved successfully')
    }
  }

  return NextResponse.json({ received: true })
}
