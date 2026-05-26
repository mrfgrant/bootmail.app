import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' })

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    console.error('Webhook signature error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const { letterId, letters } = session.metadata ?? {}
    const letterCount = parseInt(letters ?? '1')
    const supabase = createAdminClient()

    const customerEmail = session.customer_details?.email
    if (!customerEmail) return NextResponse.json({ received: true })

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, letter_credits')
      .eq('email', customerEmail)
      .single()

    if (!profile) return NextResponse.json({ received: true })

    // Add credits — subtract 1 if a letter was already submitted
    const creditsToAdd = letterCount - (letterId ? 1 : 0)
    await supabase
      .from('profiles')
      .update({ letter_credits: (profile.letter_credits ?? 0) + creditsToAdd })
      .eq('id', profile.id)

    // Mark draft letter as paid
    if (letterId) {
      await supabase
        .from('letters')
        .update({ status: 'paid', submitted_at: new Date().toISOString() })
        .eq('id', letterId)
    }

    // Save order record
    await supabase.from('orders').insert({
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
  }

  return NextResponse.json({ received: true })
}
