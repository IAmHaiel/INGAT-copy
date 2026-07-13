import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function createAnonClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) {
    if (typeof window !== 'undefined') {
      console.warn('[Supabase] Missing env vars. Transaction persistence unavailable.');
    }
    return null;
  }
  return createClient(supabaseUrl, supabaseAnonKey);
}

/** Default anon client (used during SSG and before auth) */
export const supabase = createAnonClient();

/**
 * Create an authenticated Supabase client using a custom JWT.
 * The JWT contains the wallet_address claim used by RLS policies.
 */
export function createAuthenticatedClient(jwtToken: string): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) return null;

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${jwtToken}`,
      },
    },
  });
}
