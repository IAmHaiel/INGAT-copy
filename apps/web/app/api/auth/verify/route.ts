import { NextRequest, NextResponse } from 'next/server';
import { StrKey } from '@stellar/stellar-sdk';
import nacl from 'tweetnacl';
import jwt from 'jsonwebtoken';
import { createHash } from 'crypto';

const jwtSecret = process.env.SUPABASE_JWT_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { address, nonce, signature } = body;

  if (!address || !nonce || !signature) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (!address.startsWith('G') || address.length !== 56) {
    return NextResponse.json({ error: 'Invalid Stellar address' }, { status: 400 });
  }

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

  // Set JWT as HttpOnly session cookie (no maxAge = session cookie, cleared on browser close)
  const response = NextResponse.json({ token });
  response.cookies.set('ingat_auth', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  return response;
}
