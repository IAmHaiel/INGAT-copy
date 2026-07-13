import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const jwtSecret = process.env.SUPABASE_JWT_SECRET!;

export async function GET(request: NextRequest) {
  const cookie = request.cookies.get('ingat_auth');

  if (!cookie?.value) {
    return NextResponse.json({ token: null, wallet_address: null });
  }

  try {
    const decoded = jwt.verify(cookie.value, jwtSecret) as {
      wallet_address: string;
      role: string;
      sub: string;
    };

    return NextResponse.json({
      token: cookie.value,
      wallet_address: decoded.wallet_address,
    });
  } catch {
    // Token is invalid or expired — clear the stale cookie
    const response = NextResponse.json({ token: null, wallet_address: null });
    response.cookies.set('ingat_auth', '', { maxAge: 0, path: '/' });
    return response;
  }
}
