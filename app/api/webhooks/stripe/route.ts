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

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', { apiVersion: '2024-04-10' })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  console.log('Stripe webhook:', event.type)

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const type = session.metadata?.type ?? 'letters'
    const customerEmail = session.customer_details?.email ?? ''
    const supabase = createAdminClient()

    if (!customerEmail) return NextResponse.json({ received: true })

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, letter_credits')
      .eq('email', customerEmail)
      .single()

    if (!profile) {
      console.error('No profile for:', customerEmail)
      return NextResponse.json({ received: true })
    }

    if (type === 'package') {
      // Update package to paid
      const packageId = session.metadata?.packageId ?? ''
      if (packageId) {
        await supabase.from('packages').update({ status: 'paid' }).eq('id', packageId)
      }

      // Save order
      await supabase.from('orders').insert({
        profile_id: profile.id,
        order_type: 'package',
        stripe_session_id: session.id,
        stripe_payment_intent: session.payment_intent as string,
        amount_total: (session.amount_total ?? 0) / 100,
        status: 'paid',
        paid_at: new Date().toISOString(),
        line_items: [{ name: 'Care Package', quantity: 1, unit_price: (session.amount_total ?? 0) / 100, total: (session.amount_total ?? 0) / 100 }],
      })

      console.log('Package order saved for:', customerEmail)
    } else {
      // Letters flow
      const letterId = session.metadata?.letterId ?? ''
      const letters = parseInt(session.metadata?.letters ?? '1')
      const currentCredits = profile.letter_credits ?? 0
      const creditsToAdd = letters - (letterId ? 1 : 0)

      await supabase.from('profiles').update({ letter_credits: currentCredits + creditsToAdd }).eq('id', profile.id)

      if (letterId) {
        await supabase.from('letters').update({
          status: 'paid',
          submitted_at: new Date().toISOString(),
          price_paid: (session.amount_total ?? 0) / 100,
        }).eq('id', letterId)
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
        line_items: [{ name: 'BootMail ' + letters + ' Letter Bundle', quantity: 1, unit_price: (session.amount_total ?? 0) / 100, total: (session.amount_total ?? 0) / 100 }],
      })

      console.log('Letter order saved, credits:', currentCredits, '->', currentCredits + creditsToAdd)
    }
  }

  return NextResponse.json({ received: true })
}
