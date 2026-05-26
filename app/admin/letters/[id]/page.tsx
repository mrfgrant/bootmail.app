'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams } from 'next/navigation'
import Link from 'next/link'

export default function AdminLetterDetailPage() {
  const params = useParams()
  const letterId = params.id as string
  const [letter, setLetter] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('letters')
        .select('*, recruits(*), profiles(email, full_name, phone)')
        .eq('id', letterId)
        .single()
      setLetter(data)
      setLoading(false)
    }
    load()
  }, [letterId])

  async function updateStatus(status: string) {
    setUpdating(true)
    const supabase = createClient()
    const update: any = { status }
    if (status === 'printed') update.printed_at = new Date().toISOString()
    if (status === 'mailed') update.mailed_at = new Date().toISOString()
    if (status === 'delivered') update.delivered_at = new Date().toISOString()
    await supabase.from('letters').update(update).eq('id', letterId)
    const supabase2 = createClient()
    const { data } = await supabase2
      .from('letters')
      .select('*, recruits(*), profiles(email, full_name, phone)')
      .eq('id', letterId)
      .single()
    setLetter(data)
    setUpdating(false)
  }

  if (loading) return (
    <div style={{ color: '#6b7560', fontFamily: 'var(--font-mono)', fontSize: '11px' }} className="uppercase tracking-widest">Loading...</div>
  )
  if (!letter) return (
    <div style={{ color: '#c0392b', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>Letter not found</div>
  )

  const recruit = letter.recruits
  const profile = letter.profiles

  return (
    <>
      {/* Print styles — only active when printing */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area {
            position: fixed;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0.5in;
            font-family: Georgia, serif;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Admin controls — hidden on print */}
      <div className="no-print">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/admin/letters"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px', color: '#6b7560' }}
            className="uppercase hover:text-white transition-colors">
            ← All Letters
          </Link>
          <button onClick={() => window.print()}
            style={{ background: '#d4a017', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '3px', border: 'none', cursor: 'pointer', padding: '10px 24px', color: '#000' }}
            className="uppercase hover:opacity-90">
            🖨 Print Letter
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Status + pipeline */}
          <div className="space-y-4">
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '24px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '3px', color: '#4a5240' }} className="uppercase mb-3">Status</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', letterSpacing: '2px', color: letter.status === 'paid' || letter.status === 'processing' ? '#c0392b' : letter.status === 'delivered' ? '#27ae60' : '#d4a017' }}>
                {letter.status.toUpperCase()}
              </div>
              {letter.submitted_at && (
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#4a5240', marginTop: '8px' }} className="uppercase">
                  Submitted: {new Date(letter.submitted_at).toLocaleString()}
                </div>
              )}
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '24px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '3px', color: '#4a5240' }} className="uppercase mb-3">Pipeline</div>
              <div className="space-y-2">
                {[
                  { status: 'processing', label: 'Mark Processing', color: '#e67e22', show: letter.status === 'paid' },
                  { status: 'printed',    label: 'Mark Printed',    color: '#2980b9', show: ['paid','processing'].includes(letter.status) },
                  { status: 'mailed',     label: 'Mark Mailed',     color: '#8e44ad', show: ['paid','processing','printed'].includes(letter.status) },
                  { status: 'delivered',  label: 'Mark Delivered',  color: '#27ae60', show: letter.status === 'mailed' },
                ].filter(b => b.show).map(b => (
                  <button key={b.status} onClick={() => updateStatus(b.status)} disabled={updating}
                    style={{ background: b.color, fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '2px', width: '100%', padding: '12px', border: 'none', cursor: 'pointer', color: '#fff' }}
                    className="uppercase hover:opacity-90 disabled:opacity-50">
                    {updating ? '...' : b.label}
                  </button>
                ))}
                {letter.status === 'delivered' && (
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#27ae60', textAlign: 'center', padding: '12px' }} className="uppercase">✓ Delivered</div>
                )}
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '24px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '3px', color: '#4a5240' }} className="uppercase mb-3">Ship To</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#ffffff', lineHeight: '1.8' }}>
                <div style={{ fontWeight: 'bold' }}>{recruit?.full_name}</div>
                {recruit?.address_line1 && <div>{recruit.address_line1}</div>}
                {recruit?.address_line2 && <div>{recruit.address_line2}</div>}
                {recruit?.city && <div>{recruit.city}{recruit.state ? ', ' + recruit.state : ''} {recruit.zip}</div>}
                <div style={{ color: '#4a5240', marginTop: '8px', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '2px' }}>{recruit?.branch}</div>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '24px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '3px', color: '#4a5240' }} className="uppercase mb-3">From</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#ffffff', lineHeight: '1.8' }}>
                <div>{profile?.full_name}</div>
                <div style={{ color: '#4a5240' }}>{profile?.email}</div>
              </div>
            </div>
          </div>

          {/* Screen preview (right side) */}
          <div className="lg:col-span-2">
            <div style={{ background: '#ffffff', padding: '40px', boxShadow: '0 4px 40px rgba(0,0,0,0.4)' }}>
              <LetterContent letter={letter} recruit={recruit} />
            </div>
          </div>
        </div>
      </div>

      {/* Print-only area */}
      <div id="print-area" style={{ display: 'none' }}>
        <style>{`
          @media print {
            #print-area { display: block !important; }
          }
        `}</style>
        <LetterContent letter={letter} recruit={recruit} />
      </div>
    </>
  )
}

function LetterContent({ letter, recruit }: { letter: any, recruit: any }) {
  return (
    <div style={{ fontFamily: 'Georgia, serif', color: '#1a1a16' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #1a1a16', paddingBottom: '16px', marginBottom: '28px' }}>
        <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '22px', fontWeight: '900', letterSpacing: '4px', color: '#1a1a16' }}>
          BOOT<span style={{ color: '#d4a017' }}>MAIL</span>
        </div>
        <div style={{ fontFamily: 'Courier, monospace', fontSize: '11px', letterSpacing: '1px', color: '#555', textAlign: 'right', lineHeight: '1.6' }}>
          <div>{new Date(letter.submitted_at ?? letter.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
        </div>
      </div>

      {/* To address block */}
      <div style={{ marginBottom: '28px', fontFamily: 'Courier, monospace', fontSize: '12px', lineHeight: '1.7', color: '#1a1a16' }}>
        <strong>{recruit?.full_name}</strong><br />
        {recruit?.address_line1 && <>{recruit.address_line1}<br /></>}
        {recruit?.address_line2 && <>{recruit.address_line2}<br /></>}
        {recruit?.city && <>{recruit.city}{recruit.state ? ', ' + recruit.state : ''} {recruit.zip}<br /></>}
      </div>

      {/* Letter body */}
      <div style={{ fontSize: '13px', lineHeight: '1.9', color: '#1a1a16', whiteSpace: 'pre-wrap', marginBottom: '32px', minHeight: '200px' }}>
        {letter.body}
      </div>

      {/* Photos */}
      {letter.photo_urls?.length > 0 && (
        <div style={{ borderTop: '1px solid #e8ddd0', paddingTop: '20px', marginBottom: '24px' }}>
          <div style={{ fontFamily: 'Courier, monospace', fontSize: '10px', letterSpacing: '2px', color: '#999', marginBottom: '12px', textTransform: 'uppercase' }}>
            Photos ({letter.photo_urls.length})
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {letter.photo_urls.map((url: string, i: number) => (
              <img
                key={i}
                src={url}
                alt={'Photo ' + (i + 1)}
                style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover', display: 'block' }}
                crossOrigin="anonymous"
              />
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ borderTop: '1px solid #e8ddd0', paddingTop: '14px', fontFamily: 'Courier, monospace', fontSize: '9px', letterSpacing: '2px', color: '#bbb', textAlign: 'center', textTransform: 'uppercase' }}>
        Sent with BootMail &middot; bootmail.app &middot; More Than Mail. It&apos;s Morale.
      </div>
    </div>
  )
}
