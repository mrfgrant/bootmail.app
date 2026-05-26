import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' })

const BUNDLES = {
  single:   { letters: 1,  price: 299,  name: '1 Letter' },
  bundle3:  { letters: 3,  price: 799,  name: '3 Letters' },
  bundle10: { letters: 10, price: 1999, name: '10 Letters' },
}

export async function POST(request: NextRequest) {
  try {
    const { bundle, letterId, recruitId } = await request.json()

    const supabase = createAdminClient()
    const bundleInfo = BUNDLES[bundle as keyof typeof BUNDLES]
    if (!bundleInfo) return NextResponse.json({ error: 'Invalid bundle' }, { status: 400 })

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'BootMail ' + bundleInfo.name,
            description: bundleInfo.letters + ' physical letter' + (bundleInfo.letters > 1 ? 's' : '') + ' printed and mailed via USPS',
            images: ['https://bootmail.app/og-image.png'],
          },
          unit_amount: bundleInfo.price,
        },
        quantity: 1,
      }],
      success_url: process.env.NEXT_PUBLIC_APP_URL + '/dashboard/letters?sent=1&session_id={CHECKOUT_SESSION_ID}',
      cancel_url: process.env.NEXT_PUBLIC_APP_URL + '/dashboard/letters/new',
      metadata: {
        bundle,
        letterId: letterId ?? '',
        recruitId: recruitId ?? '',
        letters: bundleInfo.letters.toString(),
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Checkout error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
