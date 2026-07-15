import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

let supabaseAdminInstance: ReturnType<typeof createClient> | null = null;
function getSupabaseAdmin(): ReturnType<typeof createClient> {
  if (!supabaseAdminInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceKey);
  }
  return supabaseAdminInstance;
}

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get('address');

  if (!address || !address.startsWith('G') || address.length !== 56) {
    return NextResponse.json({ error: 'Invalid Stellar address' }, { status: 400 });
  }

  const nonce = crypto.randomBytes(32).toString('hex');
  const supabaseAdmin = getSupabaseAdmin();

  const { error } = await supabaseAdmin.from('auth_nonces').insert({
    wallet_address: address,
    nonce,
  });

  if (error) {
    console.error('[auth/nonce] Failed to store nonce:', error.message);
    return NextResponse.json({ error: 'Failed to generate nonce' }, { status: 500 });
  }

  return NextResponse.json({ nonce });
}
