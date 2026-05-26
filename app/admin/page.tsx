import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AdminPage() {
  const supabase = createClient()

  const [
    { count: totalUsers },
    { count: totalLetters },
    { count: pendingLetters },
    { count: totalOrders },
    { data: recentOrders },
    { data: recentLetters },
    { count: waitlistCount },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('letters').select('*', { count: 'exact', head: true }),
    supabase.from('letters').select('*', { count: 'exact', head: true }).eq('status', 'paid'),
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*, profiles(email, full_name)').order('created_at', { ascending: false }).limit(5),
    supabase.from('letters').select('*, recruits(full_name, branch, address_line1, city, state, zip), profiles(email, full_name)').eq('status', 'paid').order('created_at', { ascending: false }).limit(10),
    supabase.from('waitlist').select('*', { count: 'exact', head: true }),
  ])

  const stats = [
    { label: 'Total Users', value: totalUsers ?? 0, color: '#d4a017', href: '/admin/users' },
    { label: 'Letters to Fulfill', value: pendingLetters ?? 0, color: '#c0392b', href: '/admin/letters' },
    { label: 'Total Letters', value: totalLetters ?? 0, color: '#4a5240', href: '/admin/letters' },
    { label: 'Total Orders', value: totalOrders ?? 0, color: '#2980b9', href: '/admin/orders' },
    { label: 'Waitlist', value: waitlistCount ?? 0, color: '#8e44ad', href: '/admin/waitlist' },
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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-0.5 mb-8">
        {stats.map(s => (
          <Link key={s.label} href={s.href}
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', padding: '24px' }}
            className="block hover:bg-white/5 transition-colors">
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '48px', color: s.color, lineHeight: 1 }}>
              {s.value}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '2px', color: '#4a5240', marginTop: '8px' }} className="uppercase">
              {s.label}
            </div>
          </Link>
        ))}
      </div>

      {/* Letters to fulfill — the most important section */}
      {(pendingLetters ?? 0) > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '4px', color: '#c0392b' }} className="uppercase">
              🔴 Needs Fulfillment — {pendingLetters} Letter{(pendingLetters ?? 0) > 1 ? 's' : ''}
            </div>
            <Link href="/admin/letters"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px', color: '#6b7560', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 14px' }}
              className="uppercase hover:text-white transition-colors">
              View All →
            </Link>
          </div>
          <div className="space-y-0.5">
            {recentLetters?.map(letter => (
              <div key={letter.id}
                style={{ background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.2)', padding: '16px 20px' }}
                className="flex items-start justify-between gap-4">
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', letterSpacing: '1px', color: '#ffffff' }}>
                    {(letter as any).recruits?.full_name}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#6b7560', marginTop: '2px' }} className="uppercase">
                    {(letter as any).recruits?.branch} · {(letter as any).recruits?.address_line1}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#6b7560' }}>
                    {(letter as any).recruits?.city}{(letter as any).recruits?.state ? ', ' + (letter as any).recruits?.state : ''} {(letter as any).recruits?.zip}
                  </div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: '#4a5240', fontStyle: 'italic', marginTop: '6px' }}>
                    From: {(letter as any).profiles?.full_name ?? (letter as any).profiles?.email}
                  </div>
                  {letter.photo_urls?.length > 0 && (
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: '#d4a017', marginTop: '4px' }} className="uppercase">
                      📷 {letter.photo_urls.length} photo{letter.photo_urls.length > 1 ? 's' : ''}
                    </div>
                  )}
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: '#555', fontStyle: 'italic', marginTop: '6px', maxWidth: '500px' }}>
                    &ldquo;{letter.body?.slice(0, 100)}...&rdquo;
                  </div>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <Link href={'/admin/letters/' + letter.id}
                    style={{ background: '#d4a017', fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px', padding: '8px 16px', color: '#000', whiteSpace: 'nowrap' }}
                    className="uppercase hover:opacity-90 transition-opacity text-center">
                    View & Print
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(pendingLetters ?? 0) === 0 && (
        <div style={{ background: 'rgba(74,82,64,0.1)', border: '1px solid rgba(74,82,64,0.2)', padding: '32px', textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: '#4a5240', letterSpacing: '2px' }}>All Clear</div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#4a4a40', marginTop: '8px' }} className="uppercase tracking-wider">
            No letters pending fulfillment
          </p>
        </div>
      )}

      {/* Recent orders */}
      <div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '4px', color: '#4a5240' }} className="uppercase mb-4">
          Recent Orders
        </div>
        {recentOrders && recentOrders.length > 0 ? (
          <div className="space-y-0.5">
            {recentOrders.map(order => (
              <div key={order.id}
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '14px 20px' }}
                className="flex items-center justify-between">
                <div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#ffffff' }}>
                    {(order as any).profiles?.full_name ?? (order as any).profiles?.email}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#4a5240', marginTop: '2px' }} className="uppercase">
                    {order.order_type} · {new Date(order.paid_at ?? order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: '#d4a017' }}>
                  ${order.amount_total}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#4a4a40', padding: '20px 0' }} className="uppercase tracking-wider">
            No orders yet
          </div>
        )}
      </div>
    </div>
  )
}
