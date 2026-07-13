import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
    'Transaction persistence will be unavailable.'
  );
}

/**
 * Supabase client instance configured with the public anon key.
 * Uses RLS policies for security — no service role key exposed to the browser.
 */
export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);
