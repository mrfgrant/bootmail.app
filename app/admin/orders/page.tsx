import { createClient } from '@/lib/supabase/server'

export default async function AdminOrdersPage() {
  const supabase = createClient()
  const { data: orders } = await supabase
    .from('orders')
    .select('*, profiles(email, full_name)')
    .order('created_at', { ascending: false })

  const totalRevenue = orders?.reduce((sum, o) => sum + (parseFloat(o.amount_total) ?? 0), 0) ?? 0

  return (
    <div>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '4px', color: '#4a5240' }} className="uppercase mb-2">Revenue</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '48px', letterSpacing: '3px', color: '#ffffff' }}>Orders</h1>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '48px', color: '#d4a017', lineHeight: 1 }}>
            ${totalRevenue.toFixed(2)}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#4a5240', marginTop: '4px' }} className="uppercase">
            Total Revenue · {orders?.length ?? 0} Orders
          </div>
        </div>
      </div>

      <div className="space-y-0.5">
        {orders?.map(order => (
          <div key={order.id}
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', padding: '16px 20px' }}
            className="flex items-center justify-between">
            <div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#ffffff' }}>
                {(order as any).profiles?.full_name ?? (order as any).profiles?.email}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#4a5240', marginTop: '2px' }} className="uppercase">
                {order.order_type} · {order.stripe_session_id ? 'Stripe' : 'Credit'}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: '#4a4a40', marginTop: '2px' }}>
                {new Date(order.paid_at ?? order.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <div className="text-right">
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: '#d4a017' }}>
                ${parseFloat(order.amount_total).toFixed(2)}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: '#27ae60', marginTop: '2px' }} className="uppercase">
                {order.status}
              </div>
            </div>
          </div>
        ))}
        {(orders?.length ?? 0) === 0 && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#4a4a40', padding: '40px 0', textAlign: 'center' }} className="uppercase tracking-wider">
            No orders yet
          </div>
        )}
      </div>
    </div>
  )
}
