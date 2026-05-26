import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AccountPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="max-w-xl">
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '4px', color: '#6b7560' }}
        className="uppercase mb-2">Account</div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '48px', letterSpacing: '3px', color: '#1a1a16' }}
        className="mb-8">
        {profile?.full_name ?? 'Your Account'}
      </h1>

      <div style={{ background: '#ffffff', padding: '28px' }} className="mb-4">
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '3px', color: '#6b7560' }}
          className="uppercase mb-4 pb-3 border-b border-tan">Profile</div>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#6b7560' }} className="uppercase tracking-wider">Name</span>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#1a1a16' }}>{profile?.full_name}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#6b7560' }} className="uppercase tracking-wider">Email</span>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#1a1a16' }}>{user.email}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#6b7560' }} className="uppercase tracking-wider">Plan</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#4a5240', textTransform: 'uppercase', letterSpacing: '2px' }}>
              {profile?.plan ?? 'Free'}
            </span>
          </div>
          <div className="flex justify-between">
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#6b7560' }} className="uppercase tracking-wider">Credits</span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: '#d4a017' }}>
              {profile?.letter_credits ?? 0}
            </span>
          </div>
        </div>
      </div>

      <form action="/api/auth/signout" method="POST">
        <button type="submit"
          style={{ border: '1px solid #c8b89a', fontFamily: 'var(--font-mono)', fontSize: '11px',
            letterSpacing: '3px', color: '#6b7560', background: 'transparent', cursor: 'pointer' }}
          className="w-full py-3 uppercase hover:border-olive hover:text-olive transition-colors">
          Sign Out
        </button>
      </form>
    </div>
  )
}
