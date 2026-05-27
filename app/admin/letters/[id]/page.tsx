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
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState<any>(null)
  const [sendError, setSendError] = useState('')

  async function loadLetter() {
    const supabase = createClient()
    const { data } = await supabase
      .from('letters')
      .select('*, recruits(*), profiles(email, full_name)')
      .eq('id', letterId)
      .single()
    setLetter(data)
    setLoading(false)
  }

  useEffect(() => { loadLetter() }, [letterId])

  async function updateStatus(status: string) {
    setUpdating(true)
    const supabase = createClient()
    const update: any = { status }
    if (status === 'printed') update.printed_at = new Date().toISOString()
    if (status === 'mailed') update.mailed_at = new Date().toISOString()
    if (status === 'delivered') update.delivered_at = new Date().toISOString()
    await supabase.from('letters').update(update).eq('id', letterId)
    await loadLetter()
    setUpdating(false)
  }

  async function handleSendToLob() {
    setSending(true)
    setSendError('')
    setSendResult(null)

    try {
      const res = await fetch('/api/lob/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ letterId }),
      })
      const data = await res.json()

      if (!res.ok) {
        setSendError(data.error ?? 'Failed to send to Lob')
      } else {
        setSendResult(data)
        await loadLetter()
      }
    } catch (err: any) {
      setSendError(err.message)
    }
    setSending(false)
  }

  if (loading) return <div style={{ color: '#6b7560', fontFamily: 'var(--font-mono)', fontSize: '11px' }} className="uppercase tracking-widest">Loading...</div>
  if (!letter) return <div style={{ color: '#c0392b', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>Letter not found</div>

  const recruit = letter.recruits
  const profile = letter.profiles
  const hasAddress = recruit?.address_line1 && recruit?.city && recruit?.state && recruit?.zip
  const canSendToLob = ['paid', 'processing'].includes(letter.status) && hasAddress

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: fixed; left: 0; top: 0; width: 100%; padding: 0.5in; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="no-print">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/admin/letters"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px', color: '#6b7560' }}
            className="uppercase hover:text-white transition-colors">
            ← All Letters
          </Link>
          <button onClick={() => window.print()}
            style={{ background: 'rgba(255,255,255,0.05)', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '3px', border: 'none', cursor: 'pointer', padding: '10px 24px', color: '#ffffff' }}
            className="uppercase hover:opacity-90">
            🖨 Print
          </button>
        </div>

        {/* Send to Lob banner */}
        {canSendToLob && !sendResult && (
          <div style={{ background: 'rgba(212,160,23,0.1)', border: '1px solid rgba(212,160,23,0.3)', padding: '20px 24px', marginBottom: '24px' }}
            className="flex items-center justify-between gap-4">
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '2px', color: '#d4a017' }} className="uppercase mb-1">
                Ready to Mail
              </div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#c8b89a', fontStyle: 'italic' }}>
                Click to send to Lob — they print and mail via USPS First Class automatically.
              </p>
            </div>
            <button onClick={handleSendToLob} disabled={sending}
              style={{ background: '#d4a017', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '3px', border: 'none', cursor: 'pointer', padding: '14px 28px', color: '#000', whiteSpace: 'nowrap', flexShrink: 0 }}
              className="uppercase hover:opacity-90 disabled:opacity-50">
              {sending ? 'Sending to Lob...' : '📬 Send to Lob →'}
            </button>
          </div>
        )}

        {/* Success banner */}
        {sendResult && (
          <div style={{ background: 'rgba(39,174,96,0.1)', border: '1px solid rgba(39,174,96,0.3)', padding: '20px 24px', marginBottom: '24px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '2px', color: '#27ae60' }} className="uppercase mb-2">
              ✓ Sent to Lob — Letter is in the mail!
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#6b7560' }}>
              <div>Lob ID: {sendResult.lobId}</div>
              {sendResult.tracking && <div>Tracking: {sendResult.tracking}</div>}
              {sendResult.expectedDelivery && <div>Expected Delivery: {new Date(sendResult.expectedDelivery).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>}
            </div>
          </div>
        )}

        {/* Error banner */}
        {sendError && (
          <div style={{ background: 'rgba(192,57,43,0.1)', border: '1px solid rgba(192,57,43,0.3)', padding: '16px 24px', marginBottom: '24px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#e74c3c' }} className="uppercase mb-1">Error</div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#e74c3c' }}>{sendError}</p>
          </div>
        )}

        {/* No address warning */}
        {!hasAddress && ['paid', 'processing'].includes(letter.status) && (
          <div style={{ background: 'rgba(192,57,43,0.1)', border: '1px solid rgba(192,57,43,0.3)', padding: '16px 24px', marginBottom: '24px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#e74c3c' }} className="uppercase mb-1">⚠ Missing Address</div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#e74c3c' }}>
              Recruit address is incomplete.{' '}
              <Link href={'/dashboard/recruits/' + recruit?.id + '/edit'} className="underline">Update recruit record →</Link>
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            {/* Status */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '24px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '3px', color: '#4a5240' }} className="uppercase mb-3">Status</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', letterSpacing: '2px', color: letter.status === 'paid' ? '#c0392b' : letter.status === 'delivered' ? '#27ae60' : '#d4a017' }}>
                {letter.status.toUpperCase()}
              </div>
              {letter.submitted_at && (
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#4a5240', marginTop: '8px' }} className="uppercase">
                  Submitted: {new Date(letter.submitted_at).toLocaleString()}
                </div>
              )}
              {letter.lob_letter_id && (
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#d4a017', marginTop: '6px' }}>
                  Lob: {letter.lob_letter_id}
                </div>
              )}
              {letter.tracking_number && (
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#27ae60', marginTop: '4px' }}>
                  Tracking: {letter.tracking_number}
                </div>
              )}
            </div>

            {/* Manual pipeline */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '24px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '3px', color: '#4a5240' }} className="uppercase mb-3">
                Manual Pipeline
              </div>
              <div className="space-y-2">
                {[
                  { status: 'processing', label: 'Mark Processing', color: '#e67e22', show: letter.status === 'paid' },
                  { status: 'printed',    label: 'Mark Printed',    color: '#2980b9', show: ['paid','processing'].includes(letter.status) },
                  { status: 'mailed',     label: 'Mark Mailed',     color: '#8e44ad', show: ['paid','processing','printed'].includes(letter.status) },
                  { status: 'delivered',  label: 'Mark Delivered',  color: '#27ae60', show: letter.status === 'mailed' },
                ].filter(b => b.show).map(b => (
                  <button key={b.status} onClick={() => updateStatus(b.status)} disabled={updating}
                    style={{ background: b.color, fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '2px', width: '100%', padding: '10px', border: 'none', cursor: 'pointer', color: '#fff' }}
                    className="uppercase hover:opacity-90 disabled:opacity-50">
                    {updating ? '...' : b.label}
                  </button>
                ))}
                {letter.status === 'delivered' && (
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#27ae60', textAlign: 'center', padding: '10px' }} className="uppercase">✓ Delivered</div>
                )}
              </div>
            </div>

            {/* Ship To */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '24px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '3px', color: '#4a5240' }} className="uppercase mb-3">Ship To</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#ffffff', lineHeight: '1.8' }}>
                <div style={{ fontWeight: 'bold' }}>{recruit?.full_name}</div>
                {recruit?.address_line1 && <div>{recruit.address_line1}</div>}
                {recruit?.address_line2 && <div>{recruit.address_line2}</div>}
                {recruit?.city && <div>{recruit.city}{recruit.state ? ', ' + recruit.state : ''} {recruit.zip}</div>}
                <div style={{ color: '#4a5240', marginTop: '6px', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '2px' }}>{recruit?.branch}</div>
              </div>
            </div>

            {/* From */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '24px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '3px', color: '#4a5240' }} className="uppercase mb-3">From</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#ffffff', lineHeight: '1.8' }}>
                <div>{profile?.full_name}</div>
                <div style={{ color: '#4a5240' }}>{profile?.email}</div>
              </div>
            </div>
          </div>

          {/* Letter preview */}
          <div className="lg:col-span-2">
            <div style={{ background: '#ffffff', padding: '40px', boxShadow: '0 4px 40px rgba(0,0,0,0.4)' }}>
              <LetterContent letter={letter} recruit={recruit} />
            </div>
          </div>
        </div>
      </div>

      {/* Print area */}
      <div id="print-area" style={{ display: 'none' }}>
        <style>{`@media print { #print-area { display: block !important; } }`}</style>
        <LetterContent letter={letter} recruit={recruit} />
      </div>
    </>
  )
}

function LetterContent({ letter, recruit }: { letter: any, recruit: any }) {
  return (
    <div style={{ fontFamily: 'Georgia, serif', color: '#1a1a16' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #1a1a16', paddingBottom: '16px', marginBottom: '28px' }}>
        <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '22px', fontWeight: '900', letterSpacing: '4px', color: '#1a1a16' }}>
          BOOT<span style={{ color: '#d4a017' }}>MAIL</span>
        </div>
        <div style={{ fontFamily: 'Courier, monospace', fontSize: '11px', color: '#555', textAlign: 'right', lineHeight: '1.6' }}>
          {new Date(letter.submitted_at ?? letter.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </div>
      </div>
      <div style={{ marginBottom: '28px', fontFamily: 'Courier, monospace', fontSize: '12px', lineHeight: '1.7', color: '#1a1a16' }}>
        <strong>{recruit?.full_name}</strong><br />
        {recruit?.address_line1 && <>{recruit.address_line1}<br /></>}
        {recruit?.address_line2 && <>{recruit.address_line2}<br /></>}
        {recruit?.city && <>{recruit.city}{recruit.state ? ', ' + recruit.state : ''} {recruit.zip}<br /></>}
      </div>
      <div style={{ fontSize: '13px', lineHeight: '1.9', color: '#1a1a16', whiteSpace: 'pre-wrap', marginBottom: '32px', minHeight: '200px' }}>
        {letter.body}
      </div>
      {letter.photo_urls?.length > 0 && (
        <div style={{ borderTop: '1px solid #e8ddd0', paddingTop: '20px', marginBottom: '24px' }}>
          <div style={{ fontFamily: 'Courier, monospace', fontSize: '10px', letterSpacing: '2px', color: '#999', marginBottom: '12px', textTransform: 'uppercase' }}>
            Photos ({letter.photo_urls.length})
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {letter.photo_urls.map((url: string, i: number) => (
              <img key={i} src={url} alt={'Photo ' + (i + 1)} style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover', display: 'block' }} crossOrigin="anonymous" />
            ))}
          </div>
        </div>
      )}
      <div style={{ borderTop: '1px solid #e8ddd0', paddingTop: '14px', fontFamily: 'Courier, monospace', fontSize: '9px', letterSpacing: '2px', color: '#bbb', textAlign: 'center', textTransform: 'uppercase' }}>
        Sent with BootMail &middot; bootmail.app &middot; More Than Mail. It&apos;s Morale.
      </div>
    </div>
  )
}
