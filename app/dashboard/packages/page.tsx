'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

const CATEGORIES = [
  { id: 'bct',        label: 'BCT Approved',  desc: 'Permitted during basic training', icon: '🪖', color: '#4a5240' },
  { id: 'hygiene',    label: 'Hygiene',        desc: 'Soap, deodorant, razors & more', icon: '🧴', color: '#6b7560' },
  { id: 'food',       label: 'Food & Snacks',  desc: 'Protein bars, jerky, coffee',    icon: '🍫', color: '#b8860b' },
  { id: 'clothing',   label: 'Clothing',       desc: 'Socks, underwear, insoles',      icon: '👕', color: '#4a5240' },
  { id: 'comfort',    label: 'Comfort',        desc: 'Locks, moleskin, sewing kit',    icon: '🛏️', color: '#6b7560' },
  { id: 'health',     label: 'Health',         desc: 'Bandages, Icy Hot, cough drops', icon: '💊', color: '#8e4444' },
  { id: 'stationery', label: 'Stationery',     desc: 'Pens, stamps, notebooks',        icon: '✏️', color: '#4a5240' },
  { id: 'tech',       label: 'Tech',           desc: 'Cables, phone stand (AIT+)',     icon: '📱', color: '#2a4a6b' },
]

type View = 'categories' | 'products' | 'cart'
type CartItem = { product: any; qty: number }

