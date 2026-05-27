import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' })

const LETTER_BUNDLES: Record<string, { letters: number; price: number; name: string }> = {
  single:   { letters: 1,  price: 299,  name: '1 Letter' },
  bundle3:  { letters: 3,  price: 799,  name: '3 Letters' },
  bundle10: { letters: 10, price: 1999, name: '10 Letters' },
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type } = body

    // ── CARE PACKAGE CHECKOUT ──────────────────────────────
    if (type === 'package') {
      const { recruitId, items, note, total, subtotal, shipping } = body

      const supabase = createAdminClient()

      // Get user from session via auth header
      const authHeader = request.headers.get('authorization')
      let userId = ''
      if (authHeader) {
        const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
        userId = user?.id ?? ''
      }

      // Save draft package
      const { data: pkg } = await supabase.from('packages').insert({
        sender_id: userId || null,
        recruit_id: recruitId,
        items,
        personal_note: note || null,
        status: 'draft',
        subtotal: parseFloat(subtotal),
        shipping_cost: parseFloat(shipping),
        total: parseFloat(total),
        package_type: 'custom',
      }).select().single()

      const lineItems = items.map((item: any) => ({
        price_data: {
          currency: 'usd',
          product_data: { name: item.name },
          unit_amount: Math.round(parseFloat(item.price) * 100),
        },
        quantity: item.qty,
      }))

      // Add shipping as line item
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: { name: 'Shipping to Base' },
          unit_amount: Math.round(parseFloat(shipping) * 100),
        },
        quantity: 1,
      })

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: lineItems,
        success_url: process.env.NEXT_PUBLIC_APP_URL + '/dashboard/packages?ordered=1',
        cancel_url: process.env.NEXT_PUBLIC_APP_URL + '/dashboard/packages',
        metadata: {
          type: 'package',
          packageId: pkg?.id ?? '',
          recruitId,
        },
      })

      return NextResponse.json({ url: session.url })
    }

    // ── LETTER BUNDLE CHECKOUT ─────────────────────────────
    const { bundle, letterId, recruitId } = body
    const bundleInfo = LETTER_BUNDLES[bundle as keyof typeof LETTER_BUNDLES]
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
          },
          unit_amount: bundleInfo.price,
        },
        quantity: 1,
      }],
      success_url: process.env.NEXT_PUBLIC_APP_URL + '/dashboard/letters?sent=1&session_id={CHECKOUT_SESSION_ID}',
      cancel_url: process.env.NEXT_PUBLIC_APP_URL + '/dashboard/letters/new',
      metadata: {
        type: 'letters',
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
