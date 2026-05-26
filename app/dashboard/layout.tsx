'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) {
        window.location.href = '/auth/login'
        return
      }

      setUser(session.user)

      // Upsert profile
      await supabase.from('profiles').upsert({
        id: session.user.id,
        email: session.user.email ?? '',
        full_name: session.user.user_metadata?.full_name ?? '',
      }, { onConflict: 'id', ignoreDuplicates: true })

      const { data: p } = await supabase
        .from('profiles')
        .select('full_name, plan, letter_credits')
        .eq('id', session.user.id)
        .single()

      setProfile(p)
      setLoading(false)
    }
    init()
  }, [])

  if (loading) {
    return (
      <div style={{ background: '#1a1a16', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '4px', color: '#4a5240' }}
          className="uppercase">
          Loading...
        </div>
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

  return (
    <div style={{ background: '#f5f0e8' }} className="min-h-screen">
      <nav style={{ background: '#1a1a16', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
          <Link href="/dashboard">
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', letterSpacing: '4px', color: '#ffffff' }}>
              BOOT<span style={{ color: '#d4a017' }}>MAIL</span>
            </div>
          </Link>

          <div className="flex items-center gap-1">
            {[
              { href: '/dashboard', label: 'Home' },
              { href: '/dashboard/letters', label: 'Letters' },
              { href: '/dashboard/packages', label: 'Packages' },
              { href: '/dashboard/book', label: 'Legacy Book' },
              { href: '/dashboard/store', label: 'Store' },
            ].map(l => (
              <Link key={l.href} href={l.href}
                style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px', color: '#6b7560' }}
                className="hidden md:block px-3 py-4 uppercase hover:text-white transition-colors">
                {l.label}
              </Link>
            ))}

            <div style={{ background: 'rgba(212,160,23,0.1)', border: '1px solid rgba(212,160,23,0.2)' }}
              className="hidden md:flex items-center px-3 py-1.5 ml-2">
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px', color: '#d4a017' }}
                className="uppercase">
                {credits} Letters
              </span>
            </div>

            <button onClick={handleSignOut}
              style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px', color: '#6b7560', marginLeft: '8px', background: 'none', border: 'none', cursor: 'pointer' }}
              className="uppercase hover:text-white transition-colors px-3 py-4">
              {displayName} · Sign Out
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
