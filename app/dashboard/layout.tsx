import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, plan, letter_credits')
    .eq('id', user.id)
    .single()

  return (
    <div style={{ background: '#f5f0e8' }} className="min-h-screen">
      {/* Top Nav */}
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

            {/* Credits badge */}
            <div style={{ background: 'rgba(212,160,23,0.1)', border: '1px solid rgba(212,160,23,0.2)' }}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 ml-2">
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px', color: '#d4a017' }}
                className="uppercase">
                {profile?.letter_credits ?? 0} Letters
              </span>
            </div>

            {/* Account */}
            <Link href="/dashboard/account"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px', color: '#6b7560', marginLeft: '8px' }}
              className="uppercase hover:text-white transition-colors px-3 py-4">
              {profile?.full_name?.split(' ')[0] ?? 'Account'}
            </Link>
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        {children}
      </main>
    </div>
  )
}
