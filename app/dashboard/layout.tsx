'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()

  useEffect(() => {
    async function init() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { window.location.href = '/auth/login'; return }
      setUser(session.user)
      await supabase.from('profiles').upsert({
        id: session.user.id,
        email: session.user.email ?? '',
        full_name: session.user.user_metadata?.full_name ?? '',
      }, { onConflict: 'id', ignoreDuplicates: true })
      const { data: p } = await supabase.from('profiles').select('full_name, plan, letter_credits').eq('id', session.user.id).single()
      setProfile(p)
      setLoading(false)
    }
    init()
  }, [])

  if (loading) {
    return (
      <div style={{ background: '#1a1a16', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '4px', color: '#4a5240' }} className="uppercase">Loading...</div>
      </div>
    )
  }

  const displayName = profile?.full_name?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'Account'
  const credits = profile?.letter_credits ?? 0

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const NAV = [
    { href: '/dashboard', label: 'Home' },
    { href: '/dashboard/letters', label: 'Letters' },
    { href: '/dashboard/recruits/new', label: 'Recruits' },
    { href: '/dashboard/packages', label: 'Packages' },
    { href: '/dashboard/book', label: 'Legacy Book' },
    { href: '/dashboard/store', label: 'Store' },
  ]

  return (
    <div style={{ background: '#f5f0e8' }} className="min-h-screen">
      <nav style={{ background: '#1a1a16', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
          <Link href="/dashboard">
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', letterSpacing: '4px', color: '#ffffff' }}>
              BOOT<span style={{ color: '#d4a017' }}>MAIL</span>
            </div>
          </Link>

          <div className="flex items-center gap-0">
            {NAV.map(l => (
              <Link key={l.href} href={l.href}
                style={{
                  fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px',
                  color: pathname === l.href ? '#ffffff' : '#6b7560',
                  borderBottom: pathname === l.href ? '2px solid #d4a017' : '2px solid transparent',
                  padding: '0 12px', height: '56px', display: 'flex', alignItems: 'center',
                }}
                className="hidden md:flex uppercase hover:text-white transition-colors">
                {l.label}
              </Link>
            ))}

            <div style={{ background: 'rgba(212,160,23,0.1)', border: '1px solid rgba(212,160,23,0.2)' }}
              className="hidden md:flex items-center px-3 py-1.5 ml-2">
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px', color: '#d4a017' }} className="uppercase">
                {credits} Letters
              </span>
            </div>

            <button onClick={handleSignOut}
              style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px', color: '#6b7560', background: 'none', border: 'none', cursor: 'pointer', marginLeft: '12px', padding: '0 8px', height: '56px' }}
              className="uppercase hover:text-white transition-colors hidden md:flex items-center">
              {displayName} ↗
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-3">
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#d4a017' }}>{credits} credits</span>
            <Link href="/dashboard/letters/new"
              style={{ background: '#d4a017', fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px', color: '#000', padding: '6px 12px' }}
              className="uppercase">
              Write
            </Link>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="md:hidden overflow-x-auto" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex px-4 py-2 gap-4" style={{ width: 'max-content' }}>
            {NAV.map(l => (
              <Link key={l.href} href={l.href}
                style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px', color: pathname === l.href ? '#ffffff' : '#6b7560', whiteSpace: 'nowrap' }}
                className="uppercase hover:text-white transition-colors">
                {l.label}
              </Link>
            ))}
            <button onClick={handleSignOut}
              style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px', color: '#4a4a40', background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}
              className="uppercase">
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {children}
      </main>
    </div>
  )
}
