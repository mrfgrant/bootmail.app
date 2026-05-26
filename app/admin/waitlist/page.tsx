'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const BRANCH_LABELS: Record<string, string> = {
  army: '🪖 Army', marines: '🦅 Marines', navy: '⚓ Navy',
  airforce: '✈️ Air Force', coastguard: '🚢 Coast Guard', spaceforce: '🚀 Space Force',
}

export default function AdminWaitlistPage() {
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('waitlist')
        .select('*')
        .order('created_at', { ascending: false })
      setEntries(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  function exportCSV() {
    const rows = [['Email', 'Name', 'Branch', 'Source', 'Date']]
    entries.forEach(e => rows.push([
      e.email, e.name ?? '', e.branch ?? '', e.source ?? '',
      new Date(e.created_at).toLocaleDateString()
    ]))
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'bootmail-waitlist.csv'
    a.click()
  }

  const branchCounts = entries.reduce((acc, e) => {
    if (e.branch) acc[e.branch] = (acc[e.branch] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  if (loading) return <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#6b7560' }} className="uppercase tracking-widest">Loading...</div>

  return (
    <div>
      <div className="flex items-end justify-between mb-8">
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '4px', color: '#6b7560' }} className="uppercase mb-2">Early Access</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '48px', letterSpacing: '3px', color: '#1a1a16' }}>
            Waitlist <span style={{ color: '#d4a017' }}>{entries.length}</span>
          </h1>
        </div>
        <button onClick={exportCSV}
          style={{ background: '#4a5240', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '2px', border: 'none', cursor: 'pointer', padding: '12px 24px', color: '#ffffff' }}
          className="uppercase hover:opacity-90">
          Export CSV
        </button>
      </div>

      {/* Branch breakdown */}
      {Object.keys(branchCounts).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-0.5 mb-8">
          {Object.entries(branchCounts).map(([branch, count]) => (
            <div key={branch} style={{ background: '#ffffff', padding: '16px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: '#4a5240' }}>{count as number}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: '#6b7560', marginTop: '4px' }} className="uppercase tracking-wider">
                {BRANCH_LABELS[branch] ?? branch}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-0.5">
        {entries.map(entry => (
          <div key={entry.id} style={{ background: '#ffffff', padding: '16px 24px' }}
            className="flex items-center justify-between">
            <div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#1a1a16' }}>{entry.email}</div>
              {entry.name && (
                <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#6b7560', marginTop: '2px' }}>{entry.name}</div>
              )}
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              {entry.branch && (
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#4a5240', marginBottom: '4px' }} className="uppercase tracking-wider">
                  {BRANCH_LABELS[entry.branch] ?? entry.branch}
                </div>
              )}
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: '#bbb' }}>
                {new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
