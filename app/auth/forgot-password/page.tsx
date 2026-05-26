'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/auth/update-password',
    })
    if (authError) { setError(authError.message); setLoading(false) }
    else { setSent(true) }
  }

  if (sent) {
    return (
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(74,82,64,0.4)' }} className="p-8 text-center">
        <div className="text-5xl mb-6">📬</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', letterSpacing: '3px', color: '#ffffff' }} className="mb-3">
          Reset Link Sent
        </div>
        <p style={{ fontFamily: 'var(--font-body)', color: '#c8b89a', fontSize: '14px' }} className="leading-relaxed">
          Check your email for a password reset link. It expires in 1 hour.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }} className="p-8">
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '4px', color: '#6b7560' }} className="uppercase mb-2">
          Reset Your Password
        </div>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#6b7560', fontStyle: 'italic' }} className="mb-6">
          Enter your email and we will send a reset link.
        </p>
        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '3px', color: '#6b7560', display: 'block', textTransform: 'uppercase', marginBottom: '8px' }}>
              Email Address
            </label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="sarah@example.com"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff', width: '100%', padding: '12px 16px', fontSize: '14px', outline: 'none' }} />
          </div>
          {error && <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#e74c3c' }}>{error}</p>}
          <button type="submit" disabled={loading}
            style={{ background: '#4a5240', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '3px', width: '100%', padding: '16px', border: 'none', cursor: 'pointer' }}
            className="text-white uppercase hover:opacity-90 disabled:opacity-50 transition-opacity">
            {loading ? 'Sending...' : 'Send Reset Link →'}
          </button>
        </form>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: '24px', paddingTop: '24px', textAlign: 'center' }}>
          <Link href="/auth/login"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px', color: '#6b7560' }}
            className="uppercase hover:text-white transition-colors">
            ← Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
