import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const ADMIN_EMAILS = ['jamie@mrfgrant.com']

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !ADMIN_EMAILS.includes(user.email ?? '')) {
    redirect('/')
  }

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
