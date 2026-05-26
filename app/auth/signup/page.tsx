'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin + '/dashboard',
      },
    })
    if (authError) { setError(authError.message); setLoading(false) }
    else { setSuccess(true) }
  }

  if (success) {
    return (
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(74,82,64,0.4)' }} className="p-8 text-center">
        <div className="text-5xl mb-6">🎖️</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', letterSpacing: '3px', color: '#ffffff' }} className="mb-3">
          Check Your Email
        </div>
        <p style={{ fontFamily: 'var(--font-body)', color: '#c8b89a', fontSize: '15px' }} className="mb-6 leading-relaxed">
          We sent a confirmation link to <strong style={{ color: '#ffffff' }}>{email}</strong>.
          Click it to activate your account.
        </p>
        <Link href="/auth/login"
          style={{ background: '#4a5240', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '3px', color: '#ffffff' }}
          className="inline-block px-8 py-4 uppercase">
          Back to Sign In
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }} className="p-8">
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '4px', color: '#6b7560' }} className="uppercase mb-2">
          Create Your Account
        </div>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#6b7560', fontStyle: 'italic' }} className="mb-6">
          5 free letters included for waitlist members.
        </p>
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '3px', color: '#6b7560', display: 'block', textTransform: 'uppercase', marginBottom: '8px' }}>
              Your Full Name
            </label>
            <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)}
              placeholder="Sarah Johnson"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff', width: '100%', padding: '12px 16px', fontSize: '14px', outline: 'none' }} />
          </div>
          <div>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '3px', color: '#6b7560', display: 'block', textTransform: 'uppercase', marginBottom: '8px' }}>
              Email Address
            </label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="sarah@example.com"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff', width: '100%', padding: '12px 16px', fontSize: '14px', outline: 'none' }} />
          </div>
          <div>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '3px', color: '#6b7560', display: 'block', textTransform: 'uppercase', marginBottom: '8px' }}>
              Password (min 8 characters)
            </label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff', width: '100%', padding: '12px 16px', fontSize: '14px', outline: 'none' }} />
          </div>
          {error && <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#e74c3c' }}>{error}</p>}
          <button type="submit" disabled={loading}
            style={{ background: '#d4a017', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '3px', width: '100%', padding: '16px', border: 'none', cursor: 'pointer' }}
            className="text-black uppercase hover:opacity-90 disabled:opacity-50 transition-opacity">
            {loading ? 'Creating Account...' : 'Create Account →'}
          </button>
        </form>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: '24px', paddingTop: '24px', textAlign: 'center' }}>
          <Link href="/auth/login"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px', color: '#6b7560' }}
            className="uppercase hover:text-white transition-colors">
            Already have an account? Sign In →
          </Link>
        </div>
      </div>
      <div className="text-center mt-6">
        <Link href="/" style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px', color: '#4a4a40' }}
          className="uppercase hover:text-gray-500 transition-colors">
          ← Back to bootmail.app
        </Link>
      </div>
    </div>
  )
}
