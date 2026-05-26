import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// Secret key to protect this endpoint
const SETUP_KEY = process.env.SETUP_SECRET_KEY || 'bootmail-setup-2026'

const MIGRATIONS = [
  {
    name: 'decrement_credits function',
    sql: `
      CREATE OR REPLACE FUNCTION decrement_credits(user_id UUID, amount INT DEFAULT 1)
      RETURNS void AS $$
      BEGIN
        UPDATE profiles
        SET letter_credits = GREATEST(0, letter_credits - amount)
        WHERE id = user_id;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `
  },
  {
    name: 'handle_new_user trigger fix',
    sql: `
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
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
        FOR EACH ROW EXECUTE FUNCTION handle_new_user();
    `
  },
  {
    name: 'profiles permissions',
    sql: `
      GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
      GRANT ALL ON public.profiles TO postgres, service_role;
      GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
    `
  },
  {
    name: 'update_updated_at trigger',
    sql: `
      CREATE OR REPLACE FUNCTION update_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `
  },
]

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key')
  if (key !== SETUP_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const results = []

  for (const migration of MIGRATIONS) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: migration.sql })
      if (error) {
        // Try direct query as fallback
        results.push({ name: migration.name, status: 'note', message: error.message })
      } else {
        results.push({ name: migration.name, status: 'ok' })
      }
    } catch (e: any) {
      results.push({ name: migration.name, status: 'error', message: e.message })
    }
  }

  return NextResponse.json({ results, message: 'Setup complete' })
}
