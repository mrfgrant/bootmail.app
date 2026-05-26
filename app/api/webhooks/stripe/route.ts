import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature') ?? ''
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? ''

  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook secret not set' }, { status: 500 })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
    apiVersion: '2024-04-10',
  })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Webhook error:', message)
    return NextResponse.json({ error: message }, { status: 400 })
  }

  console.log('Stripe webhook received:', event.type)

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const letterId = session.metadata?.letterId ?? ''
    const letters = parseInt(session.metadata?.letters ?? '1')
    const customerEmail = session.customer_details?.email ?? ''

    console.log('Payment complete:', customerEmail, letters, 'letters')

    if (!customerEmail) {
      return NextResponse.json({ received: true })
    }

    const supabase = createAdminClient()

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, letter_credits')
      .eq('email', customerEmail)
      .single()

    if (!profile) {
      console.error('No profile for:', customerEmail)
      return NextResponse.json({ received: true })
    }

    const currentCredits = profile.letter_credits ?? 0
    const creditsToAdd = letters - (letterId ? 1 : 0)
    const newCredits = currentCredits + creditsToAdd

    await supabase
      .from('profiles')
      .update({ letter_credits: newCredits })
      .eq('id', profile.id)

    console.log('Credits:', currentCredits, '->', newCredits)

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
        name: 'BootMail ' + letters + ' Letter Bundle',
        quantity: 1,
        unit_price: (session.amount_total ?? 0) / 100,
        total: (session.amount_total ?? 0) / 100,
      }],
    })

    console.log('Order saved for:', customerEmail)
  }

  return NextResponse.json({ received: true })
}
