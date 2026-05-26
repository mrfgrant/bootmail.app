'use client'
import { useState } from 'react'

const SQL_TASKS = [
  {
    id: 'credits_fn',
    title: '1. Credits Function',
    description: 'Allows atomic decrement of letter credits when a letter is sent.',
    sql: `CREATE OR REPLACE FUNCTION decrement_credits(user_id UUID, amount INT DEFAULT 1)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET letter_credits = GREATEST(0, letter_credits - amount)
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;`,
  },
  {
    id: 'fix_trigger',
    title: '2. Fix Signup Trigger',
    description: 'Fixes the handle_new_user trigger so new signups auto-create a profile.',
    sql: `DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'Error in handle_new_user: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();`,
  },
  {
    id: 'permissions',
    title: '3. Fix Permissions',
    description: 'Grants correct RLS permissions to all roles.',
    sql: `GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.profiles TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.recruits TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recruits TO authenticated;
GRANT ALL ON public.letters TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE ON public.letters TO authenticated;
GRANT ALL ON public.orders TO postgres, service_role;
GRANT SELECT, INSERT ON public.orders TO authenticated;`,
  },
  {
    id: 'test_credits',
    title: '4. Add Test Credits',
    description: 'Gives your account 10 letter credits for testing.',
    sql: `UPDATE profiles SET letter_credits = 10 WHERE email = 'jamie@mrfgrant.com';
-- Change email above to yours if different`,
  },
  {
    id: 'storage',
    title: '5. Storage Bucket',
    description: 'Create the letter-photos bucket for photo uploads.',
    sql: `-- Run this in Supabase → Storage → New Bucket:
-- Name: letter-photos
-- Public: YES (toggle on)
-- Then click Create Bucket
--
-- OR run via SQL:
INSERT INTO storage.buckets (id, name, public)
VALUES ('letter-photos', 'letter-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload
CREATE POLICY "Users can upload photos" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'letter-photos');

CREATE POLICY "Photos are public" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'letter-photos');`,
  },
]

export default function SetupPage() {
  const [copied, setCopied] = useState<string>('')
  const [done, setDone] = useState<Set<string>>(new Set())

  function copySQL(id: string, sql: string) {
    navigator.clipboard.writeText(sql)
    setCopied(id)
    setTimeout(() => setCopied(''), 2000)
  }

  function markDone(id: string) {
    setDone(prev => new Set([...prev, id]))
  }

  const allDone = SQL_TASKS.every(t => done.has(t.id))

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '4px', color: '#6b7560' }}
          className="uppercase mb-2">Admin</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '48px', letterSpacing: '3px', color: '#1a1a16' }}>
          Database Setup
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', color: '#6b7560', fontSize: '14px' }} className="mt-2">
          Run each SQL block in Supabase → SQL Editor → New Query. Click Copy, paste, run, then mark done.
        </p>
      </div>

      {allDone && (
        <div style={{ background: 'rgba(74,82,64,0.1)', border: '1px solid rgba(74,82,64,0.4)', padding: '16px 20px', marginBottom: '24px' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#4a5240' }} className="uppercase tracking-wider">
            🎖️ All setup tasks complete! BootMail is fully configured.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {SQL_TASKS.map(task => (
          <div key={task.id}
            style={{ background: done.has(task.id) ? '#f8fdf5' : '#ffffff', border: done.has(task.id) ? '1px solid rgba(74,82,64,0.3)' : '1px solid #e8ddd0', padding: '24px' }}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', letterSpacing: '1px', color: done.has(task.id) ? '#4a5240' : '#1a1a16' }}>
                  {done.has(task.id) ? '✓ ' : ''}{task.title}
                </div>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#6b7560', fontStyle: 'italic', marginTop: '4px' }}>
                  {task.description}
                </p>
              </div>
            </div>

            <pre style={{ background: '#1a1a16', color: '#c8b89a', padding: '16px', fontSize: '11px', overflowX: 'auto', marginBottom: '12px', fontFamily: 'var(--font-mono)', lineHeight: '1.6', borderRadius: '2px' }}>
              {task.sql}
            </pre>

            <div className="flex gap-2">
              <button onClick={() => copySQL(task.id, task.sql)}
                style={{ background: copied === task.id ? '#4a5240' : '#1a1a16', fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px', color: '#ffffff', border: 'none', cursor: 'pointer', padding: '10px 20px' }}
                className="uppercase transition-colors">
                {copied === task.id ? '✓ Copied!' : 'Copy SQL'}
              </button>
              {!done.has(task.id) && (
                <button onClick={() => markDone(task.id)}
                  style={{ background: 'transparent', border: '1px solid #c8b89a', fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px', color: '#6b7560', cursor: 'pointer', padding: '10px 20px' }}
                  className="uppercase hover:border-olive hover:text-olive transition-colors">
                  Mark Done ✓
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: '#1a1a16', padding: '24px', marginTop: '24px' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '3px', color: '#6b7560' }}
          className="uppercase mb-3">Next Steps After SQL</div>
        {[
          'Add STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to Vercel env vars',
          'Create letter-photos bucket in Supabase Storage (public)',
          'Set up Stripe webhook pointing to bootmail.app/api/webhooks/stripe',
          'Add STRIPE_WEBHOOK_SECRET to Vercel env vars',
        ].map((step, i) => (
          <div key={i} style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#6b7560', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '12px' }}>
            <span style={{ color: '#d4a017', flexShrink: 0 }}>{i + 1}.</span>
            {step}
          </div>
        ))}
      </div>
    </div>
  )
}
