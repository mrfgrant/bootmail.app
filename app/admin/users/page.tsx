import { createClient } from '@/lib/supabase/server'

export default async function AdminUsersPage() {
  const supabase = createClient()
  const { data: users } = await supabase
    .from('profiles')
    .select('*, recruits(id, full_name, branch)')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="mb-8">
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '4px', color: '#4a5240' }} className="uppercase mb-2">Users</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '48px', letterSpacing: '3px', color: '#ffffff' }}>
          {users?.length ?? 0} User{(users?.length ?? 0) !== 1 ? 's' : ''}
        </h1>
      </div>
      <div className="space-y-0.5">
        {users?.map(user => (
          <div key={user.id}
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', padding: '16px 20px' }}
            className="flex items-center justify-between">
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', letterSpacing: '1px', color: '#ffffff' }}>
                {user.full_name || 'No name'}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#4a5240', marginTop: '2px' }} className="uppercase">
                {user.email}
              </div>
              {user.recruits?.length > 0 && (
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#6b7560', marginTop: '4px' }}>
                  {user.recruits.map((r: any) => r.full_name + ' (' + r.branch + ')').join(', ')}
                </div>
              )}
            </div>
            <div className="text-right">
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: '#d4a017' }}>
                {user.letter_credits}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: '#4a5240' }} className="uppercase">
                Credits · {user.plan}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: '#4a4a40', marginTop: '2px' }}>
                {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
