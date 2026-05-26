'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams } from 'next/navigation'
import Link from 'next/link'

const BRANCHES = [
  { id: 'army', label: '🪖 Army' },
  { id: 'marines', label: '🦅 Marine Corps' },
  { id: 'navy', label: '⚓ Navy' },
  { id: 'airforce', label: '✈️ Air Force' },
  { id: 'coastguard', label: '🚢 Coast Guard' },
  { id: 'spaceforce', label: '🚀 Space Force' },
]

const STATUSES = [
  { id: 'pre-training', label: 'Pre-Training' },
  { id: 'training', label: 'Basic Training' },
  { id: 'ait', label: 'AIT / Tech School' },
  { id: 'active', label: 'Active Duty' },
  { id: 'deployed', label: 'Deployed' },
  { id: 'separated', label: 'Separated' },
]

export default function EditRecruitPage() {
  const params = useParams()
  const recruitId = params.id as string
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    full_name: '', branch: '', status: 'training',
    ship_date: '', grad_date: '', training_base: '',
    address_line1: '', address_line2: '', city: '', state: '', zip: '',
    company: '', platoon: '',
  })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/auth/login'; return }
      const { data } = await supabase.from('recruits').select('*').eq('id', recruitId).eq('owner_id', session.user.id).single()
      if (data) {
        setForm({
          full_name: data.full_name ?? '', branch: data.branch ?? '', status: data.status ?? 'training',
          ship_date: data.ship_date ?? '', grad_date: data.grad_date ?? '', training_base: data.training_base ?? '',
          address_line1: data.address_line1 ?? '', address_line2: data.address_line2 ?? '',
          city: data.city ?? '', state: data.state ?? '', zip: data.zip ?? '',
          company: data.company ?? '', platoon: data.platoon ?? '',
        })
      }
      setLoading(false)
    }
    load()
  }, [recruitId])

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const supabase = createClient()
    const { error: dbError } = await supabase.from('recruits').update({
      full_name: form.full_name, branch: form.branch, status: form.status,
      ship_date: form.ship_date || null, grad_date: form.grad_date || null,
      training_base: form.training_base || null,
      address_line1: form.address_line1 || null, address_line2: form.address_line2 || null,
      city: form.city || null, state: form.state || null, zip: form.zip || null,
      company: form.company || null, platoon: form.platoon || null,
    }).eq('id', recruitId)
    if (dbError) { setError(dbError.message) }
    else { setSaved(true); setTimeout(() => setSaved(false), 3000) }
    setSaving(false)
  }

  async function handleDelete() {
    if (!confirm('Delete this recruit? This cannot be undone.')) return
    const supabase = createClient()
    await supabase.from('recruits').delete().eq('id', recruitId)
    window.location.href = '/dashboard'
  }

  const inp = { background: '#ffffff', border: '1px solid #c8b89a', color: '#1a1a16', width: '100%', padding: '12px 16px', fontSize: '14px', outline: 'none' }
  const lbl = { fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '3px', color: '#6b7560', display: 'block', textTransform: 'uppercase' as const, marginBottom: '8px' }
  const sec = { fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '4px', color: '#4a5240', textTransform: 'uppercase' as const, marginBottom: '24px', paddingBottom: '12px', borderBottom: '1px solid #e8ddd0' }

  if (loading) return <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#6b7560' }} className="uppercase tracking-widest">Loading...</div>

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <Link href="/dashboard" style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px', color: '#6b7560' }} className="uppercase">← Dashboard</Link>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '48px', letterSpacing: '3px', color: '#1a1a16' }} className="mt-4">Edit Recruit</h1>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div style={{ background: '#ffffff', padding: '28px' }}>
          <div style={sec}>Basic Info</div>
          <div className="space-y-4">
            <div>
              <label style={lbl}>Full Name *</label>
              <input required value={form.full_name} onChange={e => set('full_name', e.target.value)} style={inp} />
            </div>
            <div>
              <label style={lbl}>Branch *</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {BRANCHES.map(b => (
                  <button key={b.id} type="button" onClick={() => set('branch', b.id)}
                    style={{ border: form.branch === b.id ? '2px solid #4a5240' : '1px solid #c8b89a', background: form.branch === b.id ? '#4a5240' : '#fff', color: form.branch === b.id ? '#fff' : '#4a5240', fontFamily: 'var(--font-mono)', fontSize: '10px', padding: '10px 8px', cursor: 'pointer' }}>
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={lbl}>Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)} style={{ ...inp, appearance: 'none' }}>
                {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label style={lbl}>Ship Date</label><input type="date" value={form.ship_date} onChange={e => set('ship_date', e.target.value)} style={inp} /></div>
              <div><label style={lbl}>Grad Date</label><input type="date" value={form.grad_date} onChange={e => set('grad_date', e.target.value)} style={inp} /></div>
            </div>
          </div>
        </div>

        <div style={{ background: '#ffffff', padding: '28px' }}>
          <div style={sec}>Mailing Address</div>
          <div className="space-y-4">
            <div><label style={lbl}>Address Line 1</label><input value={form.address_line1} onChange={e => set('address_line1', e.target.value)} placeholder="PVT Johnson, A Co, 1-34 INF..." style={inp} /></div>
            <div><label style={lbl}>Address Line 2</label><input value={form.address_line2} onChange={e => set('address_line2', e.target.value)} placeholder="Unit / Platoon" style={inp} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label style={lbl}>City</label><input value={form.city} onChange={e => set('city', e.target.value)} placeholder="Fort Moore" style={inp} /></div>
              <div><label style={lbl}>State</label><input value={form.state} onChange={e => set('state', e.target.value)} placeholder="GA" maxLength={2} style={inp} /></div>
            </div>
            <div><label style={lbl}>ZIP</label><input value={form.zip} onChange={e => set('zip', e.target.value)} placeholder="31905" style={{ ...inp, maxWidth: '160px' }} /></div>
          </div>
        </div>

        <div style={{ background: '#ffffff', padding: '28px' }}>
          <div style={sec}>Unit Info</div>
          <div className="grid grid-cols-2 gap-4">
            <div><label style={lbl}>Company</label><input value={form.company} onChange={e => set('company', e.target.value)} placeholder="Alpha Company" style={inp} /></div>
            <div><label style={lbl}>Platoon</label><input value={form.platoon} onChange={e => set('platoon', e.target.value)} placeholder="1st Platoon" style={inp} /></div>
          </div>
        </div>

        {error && <div style={{ background: 'rgba(192,57,43,0.1)', border: '1px solid rgba(192,57,43,0.3)', padding: '12px 16px' }}><p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#e74c3c' }}>{error}</p></div>}
        {saved && <div style={{ background: 'rgba(74,82,64,0.1)', border: '1px solid rgba(74,82,64,0.3)', padding: '12px 16px' }}><p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#4a5240' }}>✓ Saved successfully</p></div>}

        <div className="flex gap-3">
          <button type="submit" disabled={saving}
            style={{ background: '#d4a017', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '3px', flex: 1, border: 'none', cursor: 'pointer', padding: '16px' }}
            className="text-black uppercase hover:opacity-90 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Changes →'}
          </button>
          <Link href="/dashboard"
            style={{ background: '#fff', border: '1px solid #c8b89a', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '3px', color: '#6b7560', padding: '16px 24px', display: 'inline-block' }}
            className="uppercase">
            Cancel
          </Link>
        </div>

        <div style={{ borderTop: '1px solid #e8ddd0', paddingTop: '24px' }}>
          <button type="button" onClick={handleDelete}
            style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px', color: '#c0392b', background: 'none', border: '1px solid rgba(192,57,43,0.3)', cursor: 'pointer', padding: '10px 20px' }}
            className="uppercase">
            Delete Recruit
          </button>
        </div>
      </form>
    </div>
  )
}
