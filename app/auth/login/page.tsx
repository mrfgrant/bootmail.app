'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(authError.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
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
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '3px', color: '#6b7560' }}
              className="block uppercase mb-2">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="sarah@example.com"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff' }}
              className="w-full px-4 py-3 text-sm focus:outline-none focus:border-gold placeholder-gray-600 transition-colors"
            />
          </div>

          <div>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '3px', color: '#6b7560' }}
              className="block uppercase mb-2">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff' }}
              className="w-full px-4 py-3 text-sm focus:outline-none placeholder-gray-600 transition-colors"
            />
          </div>

          {error && (
            <div style={{ background: 'rgba(192,57,43,0.1)', border: '1px solid rgba(192,57,43,0.3)' }}
              className="px-4 py-3">
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#e74c3c' }}>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ background: '#4a5240', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '3px' }}
            className="w-full py-4 text-white uppercase tracking-widest hover:opacity-90 disabled:opacity-50 transition-opacity mt-2">
            {loading ? 'Signing In...' : 'Sign In →'}
          </button>
        </form>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} className="mt-6 pt-6 flex justify-between">
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

      {/* Back to landing */}
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
