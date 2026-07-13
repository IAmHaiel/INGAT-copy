import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { StrKey } from '@stellar/stellar-sdk';
import nacl from 'tweetnacl';
import jwt from 'jsonwebtoken';
import { createHash } from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const jwtSecret = process.env.SUPABASE_JWT_SECRET!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { address, nonce, signature } = body;

  if (!address || !nonce || !signature) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (!address.startsWith('G') || address.length !== 56) {
    return NextResponse.json({ error: 'Invalid Stellar address' }, { status: 400 });
  }

  // Look up the nonce
  const { data: nonceRecord, error: fetchError } = await supabaseAdmin
    .from('auth_nonces')
    .select('*')
    .eq('wallet_address', address)
    .eq('nonce', nonce)
    .eq('used', false)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (fetchError || !nonceRecord) {
    return NextResponse.json({ error: 'Invalid or expired nonce' }, { status: 401 });
  }

  // Mark nonce as used
  await supabaseAdmin
    .from('auth_nonces')
    .update({ used: true })
    .eq('id', nonceRecord.id);

  // Verify the Ed25519 signature (SEP-53 format)
  // Freighter signs: SHA256("Stellar Signed Message:\n" + message)
  const message = 'INGAT auth: ' + nonce;
  const prefix = 'Stellar Signed Message:\n';
  const payload = Buffer.concat([
    Buffer.from(prefix, 'utf-8'),
    Buffer.from(message, 'utf-8'),
  ]);
  const messageHash = createHash('sha256').update(payload).digest();
  const signatureBytes = Buffer.from(signature, 'base64');
  const publicKeyBytes = StrKey.decodeEd25519PublicKey(address);

  const isValid = nacl.sign.detached.verify(
    new Uint8Array(messageHash),
    new Uint8Array(signatureBytes),
    publicKeyBytes
  );

  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // Issue JWT
  const token = jwt.sign(
    {
      wallet_address: address,
      role: 'authenticated',
      iss: 'supabase',
      aud: 'authenticated',
    },
    jwtSecret,
    { expiresIn: '1h', subject: address }
  );

  return NextResponse.json({ token });
}
