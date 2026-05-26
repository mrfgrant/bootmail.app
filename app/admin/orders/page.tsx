'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('orders')
        .select('*, profiles!inner(email, full_name)')
        .order('created_at', { ascending: false })
      setOrders(data ?? [])
      const rev = data?.reduce((sum, o) => sum + parseFloat(o.amount_total ?? '0'), 0) ?? 0
      setTotal(rev)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#6b7560' }} className="uppercase tracking-widest">Loading...</div>

  return (
    <div>
      <div className="flex items-end justify-between mb-8">
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '4px', color: '#6b7560' }} className="uppercase mb-2">Revenue</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '48px', letterSpacing: '3px', color: '#1a1a16' }}>Orders</h1>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '3px', color: '#6b7560' }} className="uppercase mb-1">Total Revenue</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '40px', color: '#d4a017' }}>${total.toFixed(2)}</div>
        </div>
      </div>

      {orders.length === 0 && (
        <div style={{ background: '#ffffff', padding: '48px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#6b7560' }} className="uppercase tracking-widest">No orders yet</div>
        </div>
      )}

      {orders.length > 0 && (
        <div className="space-y-0.5">
          {orders.map(order => (
            <div key={order.id} style={{ background: '#ffffff', padding: '20px 24px' }}
              className="flex items-center justify-between">
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', letterSpacing: '1px', color: '#1a1a16' }}>
                  {order.profiles?.full_name ?? order.profiles?.email}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#6b7560', marginTop: '4px' }} className="uppercase tracking-wider">
                  {order.order_type} · {order.paid_at ? new Date(order.paid_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Pending'}
                </div>
                {order.stripe_session_id && (
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: '#bbb', marginTop: '4px' }}>
                    {order.stripe_session_id}
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '16px' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: '#4a5240' }}>
                  ${parseFloat(order.amount_total ?? '0').toFixed(2)}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px', color: order.status === 'paid' ? '#27ae60' : '#6b7560' }} className="uppercase">
                  {order.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
