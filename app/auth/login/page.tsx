'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [debug, setDebug] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setDebug('Attempting sign in...')

    try {
      const supabase = createClient()
      setDebug('Supabase client created. Calling signInWithPassword...')

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      setDebug('Response received. error=' + JSON.stringify(authError) + ' session=' + (data?.session ? 'YES' : 'NO') + ' user=' + (data?.user?.email ?? 'none'))

      if (authError) {
        setError(authError.message)
        setLoading(false)
        return
      }

      if (data?.session) {
        setDebug('Session found! Redirecting to /dashboard...')
        setTimeout(() => {
          window.location.replace('/dashboard')
        }, 500)
      } else {
        setError('Sign in returned no session. Check email confirmation settings in Supabase.')
        setLoading(false)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setError('Exception: ' + msg)
      setDebug('Caught error: ' + msg)
      setLoading(false)
    }
  }

  return (
    <div>
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }} className="p-8">
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '4px', color: '#6b7560' }}
          className="uppercase mb-6">
          Sign In to Your Account
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '3px', color: '#6b7560', display: 'block', textTransform: 'uppercase', marginBottom: '8px' }}>
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="sarah@example.com"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff', width: '100%', padding: '12px 16px', fontSize: '14px', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '3px', color: '#6b7560', display: 'block', textTransform: 'uppercase', marginBottom: '8px' }}>
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff', width: '100%', padding: '12px 16px', fontSize: '14px', outline: 'none' }}
            />
          </div>

          {error && (
            <div style={{ background: 'rgba(192,57,43,0.15)', border: '1px solid rgba(192,57,43,0.4)', padding: '12px 16px' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#e74c3c' }}>{error}</p>
            </div>
          )}

          {/* DEBUG OUTPUT — visible on screen */}
          {debug && (
            <div style={{ background: 'rgba(212,160,23,0.1)', border: '1px solid rgba(212,160,23,0.3)', padding: '12px 16px' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#d4a017', wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}>
                DEBUG: {debug}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ background: '#4a5240', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '3px', width: '100%', padding: '16px', border: 'none', cursor: 'pointer' }}
            className="text-white uppercase hover:opacity-90 disabled:opacity-50">
            {loading ? 'Signing In...' : 'Sign In →'}
          </button>
        </form>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: '24px', paddingTop: '24px', display: 'flex', justifyContent: 'space-between' }}>
          <Link href="/auth/forgot-password"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px', color: '#6b7560' }}
            className="uppercase hover:text-white transition-colors">
            Forgot Password?
          </Link>
          <Link href="/auth/signup"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px', color: '#d4a017' }}
            className="uppercase hover:opacity-80 transition-opacity">
            Create Account →
          </Link>
        </div>
      </div>

      <div className="text-center mt-6">
        <Link href="/"
          style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px', color: '#4a4a40' }}
          className="uppercase hover:text-gray-500 transition-colors">
          ← Back to bootmail.app
        </Link>
      </div>
    </div>
  )
}
