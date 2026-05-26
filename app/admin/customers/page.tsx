'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('profiles')
        .select('*, recruits(full_name, branch)')
        .order('created_at', { ascending: false })
      setCustomers(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#6b7560' }} className="uppercase tracking-widest">Loading...</div>

  return (
    <div>
      <div className="mb-8">
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '4px', color: '#6b7560' }} className="uppercase mb-2">Users</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '48px', letterSpacing: '3px', color: '#1a1a16' }}>
          Customers <span style={{ color: '#d4a017' }}>{customers.length}</span>
        </h1>
      </div>

      <div className="space-y-0.5">
        {customers.map(c => (
          <div key={c.id} style={{ background: '#ffffff', padding: '20px 24px' }}
            className="flex items-center justify-between">
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', letterSpacing: '1px', color: '#1a1a16' }}>
                {c.full_name || 'No name'}
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#6b7560', marginTop: '2px' }}>{c.email}</div>
              {c.recruits?.length > 0 && (
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#4a5240', marginTop: '6px' }} className="uppercase tracking-wider">
                  {c.recruits.map((r: any) => r.full_name + ' (' + r.branch + ')').join(' · ')}
                </div>
              )}
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '16px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px', color: '#d4a017', marginBottom: '4px' }} className="uppercase">
                {c.letter_credits} credits
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px', color: c.plan !== 'free' ? '#27ae60' : '#bbb' }} className="uppercase">
                {c.plan}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: '#bbb', marginTop: '4px' }}>
                {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
