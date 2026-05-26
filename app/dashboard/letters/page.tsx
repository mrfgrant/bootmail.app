'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

const STATUS_LABELS: Record<string, { label: string, color: string }> = {
  draft:      { label: 'Draft',      color: '#6b7560' },
  paid:       { label: 'Processing', color: '#d4a017' },
  processing: { label: 'Processing', color: '#d4a017' },
  printed:    { label: 'Printed',    color: '#2980b9' },
  mailed:     { label: 'In Transit', color: '#8e44ad' },
  delivered:  { label: 'Delivered',  color: '#27ae60' },
}

export default function LettersPage() {
  const searchParams = useSearchParams()
  const justSent = searchParams.get('sent') === '1'
  const [letters, setLetters] = useState<any[]>([])
  const [recruits, setRecruits] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/auth/login'; return }

      const [{ data: l }, { data: r }] = await Promise.all([
        supabase.from('letters').select('*').eq('sender_id', session.user.id).order('created_at', { ascending: false }),
        supabase.from('recruits').select('*').eq('owner_id', session.user.id),
      ])

      setLetters(l ?? [])
      const recruitMap: Record<string, any> = {}
      r?.forEach(rec => { recruitMap[rec.id] = rec })
      setRecruits(recruitMap)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#6b7560' }} className="uppercase tracking-widest">Loading...</div>

  return (
    <div>
      <div className="flex items-end justify-between mb-8">
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '4px', color: '#6b7560' }} className="uppercase mb-2">Your Letters</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '48px', letterSpacing: '3px', color: '#1a1a16' }}>Letters</h1>
        </div>
        <Link href="/dashboard/letters/new"
          style={{ background: '#d4a017', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '3px' }}
          className="px-6 py-3 text-black uppercase hover:opacity-90">
          + Write Letter
        </Link>
      </div>

      {justSent && (
        <div style={{ background: 'rgba(74,82,64,0.1)', border: '1px solid rgba(74,82,64,0.3)', padding: '16px 20px', marginBottom: '24px' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#4a5240' }} className="uppercase tracking-wider">
            🎖️ Letter sent! It will be printed and mailed today.
          </p>
        </div>
      )}

      {letters.length === 0 && (
        <div style={{ background: '#ffffff', padding: '48px', textAlign: 'center' }}>
          <div className="text-5xl mb-4">✉️</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', letterSpacing: '2px', color: '#1a1a16' }} className="mb-3">No letters yet</div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#6b7560', fontStyle: 'italic' }} className="mb-6">Your first letter will mean the world to your recruit.</p>
          <Link href="/dashboard/letters/new"
            style={{ background: '#d4a017', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '3px' }}
            className="inline-block px-8 py-4 text-black uppercase hover:opacity-90">
            Write First Letter →
          </Link>
        </div>
      )}

      {letters.length > 0 && (
        <div className="space-y-0.5">
          {letters.map(letter => {
            const recruit = recruits[letter.recruit_id]
            const status = STATUS_LABELS[letter.status] ?? { label: letter.status, color: '#6b7560' }
            return (
              <div key={letter.id} style={{ background: '#ffffff', padding: '20px 24px' }}
                className="flex items-center justify-between">
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', letterSpacing: '1px', color: '#1a1a16' }}>
                    To: {recruit?.full_name ?? 'Unknown'}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#6b7560', marginTop: '4px' }} className="uppercase tracking-wider">
                    {new Date(letter.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    {letter.photo_urls?.length > 0 && ' · ' + letter.photo_urls.length + ' photo' + (letter.photo_urls.length > 1 ? 's' : '')}
                  </div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#999', fontStyle: 'italic', marginTop: '4px' }}>
                    {letter.body?.slice(0, 80)}...
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '16px' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px', color: status.color }} className="uppercase">
                    ● {status.label}
                  </div>
                  {letter.tracking_number && (
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: '#bbb', marginTop: '4px' }}>
                      {letter.tracking_number}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