export default function PackagesPage() {
  const searchParams = useSearchParams()
  const preselectedRecruit = searchParams.get('recruit')

  const [user, setUser] = useState<any>(null)
  const [recruits, setRecruits] = useState<any[]>([])
  const [selectedRecruit, setSelectedRecruit] = useState<string>('')
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<View>('categories')
  const [activeCategory, setActiveCategory] = useState<string>('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/auth/login'; return }
      setUser(session.user)
      const [{ data: r }, { data: prods }] = await Promise.all([
        supabase.from('recruits').select('*').eq('owner_id', session.user.id).order('created_at', { ascending: false }),
        supabase.from('products').select('*').eq('is_active', true).order('price'),
      ])
      setRecruits(r ?? [])
      setProducts(prods ?? [])
      if (preselectedRecruit) setSelectedRecruit(preselectedRecruit)
      else if (r && r.length === 1) setSelectedRecruit(r[0].id)
      setLoading(false)
    }
    load()
  }, [preselectedRecruit])

  function openCategory(catId: string) {
    setActiveCategory(catId)
    setView('products')
  }

  function addToCart(product: any) {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id)
      if (existing) return prev.map(i => i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { product, qty: 1 }]
    })
  }

  function removeFromCart(id: string) {
    setCart(prev => prev.filter(i => i.product.id !== id))
  }

  function updateQty(id: string, qty: number) {
    if (qty <= 0) { removeFromCart(id); return }
    setCart(prev => prev.map(i => i.product.id === id ? { ...i, qty } : i))
  }

  function getQty(id: string) {
    return cart.find(i => i.product.id === id)?.qty ?? 0
  }

  const subtotal = cart.reduce((sum, i) => sum + parseFloat(i.product.price) * i.qty, 0)
  const shipping = subtotal > 0 ? 9.99 : 0
  const total = subtotal + shipping
  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0)

  const filteredProducts = activeCategory === 'bct'
    ? products.filter(p => p.drill_sergeant_approved)
    : products.filter(p => p.category === activeCategory)

  const activeCat = CATEGORIES.find(c => c.id === activeCategory)
  const recruit = recruits.find(r => r.id === selectedRecruit)

  const mono = { fontFamily: 'var(--font-mono)' } as React.CSSProperties
  const sans = { fontFamily: 'var(--font-display)' } as React.CSSProperties
  const serif = { fontFamily: 'var(--font-body)' } as React.CSSProperties
  const inp = { background: '#ffffff', border: '1px solid #c8b89a', color: '#1a1a16', width: '100%', padding: '12px 16px', fontSize: '14px', outline: 'none' }

  if (loading) return <div style={{ ...mono, fontSize: '11px', color: '#6b7560' }} className="uppercase tracking-widest">Loading...</div>

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
      if (data.url) window.location.href = data.url
      else { setError(data.error ?? 'Checkout failed'); setSubmitting(false) }
    } catch (err: any) {
      setError(err.message); setSubmitting(false)
    }
  }

  // ── CART ────────────────────────────────────────────────
  if (view === 'cart') {
    return (
      <div className="max-w-2xl">
        <div className="mb-8">
          <button onClick={() => setView(activeCategory ? 'products' : 'categories')}
            style={{ ...mono, fontSize: '10px', letterSpacing: '2px', color: '#6b7560', background: 'none', border: 'none', cursor: 'pointer' }}
            className="uppercase mb-4 block">← Keep Shopping</button>
          <h1 style={{ ...sans, fontSize: '48px', letterSpacing: '3px', color: '#1a1a16' }}>Your Cart</h1>
        </div>

        {cart.length === 0 ? (
          <div style={{ background: '#ffffff', padding: '48px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>📦</div>
            <p style={{ ...mono, fontSize: '13px', color: '#6b7560' }} className="uppercase tracking-wider">Cart is empty</p>
            <button onClick={() => setView('categories')}
              style={{ background: '#d4a017', ...mono, fontSize: '11px', letterSpacing: '3px', border: 'none', cursor: 'pointer', padding: '12px 24px', marginTop: '16px', color: '#000' }}
              className="uppercase">Browse Categories →</button>
          </div>
        ) : (
          <div className="space-y-2">
            {cart.map(item => (
              <div key={item.product.id} style={{ background: '#ffffff', padding: '16px 20px' }} className="flex items-center gap-4">
                <div style={{ width: '56px', height: '56px', flexShrink: 0, overflow: 'hidden', background: '#f5f0e8' }}>
                  <img src={'/product-illustrations/' + item.product.category + '.svg'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div className="flex-1">
                  <div style={{ ...sans, fontSize: '18px', letterSpacing: '1px', color: '#1a1a16' }}>{item.product.name}</div>
                  <div style={{ ...serif, fontSize: '13px', color: '#999', fontStyle: 'italic' }}>{item.product.description}</div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => updateQty(item.product.id, item.qty - 1)} style={{ width: '28px', height: '28px', border: '1px solid #c8b89a', background: '#fff', cursor: 'pointer', ...mono, fontSize: '14px' }}>−</button>
                  <span style={{ ...mono, fontSize: '13px', color: '#1a1a16', minWidth: '20px', textAlign: 'center' }}>{item.qty}</span>
                  <button onClick={() => updateQty(item.product.id, item.qty + 1)} style={{ width: '28px', height: '28px', border: '1px solid #c8b89a', background: '#fff', cursor: 'pointer', ...mono, fontSize: '14px' }}>+</button>
                </div>
                <div style={{ ...sans, fontSize: '18px', fontWeight: 900, color: '#1a1a16', minWidth: '56px', textAlign: 'right' }}>
                  ${(parseFloat(item.product.price) * item.qty).toFixed(2)}
                </div>
                <button onClick={() => removeFromCart(item.product.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c8b89a', fontSize: '20px' }}>×</button>
              </div>
            ))}

            <div style={{ background: '#ffffff', padding: '20px' }}>
              {[['Subtotal', `$${subtotal.toFixed(2)}`], ['Shipping to base', `$${shipping.toFixed(2)}`]].map(([label, val]) => (
                <div key={label} className="flex justify-between py-2" style={{ borderBottom: '1px solid #e8ddd0' }}>
                  <span style={{ ...mono, fontSize: '12px', color: '#6b7560', textTransform: 'uppercase' as const }}>{label}</span>
                  <span style={{ ...mono, fontSize: '13px', color: '#1a1a16' }}>{val}</span>
                </div>
              ))}
              <div className="flex justify-between pt-3">
                <span style={{ ...sans, fontSize: '22px', fontWeight: 900, color: '#1a1a16' }}>Total</span>
                <span style={{ ...sans, fontSize: '26px', fontWeight: 900, color: '#d4a017' }}>${total.toFixed(2)}</span>
              </div>
            </div>

            {recruits.length > 1 && (
              <div style={{ background: '#ffffff', padding: '20px' }}>
                <div style={{ ...mono, fontSize: '11px', letterSpacing: '3px', color: '#6b7560', textTransform: 'uppercase' as const, marginBottom: '12px' }}>Ship To</div>
                {recruits.map(r => (
                  <button key={r.id} onClick={() => setSelectedRecruit(r.id)} type="button"
                    style={{ width: '100%', padding: '12px 16px', textAlign: 'left', cursor: 'pointer', marginBottom: '4px', border: selectedRecruit === r.id ? '2px solid #4a5240' : '1px solid #c8b89a', background: selectedRecruit === r.id ? '#f8f5f0' : '#fff', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ ...sans, fontSize: '16px', color: '#1a1a16' }}>{r.full_name}</span>
                    <span style={{ ...mono, fontSize: '10px', color: '#6b7560', textTransform: 'uppercase' as const }}>{r.branch}</span>
                  </button>
                ))}
              </div>
            )}

            <div style={{ background: '#ffffff', padding: '20px' }}>
              <div style={{ ...mono, fontSize: '11px', letterSpacing: '3px', color: '#6b7560', textTransform: 'uppercase' as const, marginBottom: '8px' }}>Personal Note (optional)</div>
              <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
                placeholder="We're so proud of you and thinking of you every day..."
                style={{ ...inp, resize: 'vertical', fontFamily: 'Georgia, serif', fontSize: '14px', lineHeight: '1.7' }} />
            </div>

            {error && <div style={{ background: 'rgba(192,57,43,0.1)', border: '1px solid rgba(192,57,43,0.3)', padding: '12px 16px' }}>
              <p style={{ ...mono, fontSize: '11px', color: '#e74c3c' }}>{error}</p>
            </div>}

            <button onClick={handleCheckout} disabled={submitting || !selectedRecruit}
              style={{ background: '#d4a017', ...mono, fontSize: '13px', letterSpacing: '3px', width: '100%', padding: '18px', border: 'none', cursor: 'pointer', color: '#000' }}
              className="uppercase hover:opacity-90 disabled:opacity-40">
              {submitting ? 'Redirecting...' : `Checkout — $${total.toFixed(2)} →`}
            </button>
            <p style={{ ...mono, fontSize: '10px', color: '#bbb', textAlign: 'center', textTransform: 'uppercase' as const, marginTop: '8px' }}>
              Secure checkout via Stripe · Ships within 2 business days
            </p>
          </div>
        )}
      </div>
    )
  }

  // ── PRODUCTS ────────────────────────────────────────────
  if (view === 'products') {
    return (
      <div>
        <div className="flex items-end justify-between mb-8">
          <div>
            <button onClick={() => setView('categories')}
              style={{ ...mono, fontSize: '10px', letterSpacing: '2px', color: '#6b7560', background: 'none', border: 'none', cursor: 'pointer' }}
              className="uppercase mb-3 block">← All Categories</button>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>{activeCat?.icon}</div>
            <h1 style={{ ...sans, fontSize: '44px', letterSpacing: '3px', color: '#1a1a16' }}>{activeCat?.label}</h1>
            <p style={{ ...serif, fontSize: '15px', color: '#6b7560', fontStyle: 'italic', marginTop: '4px' }}>{activeCat?.desc}</p>
          </div>
          <button onClick={() => setView('cart')}
            style={{ background: cartCount > 0 ? '#4a5240' : '#e8ddd0', ...mono, fontSize: '12px', letterSpacing: '2px', border: 'none', cursor: 'pointer', padding: '12px 20px', color: cartCount > 0 ? '#fff' : '#6b7560' }}
            className="uppercase">
            Cart {cartCount > 0 ? `(${cartCount}) · $${subtotal.toFixed(2)}` : ''}
          </button>
        </div>

        {activeCategory === 'bct' && (
          <div style={{ background: 'rgba(74,82,64,0.1)', border: '1px solid rgba(74,82,64,0.3)', padding: '14px 20px', marginBottom: '24px' }}>
            <p style={{ ...mono, fontSize: '12px', color: '#4a5240', textTransform: 'uppercase' as const, letterSpacing: '1px' }}>
              🪖 These items are approved for use during Basic Combat Training. All others are for AIT and beyond.
            </p>
          </div>
        )}

        {filteredProducts.length === 0 ? (
          <div style={{ background: '#ffffff', padding: '48px', textAlign: 'center' }}>
            <p style={{ ...mono, fontSize: '13px', color: '#6b7560' }} className="uppercase tracking-wider">No items in this category</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-0.5">
            {filteredProducts.map(product => {
              const qty = getQty(product.id)
              return (
                <div key={product.id} style={{ background: '#ffffff' }}>
                  <div style={{ width: '100%', height: '140px', overflow: 'hidden', background: '#f5f0e8' }}>
                    <img src={'/product-illustrations/' + product.category + '.svg'} alt={product.category}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  </div>
                  <div style={{ padding: '16px' }}>
                    {product.drill_sergeant_approved && activeCategory !== 'bct' && (
                      <div style={{ ...mono, fontSize: '10px', letterSpacing: '1px', color: '#4a5240', background: 'rgba(74,82,64,0.1)', padding: '3px 8px', display: 'inline-block', marginBottom: '8px', textTransform: 'uppercase' as const }}>
                        ✓ BCT OK
                      </div>
                    )}
                    <div style={{ ...sans, fontSize: '16px', letterSpacing: '1px', color: '#1a1a16', marginBottom: '4px', lineHeight: 1.3 }}>{product.name}</div>
                    <div style={{ ...serif, fontSize: '13px', color: '#6b7560', fontStyle: 'italic', marginBottom: '14px' }}>{product.description}</div>
                    <div className="flex items-center justify-between">
                      <div style={{ ...sans, fontSize: '24px', fontWeight: 900, color: '#1a1a16' }}>${product.price}</div>
                      {qty === 0 ? (
                        <button onClick={() => addToCart(product)}
                          style={{ background: '#4a5240', ...mono, fontSize: '11px', letterSpacing: '2px', border: 'none', cursor: 'pointer', padding: '8px 16px', color: '#fff', textTransform: 'uppercase' as const }}
                          className="hover:opacity-90">Add</button>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button onClick={() => updateQty(product.id, qty - 1)} style={{ width: '28px', height: '28px', border: '1px solid #c8b89a', background: '#fff', cursor: 'pointer', ...mono, fontSize: '14px' }}>−</button>
                          <span style={{ ...mono, fontSize: '13px', minWidth: '20px', textAlign: 'center', color: '#1a1a16' }}>{qty}</span>
                          <button onClick={() => updateQty(product.id, qty + 1)} style={{ width: '28px', height: '28px', border: '1px solid #4a5240', background: '#4a5240', cursor: 'pointer', ...mono, fontSize: '14px', color: '#fff' }}>+</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {cartCount > 0 && (
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#4a5240', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 50 }}>
            <div>
              <span style={{ ...mono, fontSize: '12px', letterSpacing: '2px', color: '#c8b89a', textTransform: 'uppercase' as const }}>{cartCount} item{cartCount > 1 ? 's' : ''} · </span>
              <span style={{ ...sans, fontSize: '20px', fontWeight: 900, color: '#d4a017' }}>${total.toFixed(2)}</span>
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

  // ── CATEGORIES ──────────────────────────────────────────
  return (
    <div>
      <div className="mb-10">
        <div style={{ ...mono, fontSize: '10px', letterSpacing: '4px', color: '#6b7560', textTransform: 'uppercase' as const }} className="mb-2">Care Packages</div>
        <h1 style={{ ...sans, fontSize: '48px', letterSpacing: '3px', color: '#1a1a16' }}>The Store</h1>
        <p style={{ ...serif, fontStyle: 'italic', color: '#6b7560', fontSize: '16px', marginTop: '8px' }}>
          Everything your recruit needs, shipped direct to base.
        </p>
      </div>

      {recruit && (
        <div style={{ background: '#ffffff', borderTop: '4px solid #4a5240', padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ ...mono, fontSize: '10px', letterSpacing: '2px', color: '#6b7560', textTransform: 'uppercase' as const, marginBottom: '2px' }}>Shipping to</div>
            <div style={{ ...sans, fontSize: '18px', color: '#1a1a16', letterSpacing: '1px' }}>{recruit.full_name}</div>
            <div style={{ ...mono, fontSize: '10px', color: '#6b7560', textTransform: 'uppercase' as const }}>{recruit.branch} · {recruit.city}{recruit.state ? ', ' + recruit.state : ''}</div>
          </div>
          {recruits.length > 1 && (
            <div className="flex gap-2">
              {recruits.filter(r => r.id !== selectedRecruit).map(r => (
                <button key={r.id} onClick={() => setSelectedRecruit(r.id)}
                  style={{ ...mono, fontSize: '10px', letterSpacing: '2px', color: '#6b7560', border: '1px solid #c8b89a', background: '#fff', cursor: 'pointer', padding: '6px 12px', textTransform: 'uppercase' as const }}>
                  {r.full_name.split(' ')[1]}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-0.5">
        {CATEGORIES.map(cat => {
          const itemCount = cat.id === 'bct'
            ? products.filter(p => p.drill_sergeant_approved).length
            : products.filter(p => p.category === cat.id).length
          if (itemCount === 0) return null
          return (
            <button key={cat.id} onClick={() => openCategory(cat.id)} type="button"
              style={{ background: '#ffffff', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '0', display: 'block' }}
              className="hover:opacity-90 transition-opacity">
              <div style={{ width: '100%', height: '160px', overflow: 'hidden', background: '#f5f0e8', borderTop: `4px solid ${cat.color}` }}>
                {cat.id !== 'bct' ? (
                  <img src={'/product-illustrations/' + cat.id + '.svg'} alt={cat.label}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#4a5240' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '48px', marginBottom: '8px' }}>🪖</div>
                      <div style={{ ...mono, fontSize: '10px', letterSpacing: '3px', color: '#c8b89a', textTransform: 'uppercase' as const }}>Basic Training</div>
                    </div>
                  </div>
                )}
              </div>
              <div style={{ padding: '16px 20px', borderTop: '1px solid #e8ddd0' }}>
                <div style={{ ...sans, fontSize: '20px', fontWeight: 900, letterSpacing: '1px', color: '#1a1a16', marginBottom: '4px' }}>{cat.label}</div>
                <div style={{ ...serif, fontSize: '13px', color: '#6b7560', fontStyle: 'italic', marginBottom: '8px' }}>{cat.desc}</div>
                <div style={{ ...mono, fontSize: '10px', letterSpacing: '2px', color: cat.color, textTransform: 'uppercase' as const }}>{itemCount} items →</div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
