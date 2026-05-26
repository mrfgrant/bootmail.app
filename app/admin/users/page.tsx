'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data, error: err } = await supabase
        .from('profiles')
        .select('id, email, full_name, plan, letter_credits, created_at')
        .order('created_at', { ascending: false })

      if (err) {
        setError(err.message)
        console.error('Users fetch error:', err)
      } else {
        setUsers(data ?? [])
      }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#4a5240' }} className="uppercase tracking-widest">
      Loading...
    </div>
  )

  return (
    <div>
      <div className="mb-8">
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '4px', color: '#4a5240' }} className="uppercase mb-2">Users</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '48px', letterSpacing: '3px', color: '#ffffff' }}>
          {users.length} User{users.length !== 1 ? 's' : ''}
        </h1>
      </div>

      {error && (
        <div style={{ background: 'rgba(192,57,43,0.1)', border: '1px solid rgba(192,57,43,0.3)', padding: '16px 20px', marginBottom: '24px' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#e74c3c' }}>Error: {error}</p>
        </div>
      )}

      {users.length === 0 && !error && (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#4a4a40' }} className="uppercase tracking-wider">
          No users found
        </div>
      )}

      <div className="space-y-0.5">
        {users.map(user => (
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
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: '#4a4a40', marginTop: '2px' }}>
                Joined: {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
            <div className="text-right">
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: '#d4a017' }}>
                {user.letter_credits}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: '#4a5240' }} className="uppercase">
                Credits · {user.plan}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
