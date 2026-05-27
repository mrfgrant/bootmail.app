'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const ADMIN_EMAILS = ['jamie@mrfgrant.com']

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function check() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user || !ADMIN_EMAILS.includes(session.user.email ?? '')) {
        window.location.href = '/'
        return
      }
      setAuthorized(true)
      setLoading(false)
    }
    check()
  }, [])

  if (loading) {
    return (
      <div style={{ background: '#1a1a16', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '4px', color: '#4a5240' }} className="uppercase">
          Verifying access...
        </div>
      </div>
    )
  }

  if (!authorized) return null

  return (
    <div style={{ background: '#1a1a16', minHeight: '100vh' }}>
      <nav style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 24px' }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <Link href="/admin">
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', letterSpacing: '4px', color: '#ffffff' }}>
                BOOT<span style={{ color: '#d4a017' }}>MAIL</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '3px', color: '#d4a017', marginLeft: '8px' }}>ADMIN</span>
              </div>
            </Link>
            {[
              { href: '/admin', label: 'Dashboard' },
              { href: '/admin/letters', label: 'Letters' },
              { href: '/admin/packages', label: 'Packages' },
              { href: '/admin/orders', label: 'Orders' },
              { href: '/admin/users', label: 'Users' },
              { href: '/admin/waitlist', label: 'Waitlist' },
            ].map(l => (
              <Link key={l.href} href={l.href}
                style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px', color: '#6b7560' }}
                className="uppercase hover:text-white transition-colors hidden md:block">
                {l.label}
              </Link>
            ))}
          </div>
          <Link href="/dashboard"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px', color: '#4a4a40' }}
            className="uppercase hover:text-gray-500 transition-colors">
            ← App
          </Link>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}
