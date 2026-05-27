'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const BRANCHES = [
  { id: 'army',       label: '🪖 Army' },
  { id: 'marines',    label: '🦅 Marine Corps' },
  { id: 'navy',       label: '⚓ Navy' },
  { id: 'airforce',   label: '✈️ Air Force' },
  { id: 'coastguard', label: '🚢 Coast Guard' },
  { id: 'spaceforce', label: '🚀 Space Force' },
]

const STATUSES = [
  { id: 'pre-training', label: 'Pre-Training' },
  { id: 'training',     label: 'Basic Training' },
  { id: 'ait',          label: 'AIT / Tech School' },
  { id: 'active',       label: 'Active Duty' },
  { id: 'deployed',     label: 'Deployed' },
  { id: 'separated',    label: 'Separated' },
]

type Step = 'search' | 'results' | 'add'

export default function NewRecruitPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('search')
  const [searchName, setSearchName] = useState('')
  const [searchBranch, setSearchBranch] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [myRecruitIds, setMyRecruitIds] = useState<string[]>([])
  const [mySquadIds, setMySquadIds] = useState<string[]>([])
  const [joining, setJoining] = useState<string>('')
  const [joined, setJoined] = useState<string>('')
  const [joinError, setJoinError] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    full_name: '', branch: '', status: 'training',
    ship_date: '', grad_date: '', training_base: '',
    address_line1: '', address_line2: '', city: '', state: '', zip: '',
    company: '', platoon: '',
  })

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!searchName.trim()) return
    setSearching(true)
    setSearchResults([])
    setJoinError('')

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/auth/login'; return }

      // Use API route — bypasses RLS issues with client queries
      const params = new URLSearchParams({ name: searchName.trim() })
      if (searchBranch) params.set('branch', searchBranch)

      const [searchRes, myRecruitsRes, mySquadRes] = await Promise.all([
        fetch('/api/recruits/search?' + params.toString()),
        supabase.from('recruits').select('id').eq('owner_id', session.user.id),
        supabase.from('squad_members').select('recruit_id').eq('profile_id', session.user.id),
      ])

      const { results } = await searchRes.json()
      setSearchResults(results ?? [])
      setMyRecruitIds(myRecruitsRes.data?.map((r: any) => r.id) ?? [])
      setMySquadIds(mySquadRes.data?.map((s: any) => s.recruit_id) ?? [])
    } catch (err) {
      console.error('Search failed:', err)
    }

    setSearching(false)
    setStep('results')
  }

  function isOwner(recruit: any) { return myRecruitIds.includes(recruit.id) }
  function isSquad(recruit: any) { return mySquadIds.includes(recruit.id) || joined === recruit.id }

  async function handleJoinSquad(recruitId: string) {
    setJoining(recruitId)
    setJoinError('')
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { error: joinErr } = await supabase
      .from('squad_members')
      .insert({ recruit_id: recruitId, profile_id: session.user.id, role: 'member' })

    if (joinErr) {
      setJoinError(joinErr.code === '23505' ? 'Already in this squad.' : joinErr.message)
    } else {
      setJoined(recruitId)
      setMySquadIds(prev => [...prev, recruitId])
    }
    setJoining('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { window.location.href = '/auth/login'; return }

    const { error: dbError } = await supabase.from('recruits').insert({
      owner_id: session.user.id,
      full_name: form.full_name,
      branch: form.branch,
      status: form.status,
      ship_date: form.ship_date || null,
      grad_date: form.grad_date || null,
      training_base: form.training_base || null,
      address_line1: form.address_line1 || null,
      address_line2: form.address_line2 || null,
      city: form.city || null,
      state: form.state || null,
      zip: form.zip || null,
      company: form.company || null,
      platoon: form.platoon || null,
    })
    if (dbError) { setError(dbError.message); setSaving(false) }
    else { router.push('/dashboard') }
  }

  const inp = { background: '#ffffff', border: '1px solid #c8b89a', color: '#1a1a16', width: '100%', padding: '12px 16px', fontSize: '14px', outline: 'none' }
  const lbl = { fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '3px', color: '#6b7560', display: 'block', textTransform: 'uppercase' as const, marginBottom: '8px' }
  const sec = { fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '4px', color: '#4a5240', textTransform: 'uppercase' as const, marginBottom: '24px', paddingBottom: '12px', borderBottom: '1px solid #e8ddd0' }

  // ADD FORM
  if (step === 'add') {
    return (
      <div className="max-w-2xl">
        <div className="mb-8">
          <button onClick={() => setStep(searchResults.length > 0 ? 'results' : 'search')}
            style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px', color: '#6b7560', background: 'none', border: 'none', cursor: 'pointer' }}
            className="uppercase mb-4 block">← Back</button>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '48px', letterSpacing: '3px', color: '#1a1a16' }}>Add Recruit</h1>
          <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', color: '#6b7560', fontSize: '14px' }} className="mt-2">Fill in their details. Address can be added later.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div style={{ background: '#ffffff', padding: '28px' }}>
            <div style={sec}>Basic Info</div>
            <div className="space-y-4">
              <div><label style={lbl}>Full Name *</label>
                <input required value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="Jordan Miller" style={inp} /></div>
              <div><label style={lbl}>Branch *</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {BRANCHES.map(b => (
                    <button key={b.id} type="button" onClick={() => set('branch', b.id)}
                      style={{ border: form.branch === b.id ? '2px solid #4a5240' : '1px solid #c8b89a', background: form.branch === b.id ? '#4a5240' : '#fff', color: form.branch === b.id ? '#fff' : '#4a5240', fontFamily: 'var(--font-mono)', fontSize: '10px', padding: '10px 8px', cursor: 'pointer' }}>
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
              <div><label style={lbl}>Status</label>
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
              <div><label style={lbl}>Address Line 1</label><input value={form.address_line1} onChange={e => set('address_line1', e.target.value)} placeholder="PVT Miller, B Co, 2-47 INF..." style={inp} /></div>
              <div><label style={lbl}>Address Line 2</label><input value={form.address_line2} onChange={e => set('address_line2', e.target.value)} placeholder="Unit / Platoon" style={inp} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label style={lbl}>City</label><input value={form.city} onChange={e => set('city', e.target.value)} placeholder="Fort Moore" style={inp} /></div>
                <div><label style={lbl}>State</label><input value={form.state} onChange={e => set('state', e.target.value)} placeholder="GA" maxLength={2} style={inp} /></div>
              </div>
              <div><label style={lbl}>ZIP</label><input value={form.zip} onChange={e => set('zip', e.target.value)} placeholder="31905" style={{ ...inp, maxWidth: '160px' }} /></div>
            </div>
          </div>
          <div style={{ background: '#ffffff', padding: '28px' }}>
            <div style={sec}>Unit Info (optional)</div>
            <div className="grid grid-cols-2 gap-4">
              <div><label style={lbl}>Company</label><input value={form.company} onChange={e => set('company', e.target.value)} placeholder="Alpha Company" style={inp} /></div>
              <div><label style={lbl}>Platoon</label><input value={form.platoon} onChange={e => set('platoon', e.target.value)} placeholder="1st Platoon" style={inp} /></div>
            </div>
          </div>
          {error && <div style={{ background: 'rgba(192,57,43,0.1)', border: '1px solid rgba(192,57,43,0.3)', padding: '12px 16px' }}><p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#e74c3c' }}>{error}</p></div>}
          <div className="flex gap-3">
            <button type="submit" disabled={saving || !form.full_name || !form.branch}
              style={{ background: '#d4a017', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '3px', flex: 1, border: 'none', cursor: 'pointer', padding: '16px' }}
              className="text-black uppercase hover:opacity-90 disabled:opacity-40">
              {saving ? 'Saving...' : 'Add Recruit →'}
            </button>
            <Link href="/dashboard" style={{ background: '#fff', border: '1px solid #c8b89a', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '3px', color: '#6b7560', padding: '16px 24px', display: 'inline-block' }} className="uppercase">Cancel</Link>
          </div>
        </form>
      </div>
    )
  }

  // RESULTS
  if (step === 'results') {
    return (
      <div className="max-w-2xl">
        <div className="mb-8">
          <button onClick={() => { setStep('search'); setSearchResults([]) }}
            style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px', color: '#6b7560', background: 'none', border: 'none', cursor: 'pointer' }}
            className="uppercase mb-4 block">← Search Again</button>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '48px', letterSpacing: '3px', color: '#1a1a16' }}>
            {searchResults.length > 0 ? searchResults.length + ' Result' + (searchResults.length > 1 ? 's' : '') : 'No Results'}
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', color: '#6b7560', fontSize: '14px' }} className="mt-2">
            Searching for &ldquo;{searchName}&rdquo;{searchBranch ? ' · ' + searchBranch : ''}
          </p>
        </div>

        {searchResults.length > 0 && (
          <div className="space-y-0.5 mb-6">
            {searchResults.map(recruit => (
              <div key={recruit.id}
                style={{ background: '#ffffff', padding: '20px 24px', borderLeft: isOwner(recruit) ? '4px solid #d4a017' : isSquad(recruit) ? '4px solid #4a5240' : '4px solid #e8ddd0', border: '1px solid #e8ddd0' }}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', letterSpacing: '2px', color: '#1a1a16' }}>{recruit.full_name}</div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span style={{ background: '#4a5240', fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '2px', color: '#fff', padding: '2px 8px' }} className="uppercase">{recruit.branch}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#6b7560' }} className="uppercase">{recruit.status}</span>
                      {isOwner(recruit) && <span style={{ background: 'rgba(212,160,23,0.15)', fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '2px', color: '#d4a017', padding: '2px 8px' }} className="uppercase">Your Recruit</span>}
                      {isSquad(recruit) && !isOwner(recruit) && <span style={{ background: 'rgba(74,82,64,0.1)', fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '2px', color: '#4a5240', padding: '2px 8px' }} className="uppercase">✓ In Your Squad</span>}
                    </div>
                    {(recruit.city || recruit.training_base) && (
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#999', fontStyle: 'italic', marginTop: '6px' }}>
                        {recruit.training_base ?? (recruit.city + (recruit.state ? ', ' + recruit.state : ''))}
                      </div>
                    )}
                    {recruit.ship_date && (
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#6b7560', marginTop: '4px' }} className="uppercase">
                        Shipped: {new Date(recruit.ship_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    {isOwner(recruit) ? (
                      <Link href={'/dashboard/recruits/' + recruit.id + '/edit'}
                        style={{ border: '1px solid #d4a017', fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px', color: '#d4a017', padding: '8px 16px', display: 'inline-block' }}
                        className="uppercase">Manage →</Link>
                    ) : isSquad(recruit) ? (
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#4a5240', padding: '8px 16px', border: '1px solid rgba(74,82,64,0.3)' }} className="uppercase">✓ Joined</div>
                    ) : (
                      <button onClick={() => handleJoinSquad(recruit.id)} disabled={joining === recruit.id}
                        style={{ background: '#4a5240', fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px', padding: '10px 16px', border: 'none', cursor: 'pointer', color: '#fff', whiteSpace: 'nowrap' }}
                        className="uppercase hover:opacity-90 disabled:opacity-50">
                        {joining === recruit.id ? 'Joining...' : 'Join Squad →'}
                      </button>
                    )}
                  </div>
                </div>
                {joined === recruit.id && (
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e8ddd0' }}>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#4a5240', fontStyle: 'italic', marginBottom: '12px' }}>
                      You&apos;ve joined the support squad. You can now send letters from your account.
                    </p>
                    <Link href="/dashboard" style={{ background: '#d4a017', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '3px', padding: '10px 24px', display: 'inline-block', color: '#000' }} className="uppercase hover:opacity-90">Go to Dashboard →</Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {joinError && <div style={{ background: 'rgba(192,57,43,0.1)', border: '1px solid rgba(192,57,43,0.3)', padding: '12px 16px', marginBottom: '16px' }}><p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#e74c3c' }}>{joinError}</p></div>}

        <div style={{ background: '#f8f5f0', border: '1px solid #e8ddd0', padding: '24px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', letterSpacing: '2px', color: '#1a1a16', marginBottom: '6px' }}>
            {searchResults.length === 0 ? 'Not in BootMail yet' : 'Different recruit?'}
          </div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#6b7560', fontStyle: 'italic', marginBottom: '16px' }}>
            {searchResults.length === 0 ? '"' + searchName + '" wasn\'t found. Add them as a new record.' : 'Don\'t see the right person? Add a new recruit.'}
          </p>
          <button onClick={() => { set('full_name', searchName); if (searchBranch) set('branch', searchBranch); setStep('add') }}
            style={{ background: '#d4a017', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '3px', border: 'none', cursor: 'pointer', padding: '12px 24px', color: '#000' }}
            className="uppercase hover:opacity-90">
            Add New Recruit →
          </button>
        </div>
      </div>
    )
  }

  // SEARCH
  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <Link href="/dashboard" style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px', color: '#6b7560' }} className="uppercase">← Dashboard</Link>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '48px', letterSpacing: '3px', color: '#1a1a16' }} className="mt-4">Find Your Recruit</h1>
        <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', color: '#6b7560', fontSize: '14px' }} className="mt-2">
          Search first — your recruit may already be in BootMail.
        </p>
      </div>
      <form onSubmit={handleSearch} className="space-y-4">
        <div style={{ background: '#ffffff', padding: '28px' }}>
          <div style={sec}>Search for Your Recruit</div>
          <div className="space-y-4">
            <div>
              <label style={lbl}>Recruit&apos;s Name *</label>
              <input type="text" required value={searchName} onChange={e => setSearchName(e.target.value)}
                placeholder="Jordan Miller" style={inp} autoFocus />
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: '#bbb', marginTop: '6px' }} className="uppercase tracking-wider">
                Try first name, last name, or full name
              </p>
            </div>
            <div>
              <label style={lbl}>Branch (optional)</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <button type="button" onClick={() => setSearchBranch('')}
                  style={{ border: searchBranch === '' ? '2px solid #4a5240' : '1px solid #c8b89a', background: searchBranch === '' ? '#4a5240' : '#fff', color: searchBranch === '' ? '#fff' : '#4a5240', fontFamily: 'var(--font-mono)', fontSize: '10px', padding: '10px 8px', cursor: 'pointer' }}>
                  All
                </button>
                {BRANCHES.map(b => (
                  <button key={b.id} type="button" onClick={() => setSearchBranch(b.id)}
                    style={{ border: searchBranch === b.id ? '2px solid #4a5240' : '1px solid #c8b89a', background: searchBranch === b.id ? '#4a5240' : '#fff', color: searchBranch === b.id ? '#fff' : '#4a5240', fontFamily: 'var(--font-mono)', fontSize: '10px', padding: '10px 8px', cursor: 'pointer' }}>
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        <button type="submit" disabled={searching || !searchName.trim()}
          style={{ background: searchName.trim() ? '#4a5240' : '#e8ddd0', fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '3px', width: '100%', padding: '18px', border: 'none', cursor: searchName.trim() ? 'pointer' : 'not-allowed' }}
          className="uppercase text-white hover:opacity-90 disabled:opacity-40 transition-all">
          {searching ? 'Searching...' : 'Search BootMail →'}
        </button>
        <div style={{ textAlign: 'center' }}>
          <button type="button" onClick={() => setStep('add')}
            style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px', color: '#6b7560', background: 'none', border: 'none', cursor: 'pointer' }}
            className="uppercase hover:text-olive transition-colors">
            Skip — add new recruit directly
          </button>
        </div>
      </form>
    </div>
  )
}
