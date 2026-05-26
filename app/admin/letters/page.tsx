'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const STATUS_OPTIONS = [
  { value: 'paid',      label: 'Paid / Queue',  color: '#d4a017' },
  { value: 'processing',label: 'Processing',    color: '#2980b9' },
  { value: 'printed',   label: 'Printed',       color: '#8e44ad' },
  { value: 'mailed',    label: 'Mailed',        color: '#27ae60' },
  { value: 'delivered', label: 'Delivered',     color: '#1a1a16' },
]

export default function AdminLettersPage() {
  const [letters, setLetters] = useState<any[]>([])
  const [filter, setFilter] = useState('paid')
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string>('')
  const [tracking, setTracking] = useState<Record<string, string>>({})

  async function load(status: string) {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('letters')
      .select(`
        id, status, body, photo_urls, submitted_at, mailed_at, tracking_number,
        price_paid, include_newsletter, created_at,
        recruits!inner(full_name, branch, address_line1, address_line2, city, state, zip, company, platoon),
        profiles!inner(email, full_name)
      `)
      .eq('status', status)
      .order('submitted_at', { ascending: true })
    setLetters(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load(filter) }, [filter])

  async function updateStatus(letterId: string, status: string) {
    setUpdating(letterId)
    await fetch('/api/admin/update-letter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ letterId, status, trackingNumber: tracking[letterId] }),
    })
    await load(filter)
    setUpdating('')
  }

  async function markAllPrinted() {
    const paidLetters = letters.filter(l => l.status === 'paid')
    for (const letter of paidLetters) {
      await fetch('/api/admin/update-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ letterId: letter.id, status: 'printed' }),
      })
    }
    await load(filter)
  }

  return (
    <div>
      <div className="flex items-end justify-between mb-8">
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '4px', color: '#6b7560' }} className="uppercase mb-2">Fulfillment Queue</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '48px', letterSpacing: '3px', color: '#1a1a16' }}>Letters</h1>
        </div>
        {filter === 'paid' && letters.length > 0 && (
          <button onClick={markAllPrinted}
            style={{ background: '#8e44ad', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '2px', border: 'none', cursor: 'pointer', padding: '12px 24px', color: '#ffffff' }}
            className="uppercase hover:opacity-90">
            Mark All Printed ({letters.length})
          </button>
        )}
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-0.5 mb-6 overflow-x-auto">
        {STATUS_OPTIONS.map(s => (
          <button key={s.value} onClick={() => setFilter(s.value)}
            style={{
              fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px',
              padding: '10px 20px', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
              background: filter === s.value ? s.color : '#ffffff',
              color: filter === s.value ? '#ffffff' : '#6b7560',
            }}
            className="uppercase transition-colors">
            {s.label}
          </button>
        ))}
      </div>

      {loading && <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#6b7560' }} className="uppercase tracking-widest">Loading...</div>}

      {!loading && letters.length === 0 && (
        <div style={{ background: '#ffffff', padding: '48px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#6b7560' }} className="uppercase tracking-widest">
            No letters with status: {filter}
          </div>
        </div>
      )}

      {!loading && letters.length > 0 && (
        <div className="space-y-0.5">
          {letters.map(letter => {
            const recruit = letter.recruits
            const sender = letter.profiles
            const statusInfo = STATUS_OPTIONS.find(s => s.value === letter.status)
            return (
              <div key={letter.id} style={{ background: '#ffffff', padding: '24px' }}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                  {/* Recruit address */}
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '3px', color: '#6b7560', marginBottom: '8px' }} className="uppercase">
                      Mail To
                    </div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', letterSpacing: '1px', color: '#1a1a16' }}>
                      {recruit?.full_name}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#4a5240', marginTop: '2px' }} className="uppercase tracking-wider">
                      {recruit?.branch}
                    </div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#555', marginTop: '8px', lineHeight: '1.6' }}>
                      {recruit?.address_line1 && <div>{recruit.address_line1}</div>}
                      {recruit?.address_line2 && <div>{recruit.address_line2}</div>}
                      {recruit?.city && <div>{recruit.city}{recruit.state ? ', ' + recruit.state : ''} {recruit.zip}</div>}
                    </div>
                    {!recruit?.address_line1 && (
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#c0392b', marginTop: '8px' }} className="uppercase">
                        ⚠ No address on file
                      </div>
                    )}
                  </div>

                  {/* Letter content */}
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '3px', color: '#6b7560', marginBottom: '8px' }} className="uppercase">
                      From: {sender?.full_name} · {sender?.email}
                    </div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#555', lineHeight: '1.5', fontStyle: 'italic' }}>
                      &ldquo;{letter.body?.slice(0, 120)}...&rdquo;
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#6b7560', marginTop: '8px' }} className="uppercase tracking-wider">
                      {letter.photo_urls?.length > 0 && letter.photo_urls.length + ' photo' + (letter.photo_urls.length > 1 ? 's' : '') + ' · '}
                      {letter.include_newsletter && 'Newsletter · '}
                      Submitted: {letter.submitted_at ? new Date(letter.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Draft'}
                    </div>
                  </div>

                  {/* Actions */}
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '3px', color: '#6b7560', marginBottom: '8px' }} className="uppercase">
                      Status & Actions
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '2px', color: statusInfo?.color ?? '#6b7560', marginBottom: '12px' }} className="uppercase">
                      ● {statusInfo?.label ?? letter.status}
                    </div>

                    {/* Tracking input */}
                    {(letter.status === 'printed' || letter.status === 'processing') && (
                      <input
                        value={tracking[letter.id] ?? letter.tracking_number ?? ''}
                        onChange={e => setTracking(prev => ({ ...prev, [letter.id]: e.target.value }))}
                        placeholder="USPS tracking number"
                        style={{ background: '#f8f5f0', border: '1px solid #c8b89a', color: '#1a1a16', width: '100%', padding: '8px 12px', fontSize: '12px', outline: 'none', marginBottom: '8px', fontFamily: 'var(--font-mono)' }}
                      />
                    )}

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2">
                      {letter.status === 'paid' && (
                        <button onClick={() => updateStatus(letter.id, 'printed')}
                          disabled={updating === letter.id}
                          style={{ background: '#8e44ad', fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px', border: 'none', cursor: 'pointer', padding: '8px 16px', color: '#ffffff' }}
                          className="uppercase hover:opacity-90 disabled:opacity-50">
                          {updating === letter.id ? '...' : 'Mark Printed'}
                        </button>
                      )}
                      {letter.status === 'printed' && (
                        <button onClick={() => updateStatus(letter.id, 'mailed')}
                          disabled={updating === letter.id}
                          style={{ background: '#27ae60', fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px', border: 'none', cursor: 'pointer', padding: '8px 16px', color: '#ffffff' }}
                          className="uppercase hover:opacity-90 disabled:opacity-50">
                          {updating === letter.id ? '...' : 'Mark Mailed'}
                        </button>
                      )}
                      {letter.status === 'mailed' && (
                        <button onClick={() => updateStatus(letter.id, 'delivered')}
                          disabled={updating === letter.id}
                          style={{ background: '#1a1a16', fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px', border: 'none', cursor: 'pointer', padding: '8px 16px', color: '#ffffff' }}
                          className="uppercase hover:opacity-90 disabled:opacity-50">
                          {updating === letter.id ? '...' : 'Mark Delivered'}
                        </button>
                      )}
                      {letter.photo_urls?.length > 0 && (
                        <button onClick={() => window.open(letter.photo_urls[0], '_blank')}
                          style={{ background: 'transparent', border: '1px solid #c8b89a', fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px', cursor: 'pointer', padding: '8px 16px', color: '#6b7560' }}
                          className="uppercase hover:border-olive hover:text-olive transition-colors">
                          View Photos
                        </button>
                      )}
                    </div>

                    {letter.tracking_number && (
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#27ae60', marginTop: '8px' }} className="uppercase">
                        Tracking: {letter.tracking_number}
                      </div>
                    )}
                  </div>

                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
