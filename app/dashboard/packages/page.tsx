'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

const CATEGORY_LABELS: Record<string, string> = {
  all:        'All Items',
  bct:        'BCT Approved',
  hygiene:    'Hygiene',
  food:       'Food & Snacks',
  clothing:   'Clothing',
  comfort:    'Comfort',
  health:     'Health',
  stationery: 'Stationery',
  tech:       'Tech',
}

const CATEGORY_ICONS: Record<string, string> = {
  bct:        '🪖',
  hygiene:    '🧴',
  food:       '🍫',
  clothing:   '👕',
  comfort:    '🛏️',
  health:     '💊',
  stationery: '✏️',
  tech:       '📱',
}

type CartItem = { product: any; qty: number }

export default function PackagesPage() {
  const searchParams = useSearchParams()
  const preselectedRecruit = searchParams.get('recruit')

  const [user, setUser] = useState<any>(null)
  const [recruits, setRecruits] = useState<any[]>([])
  const [selectedRecruit, setSelectedRecruit] = useState<string>('')
  const [products, setProducts] = useState<any[]>([])
  const [category, setCategory] = useState('all')
  const [cart, setCart] = useState<CartItem[]>([])
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [view, setView] = useState<'shop'|'cart'|'confirm'>('shop')
  const [credits, setCredits] = useState(0)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/auth/login'; return }
      setUser(session.user)

      const [{ data: r }, { data: p }, { data: prods }] = await Promise.all([
        supabase.from('recruits').select('*').eq('owner_id', session.user.id).order('created_at', { ascending: false }),
        supabase.from('profiles').select('letter_credits').eq('id', session.user.id).single(),
        supabase.from('products').select('*').eq('is_active', true).order('category').order('price'),
      ])

      setRecruits(r ?? [])
      setCredits(p?.letter_credits ?? 0)
      setProducts(prods ?? [])
      if (preselectedRecruit) setSelectedRecruit(preselectedRecruit)
      else if (r && r.length === 1) setSelectedRecruit(r[0].id)
      setLoading(false)
    }
    load()
  }, [preselectedRecruit])

  function addToCart(product: any) {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id)
      if (existing) return prev.map(i => i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { product, qty: 1 }]
    })
  }

  function removeFromCart(productId: string) {
    setCart(prev => prev.filter(i => i.product.id !== productId))
  }

  function updateQty(productId: string, qty: number) {
    if (qty <= 0) { removeFromCart(productId); return }
    setCart(prev => prev.map(i => i.product.id === productId ? { ...i, qty } : i))
  }

  function getQty(productId: string) {
    return cart.find(i => i.product.id === productId)?.qty ?? 0
  }

  const subtotal = cart.reduce((sum, i) => sum + parseFloat(i.product.price) * i.qty, 0)
  const shipping = subtotal > 0 ? 9.99 : 0
  const total = subtotal + shipping
  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0)

  const filtered = category === 'all' 
    ? products 
    : category === 'bct' 
    ? products.filter(p => p.drill_sergeant_approved) 
    : products.filter(p => p.category === category)
  const categories = ['all', 'bct', ...Array.from(new Set(products.map(p => p.category)))]
  const recruit = recruits.find(r => r.id === selectedRecruit)

  async function handleCheckout() {
    if (!selectedRecruit) { setError('Please select a recruit'); return }
    if (cart.length === 0) { setError('Your cart is empty'); return }
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'package',
          recruitId: selectedRecruit,
          items: cart.map(i => ({ productId: i.product.id, qty: i.qty, name: i.product.name, price: i.product.price })),
          note,
          total: total.toFixed(2),
          subtotal: subtotal.toFixed(2),
          shipping: shipping.toFixed(2),
        }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error ?? 'Checkout failed')
        setSubmitting(false)
      }
    } catch (err: any) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  const mono = { fontFamily: 'var(--font-mono)' } as React.CSSProperties
  const sans = { fontFamily: 'var(--font-display)' } as React.CSSProperties
  const serif = { fontFamily: 'var(--font-body)' } as React.CSSProperties
  const inp = { background: '#ffffff', border: '1px solid #c8b89a', color: '#1a1a16', width: '100%', padding: '12px 16px', fontSize: '14px', outline: 'none' }

  if (loading) return <div style={{ ...mono, fontSize: '11px', color: '#6b7560' }} className="uppercase tracking-widest">Loading...</div>

  // ── CART VIEW ──────────────────────────────────────────
  if (view === 'cart') {
    return (
      <div className="max-w-2xl">
        <div className="mb-8">
          <button onClick={() => setView('shop')}
            style={{ ...mono, fontSize: '10px', letterSpacing: '2px', color: '#6b7560', background: 'none', border: 'none', cursor: 'pointer' }}
            className="uppercase mb-4 block">← Keep Shopping</button>
          <h1 style={{ ...sans, fontSize: '48px', letterSpacing: '3px', color: '#1a1a16' }}>Your Cart</h1>
        </div>

        {cart.length === 0 ? (
          <div style={{ background: '#ffffff', padding: '48px', textAlign: 'center' }}>
            <div className="text-4xl mb-4">📦</div>
            <p style={{ ...mono, fontSize: '11px', color: '#6b7560' }} className="uppercase tracking-wider">Cart is empty</p>
            <button onClick={() => setView('shop')}
              style={{ background: '#d4a017', ...mono, fontSize: '11px', letterSpacing: '3px', border: 'none', cursor: 'pointer', padding: '12px 24px', marginTop: '16px', color: '#000' }}
              className="uppercase">Browse Items →</button>
          </div>
        ) : (
          <div className="space-y-2">
            {cart.map(item => (
              <div key={item.product.id} style={{ background: '#ffffff', padding: '16px 20px' }} className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div style={{ ...sans, fontSize: '20px', letterSpacing: '1px', color: '#1a1a16' }}>{item.product.name}</div>
                  <div style={{ ...serif, fontSize: '14px', color: '#6b7560', fontStyle: 'italic', marginTop: '4px' }}>{item.product.description}</div>
                  {item.product.drill_sergeant_approved && (
                    <div style={{ ...mono, fontSize: '9px', color: '#4a5240', letterSpacing: '1px', marginTop: '4px' }} className="uppercase">✓ BCT approved</div>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQty(item.product.id, item.qty - 1)}
                      style={{ width: '28px', height: '28px', border: '1px solid #c8b89a', background: '#fff', cursor: 'pointer', ...mono, fontSize: '14px' }}>−</button>
                    <span style={{ ...mono, fontSize: '13px', color: '#1a1a16', minWidth: '20px', textAlign: 'center' }}>{item.qty}</span>
                    <button onClick={() => updateQty(item.product.id, item.qty + 1)}
                      style={{ width: '28px', height: '28px', border: '1px solid #c8b89a', background: '#fff', cursor: 'pointer', ...mono, fontSize: '14px' }}>+</button>
                  </div>
                  <div style={{ ...sans, fontSize: '18px', fontWeight: 900, color: '#1a1a16', minWidth: '56px', textAlign: 'right' }}>
                    ${(parseFloat(item.product.price) * item.qty).toFixed(2)}
                  </div>
                  <button onClick={() => removeFromCart(item.product.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c8b89a', fontSize: '18px' }}>×</button>
                </div>
              </div>
            ))}

            {/* Totals */}
            <div style={{ background: '#ffffff', padding: '20px' }}>
              <div className="flex justify-between py-2" style={{ borderBottom: '1px solid #e8ddd0' }}>
                <span style={{ ...mono, fontSize: '11px', color: '#6b7560', textTransform: 'uppercase' as const }}>Subtotal</span>
                <span style={{ ...mono, fontSize: '13px', color: '#1a1a16' }}>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2" style={{ borderBottom: '1px solid #e8ddd0' }}>
                <span style={{ ...mono, fontSize: '11px', color: '#6b7560', textTransform: 'uppercase' as const }}>Shipping to base</span>
                <span style={{ ...mono, fontSize: '13px', color: '#1a1a16' }}>${shipping.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-3">
                <span style={{ ...sans, fontSize: '20px', fontWeight: 900, color: '#1a1a16' }}>Total</span>
                <span style={{ ...sans, fontSize: '24px', fontWeight: 900, color: '#d4a017' }}>${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Recruit selector */}
            {recruits.length > 1 && (
              <div style={{ background: '#ffffff', padding: '20px' }}>
                <div style={{ ...mono, fontSize: '10px', letterSpacing: '3px', color: '#6b7560', textTransform: 'uppercase' as const, marginBottom: '12px' }}>Ship To</div>
                <div className="space-y-2">
                  {recruits.map(r => (
                    <button key={r.id} onClick={() => setSelectedRecruit(r.id)} type="button"
                      style={{ width: '100%', padding: '12px 16px', textAlign: 'left', cursor: 'pointer', border: selectedRecruit === r.id ? '2px solid #4a5240' : '1px solid #c8b89a', background: selectedRecruit === r.id ? '#f8f5f0' : '#fff', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ ...sans, fontSize: '16px', color: '#1a1a16' }}>{r.full_name}</span>
                      <span style={{ ...mono, fontSize: '10px', color: '#6b7560', textTransform: 'uppercase' as const }}>{r.branch}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Personal note */}
            <div style={{ background: '#ffffff', padding: '20px' }}>
              <div style={{ ...mono, fontSize: '10px', letterSpacing: '3px', color: '#6b7560', textTransform: 'uppercase' as const, marginBottom: '8px' }}>Personal Note (optional)</div>
              <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} placeholder="We're thinking of you every day..."
                style={{ ...inp, resize: 'vertical', fontFamily: 'Georgia, serif', fontSize: '14px' }} />
            </div>

            {error && <div style={{ background: 'rgba(192,57,43,0.1)', border: '1px solid rgba(192,57,43,0.3)', padding: '12px 16px' }}>
              <p style={{ ...mono, fontSize: '11px', color: '#e74c3c' }}>{error}</p>
            </div>}

            <button onClick={handleCheckout} disabled={submitting || !selectedRecruit}
              style={{ background: '#d4a017', ...mono, fontSize: '12px', letterSpacing: '3px', width: '100%', padding: '18px', border: 'none', cursor: 'pointer', color: '#000' }}
              className="uppercase hover:opacity-90 disabled:opacity-40">
              {submitting ? 'Redirecting...' : `Checkout — $${total.toFixed(2)} →`}
            </button>
            <p style={{ ...mono, fontSize: '9px', color: '#bbb', textAlign: 'center', textTransform: 'uppercase' as const }}>
              Secure checkout via Stripe · Ships within 2 business days
            </p>
          </div>
        )}
      </div>
    )
  }

  // ── SHOP VIEW ──────────────────────────────────────────
  return (
    <div>
      <div className="flex items-end justify-between mb-8">
        <div>
          <div style={{ ...mono, fontSize: '10px', letterSpacing: '4px', color: '#6b7560', textTransform: 'uppercase' as const }} className="mb-2">Care Packages</div>
          <h1 style={{ ...sans, fontSize: '48px', letterSpacing: '3px', color: '#1a1a16' }}>The Store</h1>
          <p style={{ ...serif, fontStyle: 'italic', color: '#6b7560', fontSize: '16px' }} className="mt-2">
            Everything approved for basic training. Ships direct to base.
          </p>
        </div>
        <button onClick={() => setView('cart')}
          style={{ background: cartCount > 0 ? '#4a5240' : '#e8ddd0', ...mono, fontSize: '11px', letterSpacing: '2px', border: 'none', cursor: 'pointer', padding: '12px 20px', color: cartCount > 0 ? '#fff' : '#6b7560', position: 'relative' }}
          className="uppercase">
          Cart {cartCount > 0 ? `(${cartCount})` : ''}
          {cartCount > 0 && <span style={{ ...sans, fontSize: '13px', fontWeight: 900, color: '#d4a017', marginLeft: '8px' }}>${subtotal.toFixed(2)}</span>}
        </button>
      </div>

      {/* Phase warning for BCT */}
      <div style={{ background: 'rgba(212,160,23,0.08)', border: '1px solid rgba(212,160,23,0.2)', padding: '12px 16px', marginBottom: '24px' }}>
        <p style={{ ...mono, fontSize: '12px', color: '#d4a017', textTransform: 'uppercase' as const, letterSpacing: '1px' }}>
          🪖 BCT Note — Items marked "BCT approved" are permitted during basic training. Food & tech items are for AIT and beyond.
        </p>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {categories.map(cat => (
          <button key={cat} onClick={() => setCategory(cat)}
            style={{ ...mono, fontSize: '12px', letterSpacing: '2px', padding: '10px 18px', border: 'none', cursor: 'pointer', textTransform: 'uppercase' as const, background: category === cat ? '#4a5240' : '#e8ddd0', color: category === cat ? '#fff' : '#6b7560' }}>
            {CATEGORY_ICONS[cat] ?? ''} {CATEGORY_LABELS[cat] ?? cat}
          </button>
        ))}
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-0.5">
        {filtered.map(product => {
          const qty = getQty(product.id)
          return (
            <div key={product.id} style={{ background: '#ffffff', padding: '20px' }}>
              {/* Product illustration */}
              <div style={{ width: '100%', height: '120px', marginBottom: '12px', overflow: 'hidden', background: '#f5f0e8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img 
                  src={'/product-illustrations/' + product.category + '.svg'}
                  alt={product.category}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              </div>

              {/* Approved badge */}
              {product.drill_sergeant_approved && (
                <div style={{ ...mono, fontSize: '10px', letterSpacing: '2px', color: '#4a5240', background: 'rgba(74,82,64,0.1)', padding: '3px 10px', display: 'inline-block', marginBottom: '10px', textTransform: 'uppercase' as const }}>
                  ✓ BCT Approved
                </div>
              )}

              <div style={{ ...sans, fontSize: '18px', letterSpacing: '1px', color: '#1a1a16', marginBottom: '6px', lineHeight: 1.3 }}>{product.name}</div>
              <div style={{ ...serif, fontSize: '14px', color: '#6b7560', fontStyle: 'italic', marginBottom: '14px' }}>{product.description}</div>

              <div className="flex items-center justify-between">
                <div style={{ ...sans, fontSize: '20px', fontWeight: 900, color: '#1a1a16' }}>${product.price}</div>

                {qty === 0 ? (
                  <button onClick={() => addToCart(product)}
                    style={{ background: '#4a5240', ...mono, fontSize: '10px', letterSpacing: '2px', border: 'none', cursor: 'pointer', padding: '8px 14px', color: '#fff', textTransform: 'uppercase' as const }}
                    className="hover:opacity-90">
                    Add
                  </button>
                ) : (
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateQty(product.id, qty - 1)}
                      style={{ width: '26px', height: '26px', border: '1px solid #c8b89a', background: '#fff', cursor: 'pointer', ...mono, fontSize: '14px' }}>−</button>
                    <span style={{ ...mono, fontSize: '13px', minWidth: '18px', textAlign: 'center', color: '#1a1a16' }}>{qty}</span>
                    <button onClick={() => updateQty(product.id, qty + 1)}
                      style={{ width: '26px', height: '26px', border: '1px solid #4a5240', background: '#4a5240', cursor: 'pointer', ...mono, fontSize: '14px', color: '#fff' }}>+</button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Sticky cart bar */}
      {cartCount > 0 && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#4a5240', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 50 }}>
          <div>
            <span style={{ ...mono, fontSize: '11px', letterSpacing: '2px', color: '#c8b89a', textTransform: 'uppercase' as const }}>{cartCount} item{cartCount > 1 ? 's' : ''} · </span>
            <span style={{ ...sans, fontSize: '18px', fontWeight: 900, color: '#d4a017' }}>${total.toFixed(2)}</span>
          </div>
          <button onClick={() => setView('cart')}
            style={{ background: '#d4a017', ...mono, fontSize: '12px', letterSpacing: '3px', border: 'none', cursor: 'pointer', padding: '12px 28px', color: '#000', textTransform: 'uppercase' as const }}>
            Review Cart →
          </button>
        </div>
      )}
    </div>
  )
}
