import Link from 'next/link'

export default function StorePage() {
  return (
    <div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '4px', color: '#6b7560' }}
        className="uppercase mb-2">Coming Soon</div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '48px', letterSpacing: '3px', color: '#1a1a16' }}
        className="mb-4">Store</h1>
      <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', color: '#6b7560', fontSize: '14px' }}
        className="mb-8">
        This feature is being built now. Check back very soon.
      </p>
      <Link href="/dashboard"
        style={{ background: '#4a5240', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '3px' }}
        className="inline-block px-6 py-3 text-white uppercase hover:opacity-90 transition-opacity">
        Back to Dashboard
      </Link>
    </div>
  )
}
