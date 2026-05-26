'use client'
import { useState } from 'react'

const NAV_LINKS = [
  { label: 'Letters', href: '#letters' },
  { label: 'Care Packages', href: '#packages' },
  { label: 'Legacy Book', href: '#book' },
  { label: 'Pricing', href: '#pricing' },
]

const STATS = [
  { num: '$1.99', label: 'Per Letter' },
  { num: '6', label: 'Photos Included' },
  { num: '$19.99', label: 'Pro / Month' },
  { num: '5', label: 'Branches Supported' },
]

const FEATURES = [
  {
    icon: '✉️',
    tag: 'Core',
    tagColor: 'bg-olive/10 text-olive',
    title: 'Physical Letters',
    desc: 'Write from your phone, we print and mail via USPS. Up to 6 photos per letter. Starting at $1.99 — half what Sandboxx charges.',
  },
  {
    icon: '📦',
    tag: 'Exclusive',
    tagColor: 'bg-gold/10 text-gold',
    title: 'Care Packages',
    desc: 'Curated boxes fulfilled by us, shipped directly to your recruit. Branch-specific items, training-phase aware. Nobody else does this.',
  },
  {
    icon: '📖',
    tag: 'Exclusive',
    tagColor: 'bg-gold/10 text-gold',
    title: 'Legacy Memory Book',
    desc: 'Every letter and photo, compiled into a hardcover keepsake. Multi-sender, custom cover, digital signatures. Arrives by graduation day.',
  },
  {
    icon: '✍️',
    tag: 'Viral',
    tagColor: 'bg-red/10 text-red-700',
    title: 'Community Signing',
    desc: 'Share a link. Anyone — grandparents, coaches, whole towns — signs the Legacy Book with a message and handwriting font. No app needed.',
  },
  {
    icon: '👕',
    tag: 'Store',
    tagColor: 'bg-tan/30 text-olive',
    title: 'Branch Pride Gear',
    desc: 'Proud Army Mom tees, Marine Corps hoodies, challenge coins, graduation gifts. All branch-specific, all meaningful.',
  },
  {
    icon: '🔔',
    tag: 'Core',
    tagColor: 'bg-olive/10 text-olive',
    title: 'Training Milestones',
    desc: 'Weekly push notifications on what your recruit is going through. Branch-specific timelines. "Week 6 — The Crucible begins today."',
  },
]

const PRICING = [
  {
    name: 'Single Letter',
    price: '$2.99',
    period: 'per letter',
    items: ['1 letter, 6 photos', 'USPS tracking', 'Return stationery', 'Branch-specific envelope'],
    featured: false,
  },
  {
    name: 'Value Bundle',
    price: '$19.99',
    period: '10 letters ($1.99 each)',
    items: ['10 letters', 'Save $10 vs single', 'All letter features', 'Never expires'],
    featured: false,
  },
  {
    name: 'BootMail Pro',
    price: '$19.99',
    period: 'per month',
    items: ['12 letters/month', '6 photos per letter', 'Free weekly newsletter', '15% off care packages', 'Milestone notifications', 'Priority processing'],
    featured: true,
    badge: 'Most Popular',
  },
  {
    name: 'Family Plan',
    price: '$29.99',
    period: 'per month',
    items: ['Everything in Pro', '4 family senders', '1 free care package/cycle', 'Graduation book included', 'Unlimited signing'],
    featured: false,
  },
]

const VS = [
  ['Letter price', '~$4–$5', '$1.99–$2.99'],
  ['Subscription', '$59.99/mo', '$19.99/mo'],
  ['Photos per letter', '1–4', 'Up to 6'],
  ['Care packages', '❌ None', '✅ Multiple tiers'],
  ['Branded gear', '❌ None', '✅ Full store'],
  ['Multi-sender book', '❌ One account', '✅ Whole family'],
  ['Community signing', '❌ Doesn\'t exist', '✅ Core feature'],
  ['Custom book cover', '❌ None', '✅ Your own photo'],
  ['Live book preview', '❌ Surprise', '✅ Page-by-page'],
]

