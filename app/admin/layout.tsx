'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [authorized, setAuthorized] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    async function check() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/auth/login'; return }

      const res = await fetch('/api/admin/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: session.user.id }),
      })
      const { isAdmin } = await res.json()
      if (!isAdmin) { window.location.href = '/dashboard'; return }
      setAuthorized(true)
      setChecking(false)
    }
    check()
  }, [])

  if (checking) {
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
    <div style={{ background: '#f5f0e8' }} className="min-h-screen">
      <nav style={{ background: '#1a1a16', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <Link href="/dashboard">
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', letterSpacing: '4px', color: '#ffffff' }}>
                BOOT<span style={{ color: '#d4a017' }}>MAIL</span>
              </div>
            </Link>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '3px', color: '#c0392b', border: '1px solid rgba(192,57,43,0.4)', padding: '3px 10px' }} className="uppercase">
              Admin
            </div>
          </div>
          <div className="flex items-center gap-1">
            {[
              { href: '/admin', label: 'Dashboard' },
              { href: '/admin/letters', label: 'Letters' },
              { href: '/admin/orders', label: 'Orders' },
              { href: '/admin/customers', label: 'Customers' },
              { href: '/admin/waitlist', label: 'Waitlist' },
            ].map(l => (
              <Link key={l.href} href={l.href}
                style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px', color: '#6b7560' }}
                className="px-3 py-4 uppercase hover:text-white transition-colors">
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}
