'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function DashboardPage() {
  const [recruits, setRecruits] = useState<any[]>([])
  const [squadRecruits, setSquadRecruits] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const [{ data: p }, { data: r }, { data: squad }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', session.user.id).single(),
        supabase.from('recruits').select('*').eq('owner_id', session.user.id).order('created_at', { ascending: false }),
        supabase.from('squad_members').select('recruit_id, recruits(*)').eq('profile_id', session.user.id),
      ])

      setProfile(p)
      setRecruits(r ?? [])
      // Squad recruits that aren't owned by this user
      const ownedIds = new Set((r ?? []).map((rec: any) => rec.id))
      setSquadRecruits((squad ?? []).filter((s: any) => !ownedIds.has(s.recruit_id)).map((s: any) => s.recruits))
      setLoading(false)
    }
    load()
  }, [])

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'
  const allRecruits = [...recruits, ...squadRecruits]

  if (loading) return <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#6b7560' }} className="uppercase tracking-widest">Loading...</div>

  return (
    <div>
      <div className="mb-10">
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '4px', color: '#6b7560' }} className="uppercase mb-2">Welcome Back</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '48px', letterSpacing: '3px', color: '#1a1a16' }}>{firstName}.</h1>
      </div>

      {/* No recruits */}
      {allRecruits.length === 0 && (
        <div style={{ background: '#1a1a16', border: '1px solid rgba(212,160,23,0.2)' }} className="p-8 mb-8 text-center">
          <div className="text-5xl mb-4">🪖</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', letterSpacing: '3px', color: '#ffffff' }} className="mb-3">Add Your Recruit</div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#6b7560', fontStyle: 'italic' }} className="mb-6 max-w-sm mx-auto">
            Search for your recruit or add them to start sending letters.
          </p>
          <Link href="/dashboard/recruits/new"
            style={{ background: '#d4a017', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '3px' }}
            className="inline-block px-8 py-4 text-black uppercase hover:opacity-90">
            Find or Add Recruit →
          </Link>
        </div>
      )}

      {/* Recruit cards */}
      {allRecruits.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '4px', color: '#6b7560' }} className="uppercase">
              Your Recruits
            </div>
            <Link href="/dashboard/recruits/new"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px', color: '#6b7560', border: '1px solid #c8b89a', padding: '6px 14px' }}
              className="uppercase hover:border-olive hover:text-olive transition-colors">
              + Add / Find Recruit
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0.5">
            {recruits.map(r => (
              <div key={r.id} style={{ background: '#ffffff', borderTop: '4px solid #4a5240' }} className="p-6">
                <div className="flex items-start justify-between mb-1">
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', letterSpacing: '2px', color: '#1a1a16' }}>{r.full_name}</div>
                  <Link href={'/dashboard/recruits/' + r.id + '/edit'}
                    style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '2px', color: '#6b7560', border: '1px solid #e8ddd0', padding: '4px 10px' }}
                    className="uppercase hover:border-olive hover:text-olive transition-colors">
                    Edit
                  </Link>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px', color: '#6b7560' }} className="uppercase mb-1">
                  {r.branch} · {r.status}
                </div>
                {r.address_line1
                  ? <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: '#999', fontStyle: 'italic' }} className="mb-4">{r.city}{r.state ? ', ' + r.state : ''}</div>
                  : <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#d4a017' }} className="mb-4 uppercase tracking-wider">
                      ⚠ No address — <Link href={'/dashboard/recruits/' + r.id + '/edit'} className="underline">add it</Link>
                    </div>
                }
                <div className="flex gap-2">
                  <Link href={'/dashboard/letters/new?recruit=' + r.id}
                    style={{ background: '#4a5240', fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px' }}
                    className="px-4 py-2 text-white uppercase hover:opacity-80">
                    Send Letter
                  </Link>
                  <Link href={'/dashboard/packages?recruit=' + r.id}
                    style={{ border: '1px solid #c8b89a', fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px', color: '#4a5240' }}
                    className="px-4 py-2 uppercase">
                    Care Package
                  </Link>
                </div>
              </div>
            ))}

            {/* Squad recruits */}
            {squadRecruits.map((r: any) => r && (
              <div key={r.id} style={{ background: '#ffffff', borderTop: '4px solid #6b7560' }} className="p-6">
                <div className="flex items-start justify-between mb-1">
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', letterSpacing: '2px', color: '#1a1a16' }}>{r.full_name}</div>
                  <span style={{ background: 'rgba(74,82,64,0.1)', fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '2px', color: '#6b7560', padding: '4px 10px' }} className="uppercase">
                    Squad
                  </span>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px', color: '#6b7560' }} className="uppercase mb-4">
                  {r.branch} · {r.status}
                </div>
                <div className="flex gap-2">
                  <Link href={'/dashboard/letters/new?recruit=' + r.id}
                    style={{ background: '#6b7560', fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px' }}
                    className="px-4 py-2 text-white uppercase hover:opacity-80">
                    Send Letter
                  </Link>
                </div>
              </div>
            ))}

            <Link href="/dashboard/recruits/new"
              style={{ background: 'rgba(74,82,64,0.05)', border: '2px dashed #c8b89a' }}
              className="p-6 flex items-center justify-center hover:border-olive transition-colors">
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '3px', color: '#6b7560' }} className="uppercase">
                + Add / Find Recruit
              </span>
            </Link>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '4px', color: '#6b7560' }} className="uppercase mb-4">Quick Actions</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-0.5">
          {[
            { href: '/dashboard/letters/new', icon: '✉️', label: 'Send Letter', sub: 'From $1.99' },
            { href: '/dashboard/packages', icon: '📦', label: 'Care Package', sub: 'From $24.99' },
            { href: '/dashboard/store', icon: '👕', label: 'Gear Store', sub: 'Branch pride' },
            { href: '/dashboard/book', icon: '📖', label: 'Legacy Book', sub: 'From $29.99' },
          ].map(a => (
            <Link key={a.href} href={a.href} style={{ background: '#ffffff', borderTop: '3px solid #e8ddd0' }} className="p-6 block hover:border-olive transition-all">
              <div className="text-3xl mb-3">{a.icon}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', letterSpacing: '1px', color: '#1a1a16' }} className="mb-1">{a.label}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px', color: '#6b7560' }} className="uppercase">{a.sub}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Credits bar */}
      <div style={{ background: '#1a1a16', marginTop: '32px' }} className="p-6 flex items-center justify-between">
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '3px', color: '#6b7560' }} className="uppercase mb-1">Letter Credits</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '36px', color: '#d4a017' }}>{profile?.letter_credits ?? 0}</div>
        </div>
        <Link href="/dashboard/billing" style={{ background: '#d4a017', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '3px' }} className="px-6 py-3 text-black uppercase hover:opacity-90">
          Buy More →
        </Link>
      </div>
    </div>
  )
}
