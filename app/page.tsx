'use client'
import { useState } from 'react'
import Link from 'next/link'

const NAV_LINKS = [
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
]

export default function LandingPage() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [branch, setBranch] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleWaitlist(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, branch }),
      })
      setSuccess(true)
    } catch {}
    setLoading(false)
  }

  const mono = { fontFamily: 'var(--font-mono)' } as React.CSSProperties
  const sans = { fontFamily: 'var(--font-display)' } as React.CSSProperties
  const serif = { fontFamily: 'var(--font-body)' } as React.CSSProperties

  return (
    <div style={{ background: '#f5f0e8', color: '#1a1a16', minHeight: '100vh' }}>

      {/* NAV */}
      <nav style={{ borderBottom: '2px solid #1a1a16', background: '#f5f0e8', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px' }}>
          <Link href="/">
            <div style={{ ...sans, fontSize: '22px', fontWeight: 900, letterSpacing: '5px', color: '#1a1a16' }}>
              BOOT<span style={{ color: '#b8860b' }}>MAIL</span>
            </div>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(l => (
              <a key={l.label} href={l.href} style={{ ...mono, fontSize: '11px', letterSpacing: '2px', color: '#6b7560', textDecoration: 'none', textTransform: 'uppercase' as const }}>
                {l.label}
              </a>
            ))}
            <Link href="/auth/login" style={{ ...mono, fontSize: '11px', letterSpacing: '2px', color: '#4a5240', textDecoration: 'none', textTransform: 'uppercase' as const }}>
              Sign In
            </Link>
            <a href="#waitlist" style={{ background: '#1a1a16', ...mono, fontSize: '11px', letterSpacing: '2px', color: '#f5f0e8', textDecoration: 'none', textTransform: 'uppercase' as const, padding: '8px 18px' }}>
              Get Started
            </a>
          </div>
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden" style={{ background: 'none', border: 'none', cursor: 'pointer', ...mono, fontSize: '11px', letterSpacing: '2px', color: '#6b7560' }}>
            {menuOpen ? 'CLOSE' : 'MENU'}
          </button>
        </div>
        {menuOpen && (
          <div style={{ background: '#f5f0e8', borderTop: '1px solid #d4c9b0', padding: '16px 40px' }} className="md:hidden flex flex-col gap-3">
            {NAV_LINKS.map(l => (
              <a key={l.label} href={l.href} onClick={() => setMenuOpen(false)} style={{ ...mono, fontSize: '11px', letterSpacing: '2px', color: '#6b7560', textDecoration: 'none', textTransform: 'uppercase' as const, padding: '8px 0', borderBottom: '1px solid #e8ddd0' }}>
                {l.label}
              </a>
            ))}
            <Link href="/auth/login" onClick={() => setMenuOpen(false)} style={{ ...mono, fontSize: '11px', letterSpacing: '2px', color: '#b8860b', textDecoration: 'none', textTransform: 'uppercase' as const, padding: '8px 0' }}>
              Sign In →
            </Link>
          </div>
        )}
      </nav>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 40px' }}>

        {/* HERO */}
        <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '460px', borderBottom: '1px solid #d4c9b0', gap: '0' }} className="grid-cols-1 md:grid-cols-2">
          <div style={{ padding: '60px 0 60px', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderRight: '1px solid #d4c9b0', paddingRight: '48px' }}>
            <span style={{ ...mono, fontSize: '11px', letterSpacing: '3px', color: '#6b7560', textTransform: 'uppercase' as const, display: 'block', marginBottom: '16px' }}>● For Military Families</span>
            <h1 style={{ ...sans, fontSize: 'clamp(36px, 5vw, 52px)', fontWeight: 900, letterSpacing: '1px', color: '#1a1a16', lineHeight: 1.05, margin: '0 0 20px' }}>
              Their phone<br />was taken<br /><span style={{ color: '#b8860b' }}>on Day 1.</span>
            </h1>
            <p style={{ ...serif, fontSize: '17px', lineHeight: 1.75, color: '#3a3a2e', margin: '0 0 10px' }}>
              A letter is the only thing that reaches them now.
            </p>
            <p style={{ ...mono, fontSize: '12px', color: '#6b7560', margin: '0 0 36px', lineHeight: 1.7 }}>
              We print it, seal it, and mail it via USPS.<br />In their hands within days. From $1.99.
            </p>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <a href="#waitlist" style={{ background: '#b8860b', ...mono, fontSize: '12px', letterSpacing: '3px', color: '#fff', textTransform: 'uppercase' as const, padding: '14px 28px', textDecoration: 'none' }}>
                Send First Letter →
              </a>
              <a href="#how-it-works" style={{ ...mono, fontSize: '11px', letterSpacing: '2px', color: '#6b7560', textTransform: 'uppercase' as const, textDecoration: 'none' }}>
                See how it works ↓
              </a>
            </div>
          </div>

          {/* Letter mockup */}
          <div style={{ background: '#ede8de', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', position: 'relative', overflow: 'hidden', marginLeft: '1px' }}>
            <div style={{ background: '#ffffff', width: '100%', maxWidth: '280px', padding: '28px', boxShadow: '4px 4px 0px #d4c9b0, 8px 8px 0px #c8b89a', position: 'relative', zIndex: 1, border: '1px solid #e8ddd0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '2px solid #1a1a16', paddingBottom: '10px', marginBottom: '14px' }}>
                <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '13px', fontWeight: 900, letterSpacing: '3px', color: '#1a1a16' }}>BOOT<span style={{ color: '#b8860b' }}>MAIL</span></div>
                <div style={{ ...mono, fontSize: '8px', color: '#999' }}>May 27, 2026</div>
              </div>
              <div style={{ ...mono, fontSize: '8px', lineHeight: 1.8, color: '#333', borderLeft: '2px solid #e8ddd0', paddingLeft: '8px', marginBottom: '12px' }}>
                <strong>PVT JORDAN MILLER</strong><br />
                B CO, 2-47 INF REGT<br />
                FORT MOORE, GA 31905
              </div>
              <hr style={{ border: 'none', borderTop: '1px solid #e8ddd0', marginBottom: '12px' }} />
              <div style={{ ...serif, fontSize: '9px', color: '#444', lineHeight: 1.8, fontStyle: 'italic', marginBottom: '10px' }}>Dear Jordan,</div>
              {[100, 85, 100, 65, 100, 90].map((w, i) => (
                <div key={i} style={{ height: '6px', background: '#f0ede6', margin: '4px 0', width: w + '%' }} />
              ))}
              <div style={{ marginTop: '12px', borderTop: '1px solid #e8ddd0', paddingTop: '10px' }}>
                <div style={{ ...mono, fontSize: '7px', color: '#999', letterSpacing: '1px', textTransform: 'uppercase' as const, marginBottom: '6px' }}>Photos (3)</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '3px' }}>
                  <div style={{ aspectRatio: '1', background: '#e8ddd0' }} />
                  <div style={{ aspectRatio: '1', background: '#d4c9b0' }} />
                  <div style={{ aspectRatio: '1', background: '#c8b89a' }} />
                </div>
              </div>
              <div style={{ marginTop: '10px', borderTop: '1px solid #e8ddd0', paddingTop: '8px', ...mono, fontSize: '6px', color: '#bbb', textAlign: 'center', textTransform: 'uppercase' as const, letterSpacing: '1px' }}>
                Sent with BootMail · bootmail.app
              </div>
            </div>
            <div style={{ position: 'absolute', bottom: '20px', right: '20px', background: '#fff', border: '1px solid #d4c9b0', padding: '6px 12px' }}>
              <span style={{ ...mono, fontSize: '9px', letterSpacing: '2px', color: '#4a5240', textTransform: 'uppercase' as const }}>USPS First Class</span>
            </div>
          </div>
        </section>

        {/* BRANCH STRIP */}
        <section style={{ padding: '24px 40px', background: '#ede8de', borderBottom: '1px solid #d4c9b0', margin: '0 -40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px', flexWrap: 'wrap' }}>
            <span style={{ ...mono, fontSize: '10px', letterSpacing: '3px', color: '#6b7560', textTransform: 'uppercase' as const, flexShrink: 0 }}>All Branches:</span>
            <div style={{ display: 'flex', gap: '32px', alignItems: 'center', flexWrap: 'wrap' }}>
              {[
                { label: 'Army', icon: <svg width="28" height="28" viewBox="0 0 32 32" fill="none"><polygon points="16,2 19.5,12 30,12 21.5,18.5 24.5,29 16,22.5 7.5,29 10.5,18.5 2,12 12.5,12" fill="#4a5240"/></svg> },
                { label: 'Marines', icon: <svg width="28" height="28" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="12" stroke="#4a5240" strokeWidth="1.5" fill="none"/><ellipse cx="16" cy="16" rx="5" ry="12" stroke="#4a5240" strokeWidth="1.5" fill="none"/><line x1="4" y1="16" x2="28" y2="16" stroke="#4a5240" strokeWidth="1.5"/></svg> },
                { label: 'Navy', icon: <svg width="28" height="28" viewBox="0 0 32 32" fill="none"><line x1="16" y1="4" x2="16" y2="28" stroke="#4a5240" strokeWidth="1.5"/><circle cx="16" cy="8" r="4" stroke="#4a5240" strokeWidth="1.5" fill="none"/><line x1="8" y1="14" x2="24" y2="14" stroke="#4a5240" strokeWidth="1.5"/><line x1="8" y1="24" x2="24" y2="24" stroke="#4a5240" strokeWidth="1.5"/><path d="M8 28 Q16 22 24 28" stroke="#4a5240" strokeWidth="1.5" fill="none"/></svg> },
                { label: 'Air Force', icon: <svg width="28" height="28" viewBox="0 0 32 32" fill="none"><path d="M2 18 Q8 10 16 16 Q24 10 30 18" stroke="#4a5240" strokeWidth="1.5" fill="none"/><circle cx="16" cy="16" r="4" fill="#4a5240"/></svg> },
                { label: 'Coast Guard', icon: <svg width="28" height="28" viewBox="0 0 32 32" fill="none"><polygon points="16,3 29,24 3,24" stroke="#4a5240" strokeWidth="1.5" fill="none"/><line x1="16" y1="10" x2="16" y2="24" stroke="#4a5240" strokeWidth="1.5"/></svg> },
                { label: 'Space Force', icon: <svg width="28" height="28" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="10" stroke="#4a5240" strokeWidth="1.5" fill="none"/><ellipse cx="16" cy="16" rx="10" ry="4" stroke="#4a5240" strokeWidth="1.5" fill="none"/><circle cx="16" cy="16" r="3" fill="#4a5240"/></svg> },
              ].map(b => (
                <div key={b.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                  {b.icon}
                  <span style={{ ...mono, fontSize: '8px', color: '#6b7560', textTransform: 'uppercase' as const, letterSpacing: '1px' }}>{b.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* MAIL CALL QUOTE */}
        <section style={{ padding: '48px 40px', background: '#1a1a16', margin: '0 -40px', borderBottom: '1px solid #d4c9b0' }}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', maxWidth: '720px' }}>
            <div style={{ color: '#b8860b', fontSize: '72px', lineHeight: 0.7, ...serif, flexShrink: 0 }}>"</div>
            <div>
              <p style={{ ...serif, fontSize: '19px', lineHeight: 1.75, color: '#c8b89a', margin: '0 0 12px', fontStyle: 'italic' }}>
                At mail call, drill sergeants read names out loud in front of the whole unit. Getting mail means someone at home is thinking about you. Not getting mail means the opposite.
              </p>
              <span style={{ ...mono, fontSize: '10px', letterSpacing: '2px', color: '#4a5240', textTransform: 'uppercase' as const }}>Every recruit. Every branch. Every week.</span>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" style={{ padding: '64px 0', borderBottom: '1px solid #d4c9b0' }}>
          <span style={{ ...mono, fontSize: '11px', letterSpacing: '3px', color: '#6b7560', textTransform: 'uppercase' as const, display: 'block', marginBottom: '32px' }}>How It Works</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: '#d4c9b0' }} className="grid-cols-1 md:grid-cols-3">
            {[
              { num: '01', label: 'Write', desc: 'Type your letter and add up to 6 photos. Takes 2 minutes from any device.', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4a5240" strokeWidth="1.5"><rect x="3" y="5" width="18" height="14" rx="1"/><path d="M3 7l9 6 9-6"/></svg> },
              { num: '02', label: 'We Print & Mail', desc: 'Printed on quality paper, sealed in an envelope, mailed via USPS First Class.', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4a5240" strokeWidth="1.5"><rect x="5" y="3" width="14" height="18" rx="1"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="12" y2="16"/></svg> },
              { num: '03', label: 'They Receive', desc: 'Your words in their hands within days. USPS tracking so you know it arrived.', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4a5240" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
            ].map(s => (
              <div key={s.num} style={{ background: '#f5f0e8', padding: '32px 28px' }}>
                <div style={{ width: '48px', height: '48px', border: '1px solid #4a5240', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>{s.icon}</div>
                <div style={{ ...sans, fontSize: '11px', fontWeight: 700, letterSpacing: '3px', color: '#b8860b', textTransform: 'uppercase' as const, marginBottom: '10px' }}>{s.num} — {s.label}</div>
                <p style={{ ...serif, fontSize: '14px', lineHeight: 1.75, color: '#3a3a2e', margin: 0 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 167 HOURS + WHAT YOU GET */}
        <section id="pricing" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid #d4c9b0' }} className="grid-cols-1 md:grid-cols-2">
          <div style={{ padding: '56px 0', borderRight: '1px solid #d4c9b0', paddingRight: '48px' }}>
            <span style={{ ...mono, fontSize: '11px', letterSpacing: '3px', color: '#6b7560', textTransform: 'uppercase' as const, display: 'block', marginBottom: '16px' }}>The Reality</span>
            <div style={{ ...sans, fontSize: '96px', fontWeight: 900, color: '#b8860b', lineHeight: 1, marginBottom: '4px' }}>167</div>
            <div style={{ ...mono, fontSize: '10px', letterSpacing: '3px', color: '#6b7560', textTransform: 'uppercase' as const, marginBottom: '20px' }}>Hours / Week Without Phone</div>
            <p style={{ ...serif, fontSize: '15px', lineHeight: 1.8, color: '#3a3a2e', margin: '0 0 28px' }}>Even if your recruit gets 1 hour on Sunday — that leaves 167 hours when a letter in their footlocker is the only piece of home they have.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[['Army BCT','10 wks'],['Marines','13 wks'],['Navy','8 wks'],['Air Force','8.5 wks']].map(([branch, dur]) => (
                <div key={branch} style={{ background: '#ede8de', padding: '12px 16px', border: '1px solid #d4c9b0' }}>
                  <div style={{ ...mono, fontSize: '9px', color: '#6b7560', textTransform: 'uppercase' as const, letterSpacing: '1px' }}>{branch}</div>
                  <div style={{ ...sans, fontSize: '20px', fontWeight: 900, color: '#1a1a16' }}>{dur}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: '56px 0 56px 48px' }}>
            <span style={{ ...mono, fontSize: '11px', letterSpacing: '3px', color: '#6b7560', textTransform: 'uppercase' as const, display: 'block', marginBottom: '16px' }}>What You Get</span>
            <h3 style={{ ...sans, fontSize: '26px', fontWeight: 900, color: '#1a1a16', margin: '0 0 28px', lineHeight: 1.2 }}>Everything your recruit needs, in one place.</h3>
            <div>
              {[
                { label: 'Letters with Photos', desc: 'Printed on quality paper, mailed via USPS. Photos included.', price: '$1.99' },
                { label: 'Care Packages', desc: 'Snacks, gear and comfort items shipped direct to base.', price: '$24.99' },
                { label: 'Legacy Book', desc: 'Every letter and photo, bound and printed as a keepsake.', price: '$29.99' },
                { label: 'Support Squad', desc: 'The whole family sends letters to one recruit together.', price: 'Free' },
                { label: 'USPS Tracking', desc: 'Know exactly when your letter arrives at the mailroom.', price: 'Free' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', padding: '14px 0', borderBottom: '1px solid #d4c9b0' }}>
                  <div style={{ color: '#4a5240', fontSize: '18px', flexShrink: 0 }}>✓</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ ...mono, fontSize: '12px', letterSpacing: '2px', color: '#1a1a16', textTransform: 'uppercase' as const, marginBottom: '3px' }}>{item.label}</div>
                    <div style={{ ...serif, fontSize: '13px', color: '#6b7560', fontStyle: 'italic' }}>{item.desc}</div>
                  </div>
                  <div style={{ ...sans, fontSize: '18px', fontWeight: 900, color: item.price === 'Free' ? '#4a5240' : '#b8860b', flexShrink: 0 }}>{item.price}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '20px', padding: '16px', background: '#ede8de', border: '1px solid #d4c9b0' }}>
              <p style={{ ...mono, fontSize: '10px', letterSpacing: '2px', color: '#4a5240', textTransform: 'uppercase' as const, margin: 0 }}>Credits never expire · No subscription required</p>
            </div>
          </div>
        </section>

        {/* WAITLIST CTA */}
        <section id="waitlist" style={{ padding: '80px 0', textAlign: 'center', borderBottom: '1px solid #d4c9b0' }}>
          <h2 style={{ ...sans, fontSize: 'clamp(36px, 5vw, 48px)', fontWeight: 900, color: '#1a1a16', lineHeight: 1.1, margin: '0 0 16px' }}>
            More Than Mail.<br /><span style={{ color: '#b8860b' }}>It&apos;s Morale.</span>
          </h2>
          <p style={{ ...serif, fontSize: '16px', lineHeight: 1.75, color: '#3a3a2e', margin: '0 0 8px', maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' }}>
            Your recruit is pushing through the hardest weeks of their life. Send something real.
          </p>
          <p style={{ ...mono, fontSize: '11px', letterSpacing: '3px', color: '#6b7560', textTransform: 'uppercase' as const, margin: '0 0 36px' }}>Week 3 is when it matters most.</p>

          {success ? (
            <div style={{ background: 'rgba(74,82,64,0.1)', border: '1px solid rgba(74,82,64,0.4)', padding: '32px', maxWidth: '460px', margin: '0 auto', textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎖️</div>
              <div style={{ ...sans, fontSize: '28px', fontWeight: 900, color: '#1a1a16', letterSpacing: '2px', marginBottom: '8px' }}>You&apos;re In.</div>
              <p style={{ ...serif, fontSize: '14px', color: '#6b7560', fontStyle: 'italic', marginBottom: '20px' }}>Check your email. 5 free credits are waiting.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Link href="/auth/signup" style={{ background: '#b8860b', ...mono, fontSize: '11px', letterSpacing: '3px', color: '#fff', textTransform: 'uppercase' as const, padding: '14px 32px', textDecoration: 'none', display: 'block' }}>
                  Create Your Account →
                </Link>
                <Link href="/auth/login" style={{ border: '1px solid #c8b89a', ...mono, fontSize: '11px', letterSpacing: '3px', color: '#6b7560', textTransform: 'uppercase' as const, padding: '12px 32px', textDecoration: 'none', display: 'block' }}>
                  Already have an account? Sign In
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleWaitlist} style={{ maxWidth: '460px', margin: '0 auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  style={{ background: '#fff', border: '1px solid #c8b89a', color: '#1a1a16', padding: '14px 16px', ...mono, fontSize: '13px', outline: 'none', width: '100%' }}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text" value={name} onChange={e => setName(e.target.value)}
                    placeholder="Your name (optional)"
                    style={{ flex: 1, background: '#fff', border: '1px solid #c8b89a', color: '#1a1a16', padding: '12px 16px', ...mono, fontSize: '12px', outline: 'none' }}
                  />
                  <select value={branch} onChange={e => setBranch(e.target.value)}
                    style={{ flex: 1, background: '#fff', border: '1px solid #c8b89a', color: branch ? '#1a1a16' : '#6b7560', padding: '12px 16px', ...mono, fontSize: '12px', outline: 'none', appearance: 'none' as const }}>
                    <option value="">Branch (optional)</option>
                    <option value="army">Army</option>
                    <option value="marines">Marines</option>
                    <option value="navy">Navy</option>
                    <option value="airforce">Air Force</option>
                    <option value="coastguard">Coast Guard</option>
                    <option value="spaceforce">Space Force</option>
                  </select>
                </div>
              </div>
              <button type="submit" disabled={loading}
                style={{ background: '#1a1a16', ...mono, fontSize: '12px', letterSpacing: '3px', color: '#f5f0e8', textTransform: 'uppercase' as const, padding: '14px', border: 'none', cursor: 'pointer', width: '100%' }}>
                {loading ? 'Joining...' : 'Get Early Access — 5 Free Credits →'}
              </button>
              <p style={{ ...mono, fontSize: '10px', letterSpacing: '2px', color: '#6b7560', textTransform: 'uppercase' as const, margin: '12px 0 0' }}>No spam · No credit card required</p>
            </form>
          )}
        </section>
      </div>

      {/* FOOTER */}
      <footer style={{ borderTop: '2px solid #1a1a16', background: '#ede8de', padding: '24px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ ...sans, fontSize: '16px', fontWeight: 900, letterSpacing: '4px', color: '#1a1a16' }}>BOOT<span style={{ color: '#b8860b' }}>MAIL</span></div>
        <span style={{ ...mono, fontSize: '10px', letterSpacing: '2px', color: '#6b7560', textTransform: 'uppercase' as const }}>More Than Mail. It&apos;s Morale.</span>
        <div style={{ display: 'flex', gap: '20px' }}>
          {['Privacy', 'Terms', 'Contact'].map(l => (
            <span key={l} style={{ ...mono, fontSize: '10px', color: '#6b7560', textTransform: 'uppercase' as const, cursor: 'pointer' }}>{l}</span>
          ))}
        </div>
      </footer>
    </div>
  )
}
