export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: '#1a1a16' }} className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <a href="/" className="inline-block">
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '40px', letterSpacing: '6px', color: '#ffffff' }}>
              BOOT<span style={{ color: '#d4a017' }}>MAIL</span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '3px', color: '#6b7560' }}
              className="text-center mt-1 uppercase">
              More Than Mail. It&apos;s Morale.
            </div>
          </a>
        </div>
        {children}
      </div>
    </div>
  )
}
