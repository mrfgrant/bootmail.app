import { createClient } from '@/lib/supabase/server'

export default async function AdminWaitlistPage() {
  const supabase = createClient()
  const { data: waitlist } = await supabase
    .from('waitlist')
    .select('*')
    .order('created_at', { ascending: false })

  const branchCounts = waitlist?.reduce((acc: any, w) => {
    if (w.branch) acc[w.branch] = (acc[w.branch] ?? 0) + 1
    return acc
  }, {})

  return (
    <div>
      <div className="mb-8">
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '4px', color: '#4a5240' }} className="uppercase mb-2">Marketing</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '48px', letterSpacing: '3px', color: '#ffffff' }}>
          Waitlist · {waitlist?.length ?? 0}
        </h1>
      </div>

      {/* Branch breakdown */}
      {branchCounts && Object.keys(branchCounts).length > 0 && (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-0.5 mb-8">
          {Object.entries(branchCounts).map(([branch, count]) => (
            <div key={branch} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', padding: '16px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: '#d4a017' }}>{count as number}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: '#4a5240', marginTop: '4px' }} className="uppercase">{branch}</div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-0.5">
        {waitlist?.map(entry => (
          <div key={entry.id}
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', padding: '14px 20px' }}
            className="flex items-center justify-between">
            <div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#ffffff' }}>
                {entry.name ?? <span style={{ color: '#4a4a40' }}>No name</span>}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#4a5240', marginTop: '2px' }}>
                {entry.email}
              </div>
            </div>
            <div className="text-right">
              {entry.branch && (
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#d4a017' }} className="uppercase">{entry.branch}</div>
              )}
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: '#4a4a40', marginTop: '2px' }}>
                {new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