export default function LandingPage() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [branch, setBranch] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleWaitlist(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, branch }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.error === 'already_on_list') {
          setError("You're already on the list!")
        } else {
          setError('Something went wrong. Try again.')
        }
      } else {
        setSuccess(true)
      }
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: '#f5f0e8' }}>

      {/* ─── NAV ─── */}
      <nav style={{ background: '#1a1a16' }} className="sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
          <a href="#" className="font-display text-2xl tracking-widest text-white">
            BOOT<span style={{ color: '#d4a017' }}>MAIL</span>
          </a>
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(l => (
              <a key={l.label} href={l.href}
                className="font-mono text-xs tracking-widest uppercase px-4 py-4 text-gray-400 hover:text-white transition-colors">
                {l.label}
              </a>
            ))}
            <a href="/auth/login"
              className="ml-4 font-mono text-xs tracking-widest uppercase px-5 py-2 text-gray-300 border border-gray-700 hover:border-gray-500 transition-colors">
              Sign In
            </a>
            <a href="#waitlist"
              className="ml-2 font-mono text-xs tracking-widest uppercase px-5 py-2 text-black transition-colors"
              style={{ background: '#d4a017' }}>
              Join Waitlist
            </a>
          </div>
          <button className="md:hidden text-white" onClick={() => setMenuOpen(!menuOpen)}>
            <div className="space-y-1.5">
              <span className="block w-6 h-0.5 bg-white"></span>
              <span className="block w-6 h-0.5 bg-white"></span>
              <span className="block w-6 h-0.5 bg-white"></span>
            </div>
          </button>
        </div>
        {menuOpen && (
          <div style={{ background: '#252520' }} className="md:hidden px-6 pb-4 flex flex-col gap-2">
            {NAV_LINKS.map(l => (
              <a key={l.label} href={l.href} onClick={() => setMenuOpen(false)}
                className="font-mono text-xs tracking-widest uppercase py-2 text-gray-400 border-b border-gray-800">
                {l.label}
              </a>
            ))}
            <a href="/auth/login" onClick={() => setMenuOpen(false)}
              className="font-mono text-xs tracking-widest uppercase py-2 border-b border-gray-800"
              style={{ color: '#d4a017' }}>
              Sign In →
            </a>
            <a href="/auth/signup" onClick={() => setMenuOpen(false)}
              className="font-mono text-xs tracking-widest uppercase py-3 text-black text-center mt-1"
              style={{ background: '#d4a017' }}>
              Create Account
            </a>
          </div>
        )}
      </nav>

      {/* ─── HERO ─── */}
      <section style={{ background: '#1a1a16' }}
        className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 py-24 overflow-hidden bg-grid">

        {/* Subtle background texture */}
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #4a5240 0%, transparent 70%)' }} />

        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="inline-block font-mono text-xs tracking-widest uppercase px-4 py-2 mb-8"
            style={{ border: '1px solid #b8860b', color: '#d4a017' }}>
            Now accepting early access — join the waitlist
          </div>

          <h1 className="font-display text-white mb-6"
            style={{ fontSize: 'clamp(72px, 14vw, 160px)', letterSpacing: '6px', lineHeight: '0.9' }}>
            BOOT<span style={{ color: '#d4a017' }}>MAIL</span>
          </h1>

          <p className="font-body italic text-gray-400 mb-12 max-w-xl mx-auto"
            style={{ fontSize: 'clamp(16px, 2.5vw, 22px)' }}>
            Letters, care packages, and Legacy Books for military families — at half the price of everyone else.
          </p>

          {/* Stats bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px mb-12 max-w-2xl mx-auto"
            style={{ background: 'rgba(255,255,255,0.05)' }}>
            {STATS.map(s => (
              <div key={s.label} className="py-6 px-4" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className="font-display text-4xl mb-1" style={{ color: '#d4a017' }}>{s.num}</div>
                <div className="font-mono text-xs tracking-widest uppercase" style={{ color: '#c8b89a' }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="#waitlist"
              className="font-mono text-sm tracking-widest uppercase px-8 py-4 text-black transition-all hover:-translate-y-0.5"
              style={{ background: '#d4a017' }}>
              Join the Waitlist →
            </a>
            <a href="#features"
              className="font-mono text-sm tracking-widest uppercase px-8 py-4 text-gray-300 border border-gray-700 hover:border-gray-500 transition-all">
              See Features
            </a>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 font-mono text-xs tracking-widest uppercase text-gray-600 animate-bounce">
          ↓ Scroll
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" className="py-24 px-6 max-w-6xl mx-auto">
        <div className="section-tag">Features</div>
        <h2 className="font-display mb-4" style={{ fontSize: 'clamp(36px, 6vw, 72px)' }}>
          Everything Military<br />Families Need
        </h2>
        <p className="font-body text-gray-600 max-w-xl mb-16">
          Sandboxx does one thing. BootMail does everything — and charges half the price.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0.5">
          {FEATURES.map(f => (
            <div key={f.title}
              className="bg-white p-8 border-t-4 border-tan hover:border-olive transition-all duration-200 group relative overflow-hidden">
              <div className="absolute top-4 right-4 text-4xl opacity-10 group-hover:opacity-20 transition-opacity">
                {f.icon}
              </div>
              <span className={`inline-block font-mono text-xs tracking-widest uppercase px-2 py-1 mb-4 ${f.tagColor}`}>
                {f.tag}
              </span>
              <h3 className="font-display text-xl tracking-wider mb-3" style={{ color: '#1a1a16' }}>
                {f.title}
              </h3>
              <p className="font-body text-sm text-gray-600 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── LETTERS ─── */}
      <section id="letters" style={{ background: '#1a1a16' }} className="py-24 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="font-mono text-xs tracking-widest uppercase mb-3" style={{ color: '#d4a017' }}>
              01 · Letters
            </div>
            <h2 className="font-display text-white mb-6" style={{ fontSize: 'clamp(36px, 5vw, 64px)' }}>
              Write Once.<br />We Handle<br />The Rest.
            </h2>
            <p className="font-body text-gray-400 mb-8 leading-relaxed">
              Compose your letter on your phone or laptop. Add up to 6 photos.
              We print it on quality paper, seal it in a branch-specific envelope,
              and mail it via USPS — same day if submitted before 2 PM ET.
            </p>
            <div className="space-y-3 mb-8">
              {['Up to 6,000 characters', 'Up to 6 color photos', 'USPS tracking included', 'Branch stationery + return envelope', 'Add gift cards or newsletter', 'Letters saved to your account forever'].map(item => (
                <div key={item} className="flex items-center gap-3 font-mono text-sm text-gray-400">
                  <span style={{ color: '#d4a017' }}>→</span> {item}
                </div>
              ))}
            </div>
            <div className="font-display text-5xl" style={{ color: '#d4a017' }}>
              $1.99
              <span className="font-mono text-sm text-gray-500 ml-2">per letter at volume</span>
            </div>
          </div>

          {/* Letter mockup */}
          <div className="relative">
            <div className="bg-white p-8 shadow-2xl transform rotate-1">
              <div className="font-mono text-xs tracking-widest uppercase text-gray-400 mb-4 pb-4 border-b border-gray-100">
                BootMail · Letter Preview
              </div>
              <div className="font-body text-sm text-gray-700 leading-relaxed mb-6">
                <p className="mb-3">Marcus,</p>
                <p className="mb-3">We are so incredibly proud of you. Every single day we think about how far you've come from that kid who used to...</p>
                <p className="text-gray-400 italic text-xs">...continues for 5,847 more characters</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="aspect-square rounded" style={{ background: '#e8ddd0' }} />
                ))}
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 bg-white p-4 shadow-xl">
              <div className="font-mono text-xs text-gray-500 mb-1">Status</div>
              <div className="font-display text-lg" style={{ color: '#4a5240' }}>● In Transit</div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CARE PACKAGES ─── */}
      <section id="packages" className="py-24 px-6 max-w-6xl mx-auto">
        <div className="section-tag">Care Packages</div>
        <h2 className="font-display mb-4" style={{ fontSize: 'clamp(36px, 6vw, 72px)' }}>
          The Feature<br />Nobody Else Has
        </h2>
        <p className="font-body text-gray-600 max-w-xl mb-16">
          Sandboxx sends letters. We send hugs. Real, physical care packages
          fulfilled and shipped directly from us to your recruit.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0.5 mb-12">
          {[
            { name: 'The Essentials', price: '$24.99', desc: 'Hygiene, stationery, stamps, socks. 100% drill-sergeant approved.', badge: 'Basic Training Safe', badgeColor: 'bg-olive/10 text-olive' },
            { name: 'The Boost', price: '$34.99', desc: 'Protein bars, instant coffee, snacks, charging cable. For AIT and beyond.', badge: 'AIT / Post-Training', badgeColor: 'bg-gold/10 text-gold-dark' },
            { name: 'The Comfort', price: '$39.99', desc: 'Comfort items, photos printed, personal letter included from family.', badge: 'Popular', badgeColor: 'bg-olive/10 text-olive' },
            { name: 'The Full Send', price: '$59.99', desc: 'Everything — snacks, hygiene, gear, and a BootMail branded t-shirt.', badge: 'Best Value', badgeColor: 'bg-gold/10 text-gold-dark' },
          ].map(box => (
            <div key={box.name} className="bg-white p-6">
              <span className={`inline-block font-mono text-xs tracking-widest uppercase px-2 py-1 mb-4 ${box.badgeColor}`}>
                {box.badge}
              </span>
              <h3 className="font-display text-2xl mb-2 tracking-wider">{box.name}</h3>
              <p className="font-body text-sm text-gray-600 mb-4 leading-relaxed">{box.desc}</p>
              <div className="font-display text-3xl" style={{ color: '#4a5240' }}>{box.price}</div>
            </div>
          ))}
        </div>

        <div className="bg-white p-6 border-l-4" style={{ borderColor: '#d4a017' }}>
          <span className="font-mono text-xs tracking-widest uppercase" style={{ color: '#d4a017' }}>
            ⚠ Important
          </span>
          <p className="font-body text-sm text-gray-600 mt-2">
            Care packages to active basic training are unit-specific and branch-restricted.
            Our app automatically shows only what's allowed based on your recruit's branch and training phase.
            The Essentials box is 100% drill-sergeant approved for all branches.
          </p>
        </div>
      </section>

      {/* ─── LEGACY BOOK ─── */}
      <section id="book" style={{ background: '#1a1a16' }} className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="font-mono text-xs tracking-widest uppercase mb-3" style={{ color: '#d4a017' }}>
            03 · Legacy Book
          </div>
          <h2 className="font-display text-white mb-6" style={{ fontSize: 'clamp(36px, 5vw, 64px)' }}>
            The People<br />In Your Corner
          </h2>
          <p className="font-body text-gray-400 max-w-xl mb-16 leading-relaxed">
            Every letter ever sent, compiled into a hardcover keepsake.
            But the real magic? Share a link and let everyone who loves your recruit
            sign it with a personal message and handwriting font — no app needed.
            It ships by graduation day.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0.5 mb-12">
            {[
              { step: '01', title: 'Auto-Builds Day 1', desc: 'The moment your first letter sends, we start building the book in the background. Nothing to manage.' },
              { step: '02', title: 'Share the Signing Link', desc: 'bootmail.app/sign/recruit-name. Anyone can sign — grandparents, coaches, whole Facebook groups. 90 seconds, no account needed.' },
              { step: '03', title: 'Arrives by Graduation', desc: 'Preview every page before printing. Approve signatures. Order. Hardcover book ships to arrive graduation weekend.' },
            ].map(s => (
              <div key={s.step} className="p-8" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="font-display text-6xl mb-4" style={{ color: 'rgba(212,160,23,0.3)' }}>{s.step}</div>
                <h3 className="font-display text-xl text-white mb-3 tracking-wider">{s.title}</h3>
                <p className="font-body text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-0.5">
            {[
              { tier: 'Basic', price: '$29.99', note: 'vs $39.99 Sandboxx' },
              { tier: 'Legacy', price: '$44.99', note: 'Custom cover + 25 signers' },
              { tier: 'Family', price: '$54.99', note: 'Multi-sender merge' },
              { tier: 'Full Story', price: '$64.99', note: 'Unlimited signers' },
              { tier: 'Deluxe Box', price: '$89.99', note: '+ Challenge coin + gift box' },
            ].map(t => (
              <div key={t.tier} className="p-6 text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="font-display text-3xl mb-1" style={{ color: '#d4a017' }}>{t.price}</div>
                <div className="font-mono text-xs text-white tracking-wider uppercase mb-1">{t.tier}</div>
                <div className="font-mono text-xs text-gray-600">{t.note}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── VS SANDBOXX ─── */}
      <section className="py-24 px-6 max-w-6xl mx-auto">
        <div className="section-tag">Comparison</div>
        <h2 className="font-display mb-16" style={{ fontSize: 'clamp(36px, 6vw, 72px)' }}>
          BootMail vs Sandboxx
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left font-mono text-xs tracking-widest uppercase text-gray-500 pb-4 pr-8">Feature</th>
                <th className="text-left font-mono text-xs tracking-widest uppercase text-gray-500 pb-4 pr-8">Sandboxx</th>
                <th className="text-left font-mono text-xs tracking-widest uppercase pb-4" style={{ color: '#4a5240' }}>BootMail</th>
              </tr>
            </thead>
            <tbody>
              {VS.map(([feature, them, us]) => (
                <tr key={feature} className="border-t border-tan/50 hover:bg-white transition-colors">
                  <td className="py-4 pr-8 font-body text-sm font-bold text-gray-800">{feature}</td>
                  <td className="py-4 pr-8 font-body text-sm text-gray-400">{them}</td>
                  <td className="py-4 font-body text-sm font-semibold" style={{ color: '#4a5240' }}>{us}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section id="pricing" style={{ background: '#f0ebe2' }} className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="section-tag">Pricing</div>
          <h2 className="font-display mb-4" style={{ fontSize: 'clamp(36px, 6vw, 72px)' }}>
            Simple, Honest Pricing
          </h2>
          <p className="font-body text-gray-600 max-w-xl mb-16">
            No hidden fees. No tricks. Half the price of Sandboxx+ — with more features.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0.5">
            {PRICING.map(plan => (
              <div key={plan.name}
                className={`p-8 relative ${plan.featured ? '' : 'bg-white'}`}
                style={plan.featured ? { background: '#4a5240' } : {}}>
                {plan.badge && (
                  <div className="absolute -top-px left-0 right-0 h-1" style={{ background: '#d4a017' }} />
                )}
                {plan.badge && (
                  <div className="font-mono text-xs tracking-widest uppercase px-3 py-1 mb-4 inline-block"
                    style={{ background: '#d4a017', color: '#1a1a16' }}>
                    {plan.badge}
                  </div>
                )}
                <div className={`font-mono text-xs tracking-widest uppercase mb-3 ${plan.featured ? 'text-tan' : 'text-gray-500'}`}>
                  {plan.name}
                </div>
                <div className={`font-display text-5xl mb-1 ${plan.featured ? 'text-white' : ''}`}>
                  {plan.price}
                </div>
                <div className={`font-mono text-xs mb-6 ${plan.featured ? 'text-tan' : 'text-gray-500'}`}>
                  {plan.period}
                </div>
                <ul className="space-y-3">
                  {plan.items.map(item => (
                    <li key={item}
                      className={`flex items-start gap-2 font-body text-sm ${plan.featured ? 'text-tan-light' : 'text-gray-600'}`}>
                      <span style={{ color: plan.featured ? '#d4a017' : '#4a5240' }} className="mt-0.5 flex-shrink-0">→</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WAITLIST ─── */}
      <section id="waitlist" style={{ background: '#1a1a16' }} className="py-24 px-6 bg-grid">
        <div className="max-w-xl mx-auto text-center">
          <div className="font-mono text-xs tracking-widest uppercase mb-4" style={{ color: '#d4a017' }}>
            Early Access
          </div>
          <h2 className="font-display text-white mb-4" style={{ fontSize: 'clamp(36px, 6vw, 64px)' }}>
            Join the Waitlist
          </h2>
          <p className="font-body text-gray-400 mb-12">
            Be first to send a letter when we launch. Early access members get
            <strong className="text-white"> 5 free letters</strong> and locked-in founding member pricing.
          </p>

          {success ? (
            <div className="p-8" style={{ background: 'rgba(74,82,64,0.3)', border: '1px solid rgba(74,82,64,0.5)' }}>
              <div className="text-4xl mb-4">🎖️</div>
              <div className="font-display text-3xl text-white mb-2">You're In.</div>
              <p className="font-body text-gray-400 text-sm">
                We'll email you when BootMail launches. Your 5 free letters are waiting.
              </p>
            </div>
          ) : success ? (
            <div style={{ background: 'rgba(74,82,64,0.2)', border: '1px solid rgba(74,82,64,0.4)' }} className="p-8 text-center">
              <div className="text-4xl mb-4">🎖️</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: '#ffffff', letterSpacing: '3px' }} className="mb-2">
                You&apos;re In.
              </div>
              <p style={{ fontFamily: 'var(--font-body)', color: '#c8b89a', fontSize: '14px' }} className="mb-6">
                Check your email for your welcome letter. 5 free credits are waiting.
              </p>
              <div className="flex flex-col gap-3">
                <a href="/auth/signup"
                  style={{ background: '#d4a017', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '3px' }}
                  className="block px-8 py-4 text-black uppercase hover:opacity-90 transition-opacity">
                  Create Your Account →
                </a>
                <a href="/auth/login"
                  style={{ border: '1px solid rgba(255,255,255,0.15)', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '3px', color: '#6b7560' }}
                  className="block px-8 py-3 uppercase hover:text-white transition-colors">
                  Already have an account? Sign In
                </a>
              </div>
            </div>
          ) : (
            <form onSubmit={handleWaitlist} className="space-y-3 text-left">
              <div>
                <label className="font-mono text-xs tracking-widest uppercase text-gray-500 block mb-2">
                  Your Name (optional)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Sarah Johnson"
                  className="w-full px-4 py-3 font-body text-sm bg-white/5 border text-white placeholder-gray-600 focus:outline-none focus:border-gold transition-colors"
                  style={{ borderColor: 'rgba(255,255,255,0.1)' }}
                />
              </div>
              <div>
                <label className="font-mono text-xs tracking-widest uppercase text-gray-500 block mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="sarah@example.com"
                  className="w-full px-4 py-3 font-body text-sm bg-white/5 border text-white placeholder-gray-600 focus:outline-none focus:border-gold transition-colors"
                  style={{ borderColor: 'rgba(255,255,255,0.1)' }}
                />
              </div>
              <div>
                <label className="font-mono text-xs tracking-widest uppercase text-gray-500 block mb-2">
                  Recruit's Branch (optional)
                </label>
                <select
                  value={branch}
                  onChange={e => setBranch(e.target.value)}
                  className="w-full px-4 py-3 font-body text-sm bg-white/5 border text-gray-400 focus:outline-none focus:border-gold transition-colors appearance-none"
                  style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                  <option value="">Select branch...</option>
                  <option value="army">🪖 Army</option>
                  <option value="marines">🦅 Marines</option>
                  <option value="navy">⚓ Navy</option>
                  <option value="airforce">✈️ Air Force</option>
                  <option value="coastguard">🚢 Coast Guard</option>
                  <option value="spaceforce">🚀 Space Force</option>
                </select>
              </div>

              {error && (
                <p className="font-mono text-xs text-yellow-400">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 font-mono text-sm tracking-widest uppercase text-black transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: '#d4a017' }}>
                {loading ? 'Saving...' : 'Join the Waitlist — 5 Free Letters →'}
              </button>

              <p className="font-mono text-xs text-gray-600 text-center">
                No spam. No credit card. Just early access.
              </p>
            </form>
          )}
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{ background: '#4a5240' }} className="py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="font-display text-3xl text-white tracking-widest mb-1">
              BOOT<span style={{ color: '#d4a017' }}>MAIL</span>
            </div>
            <div className="font-mono text-xs text-gray-400 tracking-widest uppercase">
              More Than Mail. It's Morale.
            </div>
          </div>
          <div className="flex gap-6">
            {['Privacy', 'Terms', 'Contact'].map(l => (
              <a key={l} href="#"
                className="font-mono text-xs tracking-widest uppercase text-gray-400 hover:text-white transition-colors">
                {l}
              </a>
            ))}
          </div>
          <div className="font-mono text-xs text-gray-500">
            © 2026 BootMail · bootmail.app
          </div>
        </div>
      </footer>

    </div>
  )
}
