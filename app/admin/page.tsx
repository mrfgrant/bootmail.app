'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function AdminPage() {
  const [stats, setStats] = useState({ users: 0, pending: 0, total: 0, orders: 0, waitlist: 0, revenue: 0 })
  const [pendingLetters, setPendingLetters] = useState<any[]>([])
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState('')

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const supabase = createClient()

    const [
      { count: users },
      { count: pending },
      { count: total },
      { count: orders },
      { count: waitlist },
      { data: letters },
      { data: orderData },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('letters').select('*', { count: 'exact', head: true }).eq('status', 'paid'),
      supabase.from('letters').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('*', { count: 'exact', head: true }),
      supabase.from('waitlist').select('*', { count: 'exact', head: true }),
      supabase.from('letters').select('*, recruits(full_name, branch, address_line1, city, state, zip), profiles(email, full_name)').eq('status', 'paid').order('created_at', { ascending: false }).limit(10),
      supabase.from('orders').select('*, profiles(email, full_name)').order('created_at', { ascending: false }).limit(5),
    ])

    const revenue = orderData?.reduce((sum, o) => sum + parseFloat(o.amount_total ?? 0), 0) ?? 0
    setStats({ users: users ?? 0, pending: pending ?? 0, total: total ?? 0, orders: orders ?? 0, waitlist: waitlist ?? 0, revenue })
    setPendingLetters(letters ?? [])
    setRecentOrders(orderData ?? [])
    setLoading(false)
  }

  async function updateStatus(id: string, status: string) {
    setUpdating(id)
    const supabase = createClient()
    await supabase.from('letters').update({ status }).eq('id', id)
    await load()
    setUpdating('')
  }

  if (loading) return (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#4a5240' }} className="uppercase tracking-widest">Loading...</div>
  )

  const statItems = [
    { label: 'Users', value: stats.users, color: '#d4a017', href: '/admin/users' },
    { label: 'To Fulfill', value: stats.pending, color: '#c0392b', href: '/admin/letters' },
    { label: 'Total Letters', value: stats.total, color: '#4a5240', href: '/admin/letters' },
    { label: 'Orders', value: stats.orders, color: '#2980b9', href: '/admin/orders' },
    { label: 'Waitlist', value: stats.waitlist, color: '#8e44ad', href: '/admin/waitlist' },
    { label: 'Revenue', value: '$' + stats.revenue.toFixed(2), color: '#27ae60', href: '/admin/orders' },
  ]

  return (
    <div>
      <div className="mb-8">
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '4px', color: '#4a5240' }} className="uppercase mb-2">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '48px', letterSpacing: '3px', color: '#ffffff' }}>
          Command Center
        </h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-0.5 mb-8">
        {statItems.map(s => (
          <Link key={s.label} href={s.href}
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', padding: '20px' }}
            className="block hover:bg-white/5 transition-colors">
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '40px', color: s.color, lineHeight: 1 }}>
              {s.value}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '2px', color: '#4a5240', marginTop: '6px' }} className="uppercase">
              {s.label}
            </div>
          </Link>
        ))}
      </div>

      {/* Pending letters */}
      {stats.pending > 0 ? (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '4px', color: '#c0392b' }} className="uppercase">
              🔴 Needs Fulfillment — {stats.pending} Letter{stats.pending > 1 ? 's' : ''}
            </div>
            <Link href="/admin/letters"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px', color: '#6b7560', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 14px' }}
              className="uppercase hover:text-white transition-colors">
              View All →
            </Link>
          </div>
          <div className="space-y-0.5">
            {pendingLetters.map(letter => (
              <div key={letter.id}
                style={{ background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.2)', padding: '16px 20px' }}
                className="flex items-start justify-between gap-4">
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', letterSpacing: '1px', color: '#ffffff' }}>
                    {letter.recruits?.full_name}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#6b7560', marginTop: '2px' }} className="uppercase">
                    {letter.recruits?.branch} · {letter.recruits?.address_line1}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#6b7560' }}>
                    {letter.recruits?.city}{letter.recruits?.state ? ', ' + letter.recruits.state : ''} {letter.recruits?.zip}
                  </div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: '#4a5240', fontStyle: 'italic', marginTop: '4px' }}>
                    From: {letter.profiles?.full_name ?? letter.profiles?.email}
                  </div>
                  {letter.photo_urls?.length > 0 && (
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: '#d4a017', marginTop: '4px' }} className="uppercase">
                      📷 {letter.photo_urls.length} photo{letter.photo_urls.length > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <Link href={'/admin/letters/' + letter.id}
                    style={{ background: '#d4a017', fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px', padding: '8px 16px', color: '#000', whiteSpace: 'nowrap', textAlign: 'center' }}
                    className="uppercase hover:opacity-90">
                    View & Print
                  </Link>
                  <button onClick={() => updateStatus(letter.id, 'printed')} disabled={updating === letter.id}
                    style={{ background: '#2980b9', fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px', padding: '8px 16px', border: 'none', cursor: 'pointer', color: '#fff' }}
                    className="uppercase hover:opacity-90 disabled:opacity-50">
                    {updating === letter.id ? '...' : 'Mark Printed'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ background: 'rgba(74,82,64,0.1)', border: '1px solid rgba(74,82,64,0.2)', padding: '32px', textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: '#4a5240', letterSpacing: '2px' }}>All Clear</div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#4a4a40', marginTop: '8px' }} className="uppercase tracking-wider">No letters pending fulfillment</p>
        </div>
      )}

      {/* Recent orders */}
      <div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '4px', color: '#4a5240' }} className="uppercase mb-4">Recent Orders</div>
        {recentOrders.length > 0 ? (
          <div className="space-y-0.5">
            {recentOrders.map(order => (
              <div key={order.id}
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '14px 20px' }}
                className="flex items-center justify-between">
                <div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#ffffff' }}>
                    {order.profiles?.full_name ?? order.profiles?.email}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#4a5240', marginTop: '2px' }} className="uppercase">
                    {order.order_type} · {new Date(order.paid_at ?? order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: '#d4a017' }}>
                  ${parseFloat(order.amount_total).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#4a4a40' }} className="uppercase tracking-wider">No orders yet</div>
        )}
      </div>
    </div>
  )
}
