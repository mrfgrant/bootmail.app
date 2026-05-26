'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const BRANCHES = [
  { id: 'army', label: '🪖 Army', base: 'Fort Moore / Fort Jackson / Fort Leonard Wood / Fort Sill' },
  { id: 'marines', label: '🦅 Marine Corps', base: 'MCRD Parris Island / MCRD San Diego' },
  { id: 'navy', label: '⚓ Navy', base: 'Recruit Training Command Great Lakes' },
  { id: 'airforce', label: '✈️ Air Force', base: 'JBSA Lackland, TX' },
  { id: 'coastguard', label: '🚢 Coast Guard', base: 'RTC Cape May, NJ' },
  { id: 'spaceforce', label: '🚀 Space Force', base: 'JBSA Lackland, TX' },
]

export default function NewRecruitPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    full_name: '', branch: '', ship_date: '', training_base: '',
    address_line1: '', address_line2: '', city: '', state: '', zip: '',
    company: '', platoon: '',
  })

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const selectedBranch = BRANCHES.find(b => b.id === form.branch)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const { data, error: dbError } = await supabase
      .from('recruits')
      .insert({
        owner_id: user.id,
        full_name: form.full_name,
        branch: form.branch,
        ship_date: form.ship_date || null,
        training_base: form.training_base || selectedBranch?.base || null,
        address_line1: form.address_line1 || null,
        address_line2: form.address_line2 || null,
        city: form.city || null,
        state: form.state || null,
        zip: form.zip || null,
        company: form.company || null,
        platoon: form.platoon || null,
        status: 'training',
      })
      .select()
      .single()

    if (dbError) {
      setError(dbError.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  const inputStyle = {
    background: '#ffffff',
    border: '1px solid #c8b89a',
    color: '#1a1a16',
    width: '100%',
    padding: '12px 16px',
    fontSize: '14px',
    outline: 'none',
  }

  const labelStyle = {
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    letterSpacing: '3px',
    color: '#6b7560',
    display: 'block',
    textTransform: 'uppercase' as const,
    marginBottom: '8px',
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <Link href="/dashboard"
          style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px', color: '#6b7560' }}
          className="uppercase hover:text-olive transition-colors">
          ← Dashboard
        </Link>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '48px', letterSpacing: '3px', color: '#1a1a16' }}
          className="mt-4">
          Add Recruit
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', color: '#6b7560', fontSize: '14px' }}
          className="mt-2">
          Enter your recruit's info. Address can be added later once you receive it.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Name + Branch */}
        <div style={{ background: '#ffffff', padding: '28px' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '4px', color: '#4a5240' }}
            className="uppercase mb-6 pb-3 border-b border-tan">
            Basic Info
          </div>

          <div className="space-y-4">
            <div>
              <label style={labelStyle}>Recruit's Full Name *</label>
              <input required value={form.full_name} onChange={e => set('full_name', e.target.value)}
                placeholder="Marcus Johnson" style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Branch *</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {BRANCHES.map(b => (
                  <button key={b.id} type="button" onClick={() => set('branch', b.id)}
                    style={{
                      border: form.branch === b.id ? '2px solid #4a5240' : '1px solid #c8b89a',
                      background: form.branch === b.id ? '#4a5240' : '#ffffff',
                      color: form.branch === b.id ? '#ffffff' : '#4a5240',
                      fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '1px',
                      padding: '10px 8px', textAlign: 'center', cursor: 'pointer',
                    }}>
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={labelStyle}>Ship Date</label>
              <input type="date" value={form.ship_date} onChange={e => set('ship_date', e.target.value)}
                style={inputStyle} />
            </div>
          </div>
        </div>

        {/* Mailing Address */}
        <div style={{ background: '#ffffff', padding: '28px' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '4px', color: '#4a5240' }}
            className="uppercase mb-2 pb-3 border-b border-tan">
            Mailing Address
          </div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: '#6b7560', fontStyle: 'italic' }}
            className="mb-6">
            You will receive this in your recruit's first letter or phone call. You can add it later.
          </p>

          <div className="space-y-4">
            <div>
              <label style={labelStyle}>Address Line 1</label>
              <input value={form.address_line1} onChange={e => set('address_line1', e.target.value)}
                placeholder="PVT Johnson, A Company, 1-34 INF..." style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Address Line 2</label>
              <input value={form.address_line2} onChange={e => set('address_line2', e.target.value)}
                placeholder="Unit / Platoon" style={inputStyle} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={labelStyle}>City</label>
                <input value={form.city} onChange={e => set('city', e.target.value)}
                  placeholder="Fort Moore" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>State</label>
                <input value={form.state} onChange={e => set('state', e.target.value)}
                  placeholder="GA" maxLength={2} style={inputStyle} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>ZIP Code</label>
              <input value={form.zip} onChange={e => set('zip', e.target.value)}
                placeholder="31905" style={{ ...inputStyle, maxWidth: '160px' }} />
            </div>
          </div>
        </div>

        {/* Unit Info */}
        <div style={{ background: '#ffffff', padding: '28px' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '4px', color: '#4a5240' }}
            className="uppercase mb-6 pb-3 border-b border-tan">
            Unit Info (optional)
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Company</label>
              <input value={form.company} onChange={e => set('company', e.target.value)}
                placeholder="Alpha Company" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Platoon</label>
              <input value={form.platoon} onChange={e => set('platoon', e.target.value)}
                placeholder="1st Platoon" style={inputStyle} />
            </div>
          </div>
        </div>

        {error && (
          <div style={{ background: 'rgba(192,57,43,0.1)', border: '1px solid rgba(192,57,43,0.3)', padding: '12px 16px' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#e74c3c' }}>{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !form.full_name || !form.branch}
          style={{ background: '#d4a017', fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '3px' }}
          className="w-full py-4 text-black uppercase hover:opacity-90 disabled:opacity-40 transition-opacity">
          {loading ? 'Saving...' : 'Save Recruit →'}
        </button>

      </form>
    </div>
  )
}
