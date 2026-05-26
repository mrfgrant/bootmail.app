'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const STATUS_COLORS: Record<string, string> = {
  draft:      '#4a4a40',
  paid:       '#c0392b',
  processing: '#e67e22',
  printed:    '#2980b9',
  mailed:     '#8e44ad',
  delivered:  '#27ae60',
}

export default function AdminLettersPage() {
  const [letters, setLetters] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('paid')
  const [updating, setUpdating] = useState<string>('')

  async function load() {
    const supabase = createClient()
    const query = supabase
      .from('letters')
      .select('*, recruits(full_name, branch, address_line1, address_line2, city, state, zip), profiles(email, full_name)')
      .order('created_at', { ascending: false })

    if (filter !== 'all') {
      query.eq('status', filter)
    }

    const { data } = await query
    setLetters(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [filter])

  async function updateStatus(id: string, status: string) {
    setUpdating(id)
    const supabase = createClient()
    await supabase.from('letters').update({ status }).eq('id', id)
    await load()
    setUpdating('')
  }

  const FILTERS = ['paid', 'processing', 'printed', 'mailed', 'delivered', 'all']

  return (
    <div>
      <div className="flex items-end justify-between mb-8">
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '4px', color: '#4a5240' }} className="uppercase mb-2">Fulfillment</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '48px', letterSpacing: '3px', color: '#ffffff' }}>Letters</h1>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#4a5240' }} className="uppercase">
          {letters.length} letter{letters.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Status filter */}
      <div className="flex gap-1 mb-6 flex-wrap">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{
              fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px',
              padding: '8px 16px', border: 'none', cursor: 'pointer',
              background: filter === f ? (STATUS_COLORS[f] ?? '#4a5240') : 'rgba(255,255,255,0.05)',
              color: filter === f ? '#ffffff' : '#6b7560',
            }}
            className="uppercase transition-colors">
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#4a5240' }} className="uppercase tracking-widest">Loading...</div>
      ) : letters.length === 0 ? (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#4a4a40', padding: '40px 0', textAlign: 'center' }} className="uppercase tracking-wider">
          No letters with status: {filter}
        </div>
      ) : (
        <div className="space-y-0.5">
          {letters.map(letter => (
            <div key={letter.id}
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', padding: '20px 24px' }}>
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1">
                  {/* Recipient */}
                  <div className="flex items-center gap-3 mb-2">
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', letterSpacing: '2px', color: '#ffffff' }}>
                      {letter.recruits?.full_name}
                    </div>
                    <div style={{ background: '#4a5240', fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '2px', color: '#ffffff', padding: '2px 8px' }} className="uppercase">
                      {letter.recruits?.branch}
                    </div>
                  </div>

                  {/* Address */}
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#6b7560', lineHeight: '1.6' }}>
                    {letter.recruits?.address_line1 && <div>{letter.recruits.address_line1}</div>}
                    {letter.recruits?.address_line2 && <div>{letter.recruits.address_line2}</div>}
                    {letter.recruits?.city && <div>{letter.recruits.city}{letter.recruits.state ? ', ' + letter.recruits.state : ''} {letter.recruits.zip}</div>}
                    {!letter.recruits?.address_line1 && (
                      <div style={{ color: '#c0392b' }}>⚠ No address on file</div>
                    )}
                  </div>

                  {/* Sender + meta */}
                  <div className="flex items-center gap-4 mt-3">
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#4a5240' }} className="uppercase">
                      From: {letter.profiles?.full_name ?? letter.profiles?.email}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#4a5240' }} className="uppercase">
                      {new Date(letter.submitted_at ?? letter.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {letter.photo_urls?.length > 0 && (
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#d4a017' }} className="uppercase">
                        📷 {letter.photo_urls.length} photo{letter.photo_urls.length > 1 ? 's' : ''}
                      </div>
                    )}
                    {letter.include_newsletter && (
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#8e44ad' }} className="uppercase">
                        📰 Newsletter
                      </div>
                    )}
                  </div>

                  {/* Letter preview */}
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: '13px', color: '#555', fontStyle: 'italic', marginTop: '8px', maxWidth: '600px', lineHeight: '1.5' }}>
                    &ldquo;{letter.body?.slice(0, 150)}{letter.body?.length > 150 ? '...' : ''}&rdquo;
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 flex-shrink-0 min-w-32">
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px', color: STATUS_COLORS[letter.status] ?? '#6b7560', textAlign: 'center', padding: '4px 0' }} className="uppercase">
                    ● {letter.status}
                  </div>

                  <Link href={'/admin/letters/' + letter.id}
                    style={{ background: '#d4a017', fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px', padding: '8px 12px', color: '#000', textAlign: 'center' }}
                    className="uppercase hover:opacity-90 transition-opacity">
                    View & Print
                  </Link>

                  {/* Quick status updates */}
                  {letter.status === 'paid' && (
                    <button onClick={() => updateStatus(letter.id, 'printed')}
                      disabled={updating === letter.id}
                      style={{ background: '#2980b9', fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px', padding: '8px 12px', border: 'none', cursor: 'pointer', color: '#fff' }}
                      className="uppercase hover:opacity-90 disabled:opacity-50">
                      {updating === letter.id ? '...' : 'Mark Printed'}
                    </button>
                  )}
                  {letter.status === 'printed' && (
                    <button onClick={() => updateStatus(letter.id, 'mailed')}
                      disabled={updating === letter.id}
                      style={{ background: '#8e44ad', fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px', padding: '8px 12px', border: 'none', cursor: 'pointer', color: '#fff' }}
                      className="uppercase hover:opacity-90 disabled:opacity-50">
                      {updating === letter.id ? '...' : 'Mark Mailed'}
                    </button>
                  )}
                  {letter.status === 'mailed' && (
                    <button onClick={() => updateStatus(letter.id, 'delivered')}
                      disabled={updating === letter.id}
                      style={{ background: '#27ae60', fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px', padding: '8px 12px', border: 'none', cursor: 'pointer', color: '#fff' }}
                      className="uppercase hover:opacity-90 disabled:opacity-50">
                      {updating === letter.id ? '...' : 'Mark Delivered'}
                    </button>
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
