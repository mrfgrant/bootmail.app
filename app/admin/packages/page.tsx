'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const STATUS_COLORS: Record<string, string> = {
  draft:     '#4a4a40',
  paid:      '#c0392b',
  picking:   '#e67e22',
  shipped:   '#8e44ad',
  delivered: '#27ae60',
}

export default function AdminPackagesPage() {
  const [packages, setPackages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('paid')
  const [updating, setUpdating] = useState('')

  async function load() {
    const supabase = createClient()
    let q = supabase
      .from('packages')
      .select('*, recruits(full_name, branch, address_line1, address_line2, city, state, zip), profiles(email, full_name)')
      .order('created_at', { ascending: false })
    if (filter !== 'all') q = q.eq('status', filter)
    const { data } = await q
    setPackages(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [filter])

  async function updateStatus(id: string, status: string) {
    setUpdating(id)
    const supabase = createClient()
    const update: any = { status }
    if (status === 'shipped') update.shipped_at = new Date().toISOString()
    if (status === 'delivered') update.delivered_at = new Date().toISOString()
    await supabase.from('packages').update(update).eq('id', id)
    await load()
    setUpdating('')
  }

  if (loading) return <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#4a5240' }} className="uppercase tracking-widest">Loading...</div>

  return (
    <div>
      <div className="flex items-end justify-between mb-8">
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '4px', color: '#4a5240' }} className="uppercase mb-2">Fulfillment</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '48px', letterSpacing: '3px', color: '#ffffff' }}>Packages</h1>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#4a5240' }} className="uppercase">
          {packages.length} package{packages.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="flex gap-1 mb-6 flex-wrap">
        {['paid', 'picking', 'shipped', 'delivered', 'all'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px', padding: '8px 16px', border: 'none', cursor: 'pointer', textTransform: 'uppercase' as const, background: filter === f ? (STATUS_COLORS[f] ?? '#4a5240') : 'rgba(255,255,255,0.05)', color: filter === f ? '#ffffff' : '#6b7560' }}>
            {f}
          </button>
        ))}
      </div>

      {packages.length === 0 ? (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#4a4a40', padding: '40px 0', textAlign: 'center' }} className="uppercase tracking-wider">
          No packages with status: {filter}
        </div>
      ) : (
        <div className="space-y-0.5">
          {packages.map(pkg => (
            <div key={pkg.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', padding: '20px 24px' }}>
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1">
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', letterSpacing: '1px', color: '#ffffff', marginBottom: '4px' }}>
                    {pkg.recruits?.full_name}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#6b7560', lineHeight: 1.7 }} className="uppercase">
                    {pkg.recruits?.address_line1}<br />
                    {pkg.recruits?.address_line2 && <>{pkg.recruits.address_line2}<br /></>}
                    {pkg.recruits?.city}, {pkg.recruits?.state} {pkg.recruits?.zip}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#4a5240', marginTop: '8px' }} className="uppercase">
                    From: {pkg.profiles?.full_name ?? pkg.profiles?.email}
                  </div>

                  {/* Items list */}
                  <div style={{ marginTop: '12px', background: 'rgba(255,255,255,0.03)', padding: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '2px', color: '#4a5240', marginBottom: '8px' }} className="uppercase">Items to Pack</div>
                    {pkg.items?.map((item: any, i: number) => (
                      <div key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#c8b89a', display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <span>× {item.qty} &nbsp; {item.name}</span>
                        <span style={{ color: '#6b7560' }}>${(parseFloat(item.price) * item.qty).toFixed(2)}</span>
                      </div>
                    ))}
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: '#d4a017', marginTop: '8px', textAlign: 'right' }}>
                      Total: ${pkg.total}
                    </div>
                  </div>

                  {pkg.personal_note && (
                    <div style={{ fontFamily: 'Georgia, serif', fontSize: '13px', color: '#555', fontStyle: 'italic', marginTop: '8px' }}>
                      Note: &ldquo;{pkg.personal_note}&rdquo;
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 flex-shrink-0">
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: STATUS_COLORS[pkg.status] ?? '#6b7560', textAlign: 'center' }} className="uppercase">
                    ● {pkg.status}
                  </div>
                  {pkg.status === 'paid' && (
                    <button onClick={() => updateStatus(pkg.id, 'picking')} disabled={updating === pkg.id}
                      style={{ background: '#e67e22', fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px', padding: '8px 14px', border: 'none', cursor: 'pointer', color: '#fff' }}
                      className="uppercase hover:opacity-90 disabled:opacity-50">
                      {updating === pkg.id ? '...' : 'Start Picking'}
                    </button>
                  )}
                  {pkg.status === 'picking' && (
                    <button onClick={() => updateStatus(pkg.id, 'shipped')} disabled={updating === pkg.id}
                      style={{ background: '#8e44ad', fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px', padding: '8px 14px', border: 'none', cursor: 'pointer', color: '#fff' }}
                      className="uppercase hover:opacity-90 disabled:opacity-50">
                      {updating === pkg.id ? '...' : 'Mark Shipped'}
                    </button>
                  )}
                  {pkg.status === 'shipped' && (
                    <button onClick={() => updateStatus(pkg.id, 'delivered')} disabled={updating === pkg.id}
                      style={{ background: '#27ae60', fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px', padding: '8px 14px', border: 'none', cursor: 'pointer', color: '#fff' }}
                      className="uppercase hover:opacity-90 disabled:opacity-50">
                      {updating === pkg.id ? '...' : 'Mark Delivered'}
                    </button>
                  )}
                  {pkg.status === 'delivered' && (
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#27ae60', padding: '8px 14px' }} className="uppercase">✓ Delivered</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
