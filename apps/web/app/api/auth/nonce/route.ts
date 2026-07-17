import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get('address');

  if (!address || !address.startsWith('G') || address.length !== 56) {
    return NextResponse.json({ error: 'Invalid Stellar address' }, { status: 400 });
  }

  const nonce = crypto.randomBytes(32).toString('hex');
  return NextResponse.json({ nonce });
}
