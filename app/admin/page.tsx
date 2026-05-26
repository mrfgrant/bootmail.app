'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalLetters: 0,
    pendingLetters: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    waitlistCount: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const [
        { count: totalLetters },
        { count: pendingLetters },
        { data: orders },
        { count: totalCustomers },
        { count: waitlistCount },
      ] = await Promise.all([
        supabase.from('letters').select('*', { count: 'exact', head: true }),
        supabase.from('letters').select('*', { count: 'exact', head: true }).in('status', ['paid', 'processing']),
        supabase.from('orders').select('amount_total').eq('status', 'paid'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('waitlist').select('*', { count: 'exact', head: true }),
      ])

      const totalRevenue = orders?.reduce((sum, o) => sum + parseFloat(o.amount_total ?? '0'), 0) ?? 0

      setStats({
        totalLetters: totalLetters ?? 0,
        pendingLetters: pendingLetters ?? 0,
        totalOrders: orders?.length ?? 0,
        totalRevenue,
        totalCustomers: totalCustomers ?? 0,
        waitlistCount: waitlistCount ?? 0,
      })
      setLoading(false)
    }
    load()
  }, [])

  const statCards = [
    { label: 'Letters to Fulfill', value: stats.pendingLetters, color: '#c0392b', href: '/admin/letters', urgent: stats.pendingLetters > 0 },
    { label: 'Total Letters Sent', value: stats.totalLetters, color: '#4a5240', href: '/admin/letters' },
    { label: 'Total Revenue', value: '$' + stats.totalRevenue.toFixed(2), color: '#d4a017', href: '/admin/orders' },
    { label: 'Total Orders', value: stats.totalOrders, color: '#4a5240', href: '/admin/orders' },
    { label: 'Customers', value: stats.totalCustomers, color: '#4a5240', href: '/admin/customers' },
    { label: 'Waitlist', value: stats.waitlistCount, color: '#6b7560', href: '/admin/waitlist' },
  ]

  if (loading) return <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#6b7560' }} className="uppercase tracking-widest">Loading...</div>

  return (
    <div>
      <div className="mb-8">
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '4px', color: '#6b7560' }} className="uppercase mb-2">Admin</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '48px', letterSpacing: '3px', color: '#1a1a16' }}>Operations</h1>
      </div>

      {stats.pendingLetters > 0 && (
        <Link href="/admin/letters">
          <div style={{ background: '#c0392b', padding: '16px 24px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            className="hover:opacity-90 transition-opacity">
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', letterSpacing: '2px', color: '#ffffff' }}>
                🚨 {stats.pendingLetters} Letter{stats.pendingLetters !== 1 ? 's' : ''} Need Fulfillment
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px', color: 'rgba(255,255,255,0.7)' }} className="uppercase mt-1">
                Click to view and process →
              </div>
            </div>
          </div>
        </Link>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-0.5 mb-8">
        {statCards.map(s => (
          <Link key={s.label} href={s.href}>
            <div style={{ background: '#ffffff', padding: '28px', borderTop: '4px solid ' + s.color }}
              className="hover:shadow-md transition-shadow">
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '40px', color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px', color: '#6b7560', marginTop: '8px' }} className="uppercase">{s.label}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-0.5">
        {[
          { href: '/admin/letters', icon: '✉️', title: 'Fulfill Letters', desc: 'Print queue, mark as mailed, add tracking numbers' },
          { href: '/admin/orders', icon: '💳', title: 'Orders', desc: 'All payments, Stripe sessions, order history' },
          { href: '/admin/waitlist', icon: '📋', title: 'Waitlist', desc: 'Everyone who signed up, branch breakdown, export CSV' },
        ].map(a => (
          <Link key={a.href} href={a.href}>
            <div style={{ background: '#ffffff', padding: '28px' }} className="hover:shadow-md transition-shadow">
              <div className="text-3xl mb-3">{a.icon}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', letterSpacing: '2px', color: '#1a1a16' }} className="mb-2">{a.title}</div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#6b7560', fontStyle: 'italic' }}>{a.desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
