'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

const MAX_CHARS = 6000
const MAX_PHOTOS = 6

const BUNDLES = [
  { id: 'single',   label: '1 Letter',   letters: 1,  price: 2.99,  note: '' },
  { id: 'bundle3',  label: '3 Letters',  letters: 3,  price: 7.99,  note: '$2.66 ea' },
  { id: 'bundle10', label: '10 Letters', letters: 10, price: 19.99, note: '$1.99 ea', popular: true },
]

export default function NewLetterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedRecruit = searchParams.get('recruit')

  const [user, setUser] = useState<any>(null)
  const [recruits, setRecruits] = useState<any[]>([])
  const [selectedRecruit, setSelectedRecruit] = useState<string>('')
  const [body, setBody] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [includeNewsletter, setIncludeNewsletter] = useState(false)
  const [selectedBundle, setSelectedBundle] = useState('single')
  const [credits, setCredits] = useState(0)
  const [step, setStep] = useState<'compose'|'preview'|'checkout'>('compose')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/auth/login'; return }
      setUser(session.user)
      const [{ data: r }, { data: p }] = await Promise.all([
        supabase.from('recruits').select('*').eq('owner_id', session.user.id).order('created_at', { ascending: false }),
        supabase.from('profiles').select('letter_credits').eq('id', session.user.id).single(),
      ])
      setRecruits(r ?? [])
      setCredits(p?.letter_credits ?? 0)
      if (preselectedRecruit) setSelectedRecruit(preselectedRecruit)
      else if (r && r.length === 1) setSelectedRecruit(r[0].id)
    }
    load()
  }, [preselectedRecruit])

  function handlePhotoAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    const toAdd = files.slice(0, MAX_PHOTOS - photos.length)
    setPhotos(prev => [...prev, ...toAdd])
    toAdd.forEach(file => {
      const reader = new FileReader()
      reader.onload = ev => setPhotoPreviews(prev => [...prev, ev.target?.result as string])
      reader.readAsDataURL(file)
    })
    if (fileRef.current) fileRef.current.value = ''
  }

  function removePhoto(i: number) {
    setPhotos(prev => prev.filter((_, idx) => idx !== i))
    setPhotoPreviews(prev => prev.filter((_, idx) => idx !== i))
  }

  const recruit = recruits.find(r => r.id === selectedRecruit)
  const charsLeft = MAX_CHARS - body.length
  const canPreview = body.trim().length > 10 && selectedRecruit

  async function handleSendWithCredits() {
    if (credits < 1) { setError('No letter credits. Purchase a bundle below.'); return }
    setSaving(true)
    setError('')

    try {
      const supabase = createClient()

      // Upload photos — get fresh session to ensure auth
      const photoUrls: string[] = []
      if (photos.length > 0) {
        setUploadingPhotos(true)
        const { data: { session: freshSession } } = await supabase.auth.getSession()
        if (!freshSession) throw new Error('Session expired — please refresh and try again')
        
        for (const photo of photos) {
          const ext = photo.name.split('.').pop() ?? 'jpg'
          const path = freshSession.user.id + '/' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.' + ext
          console.log('Uploading photo to:', path, 'size:', photo.size, 'type:', photo.type)
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('letter-photos')
            .upload(path, photo, { contentType: photo.type, upsert: false })
          
          if (uploadError) {
            console.error('Photo upload error:', uploadError)
            throw new Error('Photo upload failed: ' + uploadError.message)
          }
          
          console.log('Photo uploaded:', uploadData?.path)
          const { data: { publicUrl } } = supabase.storage.from('letter-photos').getPublicUrl(path)
          console.log('Public URL:', publicUrl)
          photoUrls.push(publicUrl)
        }
        setUploadingPhotos(false)
        console.log('All photos uploaded:', photoUrls)
      }

      // Insert letter
      const { data: letter, error: letterError } = await supabase
        .from('letters')
        .insert({
          sender_id: user.id,
          recruit_id: selectedRecruit,
          body: body.trim(),
          photo_urls: photoUrls,
          include_newsletter: includeNewsletter,
          status: 'paid',
          price_paid: 0,
          submitted_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (letterError) throw letterError

      // Deduct credit directly — more reliable than RPC
      const { error: creditError } = await supabase
        .from('profiles')
        .update({ letter_credits: credits - 1 })
        .eq('id', user.id)

      if (creditError) console.error('Credit deduction error:', creditError)

      // Save order record
      await supabase.from('orders').insert({
        profile_id: user.id,
        order_type: 'letters',
        amount_total: 0,
        status: 'paid',
        letter_ids: [letter.id],
        paid_at: new Date().toISOString(),
        line_items: [{ name: 'Letter (credit)', quantity: 1, unit_price: 0, total: 0 }],
      })

      window.location.href = '/dashboard/letters?sent=1'
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong')
      setSaving(false)
      setUploadingPhotos(false)
    }
  }

  async function handleBuyBundle() {
    setSaving(true)
    setError('')
    try {
      const supabase = createClient()
      const { data: draft } = await supabase
        .from('letters')
        .insert({
          sender_id: user.id,
          recruit_id: selectedRecruit,
          body: body.trim(),
          photo_urls: [],
          include_newsletter: includeNewsletter,
          status: 'draft',
        })
        .select()
        .single()

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bundle: selectedBundle, letterId: draft?.id, recruitId: selectedRecruit }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error ?? 'Checkout failed')
        setSaving(false)
      }
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong')
      setSaving(false)
    }
  }

  const inp = { background: '#ffffff', border: '1px solid #c8b89a', color: '#1a1a16', width: '100%', padding: '12px 16px', fontSize: '14px', outline: 'none' }
  const lbl = { fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '3px', color: '#6b7560', display: 'block', textTransform: 'uppercase' as const, marginBottom: '8px' }

  // PREVIEW
  if (step === 'preview') {
    return (
      <div className="max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <button onClick={() => setStep('compose')}
            style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px', color: '#6b7560', background: 'none', border: 'none', cursor: 'pointer' }}
            className="uppercase">← Edit Letter</button>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '3px', color: '#4a5240' }} className="uppercase">Print Preview</div>
        </div>
        <div style={{ background: '#ffffff', padding: '48px', boxShadow: '0 4px 40px rgba(0,0,0,0.12)', border: '1px solid #e8ddd0', marginBottom: '24px' }}>
          <div style={{ borderBottom: '2px solid #1a1a16', paddingBottom: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', letterSpacing: '4px', color: '#1a1a16' }}>
              BOOT<span style={{ color: '#d4a017' }}>MAIL</span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '2px', color: '#999', textAlign: 'right' }}>
              <div>{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
              {recruit && <div className="mt-1" style={{ color: '#4a5240' }}>TO: {recruit.full_name.toUpperCase()}</div>}
              {recruit?.address_line1 && <div style={{ color: '#999' }}>{recruit.address_line1}</div>}
              {recruit?.city && <div style={{ color: '#999' }}>{recruit.city}{recruit.state ? ', ' + recruit.state : ''} {recruit.zip}</div>}
            </div>
          </div>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: '14px', lineHeight: '1.8', color: '#1a1a16', whiteSpace: 'pre-wrap', minHeight: '200px' }}>
            {body}
          </div>
          {photoPreviews.length > 0 && (
            <div style={{ marginTop: '32px', borderTop: '1px solid #e8ddd0', paddingTop: '24px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '2px', color: '#999', marginBottom: '12px' }} className="uppercase">Photos ({photoPreviews.length})</div>
              <div className="grid grid-cols-3 gap-2">
                {photoPreviews.map((src, i) => (
                  <img key={i} src={src} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }} />
                ))}
              </div>
            </div>
          )}
          <div style={{ marginTop: '32px', borderTop: '1px solid #e8ddd0', paddingTop: '16px', fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '2px', color: '#bbb', textAlign: 'center' }} className="uppercase">
            Sent with BootMail · bootmail.app · More Than Mail. It&apos;s Morale.
          </div>
        </div>
        <button onClick={() => setStep('checkout')}
          style={{ background: '#d4a017', fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '3px', width: '100%', padding: '18px', border: 'none', cursor: 'pointer' }}
          className="text-black uppercase hover:opacity-90">
          Looks Good — Send This Letter →
        </button>
      </div>
    )
  }

  // CHECKOUT
  if (step === 'checkout') {
    return (
      <div className="max-w-lg">
        <div className="mb-8">
          <button onClick={() => setStep('preview')}
            style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px', color: '#6b7560', background: 'none', border: 'none', cursor: 'pointer' }}
            className="uppercase mb-4 block">← Back to Preview</button>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '40px', letterSpacing: '3px', color: '#1a1a16' }}>Send Letter</h1>
          {recruit && (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#6b7560', fontStyle: 'italic', marginTop: '8px' }}>
              To: {recruit.full_name} · {recruit.city}{recruit.state ? ', ' + recruit.state : ''}
            </p>
          )}
        </div>

        {credits > 0 && (
          <div style={{ background: '#ffffff', padding: '24px', marginBottom: '4px', borderTop: '4px solid #4a5240' }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', letterSpacing: '2px', color: '#1a1a16' }}>Use a Letter Credit</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#6b7560' }} className="uppercase tracking-wider mt-1">
                  You have {credits} credit{credits !== 1 ? 's' : ''} remaining
                </div>
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: '#d4a017' }}>{credits}</div>
            </div>
            {error && <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#e74c3c', marginBottom: '12px' }}>{error}</p>}
            <button onClick={handleSendWithCredits} disabled={saving}
              style={{ background: '#4a5240', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '3px', width: '100%', padding: '14px', border: 'none', cursor: 'pointer' }}
              className="text-white uppercase hover:opacity-90 disabled:opacity-50">
              {saving ? (uploadingPhotos ? 'Uploading Photos...' : 'Sending...') : 'Send Now (1 Credit) →'}
            </button>
          </div>
        )}

        <div style={{ background: '#ffffff', padding: '24px', borderTop: '4px solid #e8ddd0' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '3px', color: '#6b7560' }} className="uppercase mb-4">
            {credits > 0 ? 'Or Buy a Bundle' : 'Buy a Bundle'}
          </div>
          <div className="space-y-2 mb-4">
            {BUNDLES.map(b => (
              <button key={b.id} type="button" onClick={() => setSelectedBundle(b.id)}
                style={{
                  width: '100%', padding: '16px 20px', textAlign: 'left', cursor: 'pointer',
                  border: selectedBundle === b.id ? '2px solid #4a5240' : '1px solid #c8b89a',
                  background: selectedBundle === b.id ? '#f8f5f0' : '#ffffff',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                <div className="flex items-center gap-3">
                  {b.popular && <span style={{ background: '#d4a017', fontFamily: 'var(--font-mono)', fontSize: '8px', letterSpacing: '2px', color: '#000', padding: '2px 8px' }} className="uppercase">Best Value</span>}
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '18px', letterSpacing: '1px', color: '#1a1a16' }}>{b.label}</span>
                  {b.note && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#6b7560' }}>{b.note}</span>}
                </div>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: selectedBundle === b.id ? '#4a5240' : '#1a1a16' }}>${b.price}</span>
              </button>
            ))}
          </div>
          {error && <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#e74c3c', marginBottom: '12px' }}>{error}</p>}
          <button onClick={handleBuyBundle} disabled={saving}
            style={{ background: '#d4a017', fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '3px', width: '100%', padding: '16px', border: 'none', cursor: 'pointer' }}
            className="text-black uppercase hover:opacity-90 disabled:opacity-50">
            {saving ? 'Redirecting to Checkout...' : 'Buy Bundle & Send →'}
          </button>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '1px', color: '#bbb', textAlign: 'center', marginTop: '12px' }} className="uppercase">
            Secure checkout via Stripe · Credits never expire
          </p>
        </div>
      </div>
    )
  }

  // COMPOSE
  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <Link href="/dashboard" style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px', color: '#6b7560' }} className="uppercase">← Dashboard</Link>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '48px', letterSpacing: '3px', color: '#1a1a16' }} className="mt-4">Write a Letter</h1>
        <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', color: '#6b7560', fontSize: '14px' }} className="mt-2">
          We print it, seal it, and mail it via USPS — same day if submitted before 2 PM ET.
        </p>
      </div>

      <div className="space-y-4">
        {recruits.length > 1 && (
          <div style={{ background: '#ffffff', padding: '24px' }}>
            <label style={lbl}>Send To</label>
            <div className="space-y-2">
              {recruits.map(r => (
                <button key={r.id} type="button" onClick={() => setSelectedRecruit(r.id)}
                  style={{ padding: '14px 16px', textAlign: 'left', cursor: 'pointer', width: '100%', border: selectedRecruit === r.id ? '2px solid #4a5240' : '1px solid #c8b89a', background: selectedRecruit === r.id ? '#f8f5f0' : '#ffffff' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '18px', letterSpacing: '1px', color: '#1a1a16' }}>{r.full_name}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#6b7560', marginLeft: '12px' }} className="uppercase">{r.branch}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {recruits.length === 0 && (
          <div style={{ background: '#fffbf0', border: '1px solid rgba(212,160,23,0.3)', padding: '20px' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#d4a017' }} className="uppercase tracking-wider">
              No recruits added yet. <Link href="/dashboard/recruits/new" className="underline">Add your recruit first →</Link>
            </p>
          </div>
        )}

        <div style={{ background: '#ffffff', padding: '24px' }}>
          <div className="flex justify-between items-center mb-2">
            <label style={lbl}>Your Letter</label>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: charsLeft < 500 ? '#e74c3c' : '#6b7560' }}>{charsLeft.toLocaleString()} chars left</span>
          </div>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value.slice(0, MAX_CHARS))}
            placeholder={'Dear ' + (recruit?.full_name?.split(' ')[0] ?? '[Name]') + ',\n\nWe are so proud of you...'}
            rows={14}
            style={{ background: '#fafaf8', border: '1px solid #e8ddd0', color: '#1a1a16', width: '100%', padding: '16px', fontSize: '15px', lineHeight: '1.7', outline: 'none', resize: 'vertical', fontFamily: 'Georgia, serif' }}
          />
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: '#bbb', marginTop: '8px' }} className="uppercase tracking-wider">
            Up to 6,000 characters · Printed on quality paper and mailed via USPS
          </p>
        </div>

        <div style={{ background: '#ffffff', padding: '24px' }}>
          <div className="flex justify-between items-center mb-3">
            <label style={lbl}>Photos (optional)</label>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#6b7560' }}>{photos.length}/{MAX_PHOTOS}</span>
          </div>
          {photoPreviews.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-3">
              {photoPreviews.map((src, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <img src={src} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }} />
                  <button type="button" onClick={() => removePhoto(i)}
                    style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          {photos.length < MAX_PHOTOS && (
            <>
              <input ref={fileRef} type="file" accept="image/*" multiple onChange={handlePhotoAdd} style={{ display: 'none' }} />
              <button type="button" onClick={() => fileRef.current?.click()}
                style={{ border: '2px dashed #c8b89a', background: 'transparent', width: '100%', padding: '20px', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '2px', color: '#6b7560' }}
                className="uppercase hover:border-olive transition-colors">
                + Add Photos ({MAX_PHOTOS - photos.length} remaining)
              </button>
            </>
          )}
        </div>

        <div style={{ background: '#ffffff', padding: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <input type="checkbox" checked={includeNewsletter} onChange={e => setIncludeNewsletter(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: '#4a5240' }} />
            <div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '2px', color: '#1a1a16' }} className="uppercase">Include Weekly Newsletter</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#d4a017', marginLeft: '8px' }}>+$0.99</span>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: '#6b7560', fontStyle: 'italic', marginTop: '2px' }}>
                Printed 2-page military news digest, mailed with your letter.
              </p>
            </div>
          </label>
        </div>

        <button onClick={() => setStep('preview')} disabled={!canPreview}
          style={{ background: canPreview ? '#d4a017' : '#e8ddd0', fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '3px', width: '100%', padding: '18px', border: 'none', cursor: canPreview ? 'pointer' : 'not-allowed', transition: 'background 0.2s' }}
          className="uppercase">
          Preview Letter →
        </button>
      </div>
    </div>
  )
}
