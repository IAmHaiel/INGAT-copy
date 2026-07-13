# Transaction Persistence & Wallet Auth Implementation Plan

This document outlines the implementation strategy for JWT-based wallet authentication to secure Supabase transaction persistence using Row-Level Security (RLS).

---

## Phase 1: Database Migration (Nonces Schema)
To enable secure challenge-response authentication, we introduce a table to store temporary nonces generated on the server-side.

### File 1: `supabase/migrations/002_create_auth_nonces_table.sql`
```sql
-- INGAT - Auth Nonces Table Migration
-- Stores temporary nonces for wallet challenge-response authentication.
-- Nonces expire after 5 minutes and are single-use.

CREATE TABLE IF NOT EXISTS auth_nonces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  nonce TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '5 minutes'),
  used BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_auth_nonces_wallet ON auth_nonces (wallet_address, nonce);
CREATE INDEX idx_auth_nonces_expires ON auth_nonces (expires_at);

ALTER TABLE auth_nonces ENABLE ROW LEVEL SECURITY;
-- Only accessed by service_role (server-side API routes).
-- No permissive policies = anon/authenticated cannot access directly.
```

---

## Phase 2: Server-Side Authentication API Routes
We implement Next.js API route handlers to issue challenges (nonces) and verify the wallet's signatures using Ed25519, before returning a signed JWT.

### File 2: `apps/web/app/api/auth/nonce/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get('address');

  if (!address || !address.startsWith('G') || address.length !== 56) {
    return NextResponse.json({ error: 'Invalid Stellar address' }, { status: 400 });
  }

  const nonce = crypto.randomBytes(32).toString('hex');

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
```

### File 3: `apps/web/app/api/auth/verify/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { StrKey } from '@stellar/stellar-sdk';
import nacl from 'tweetnacl';
import jwt from 'jsonwebtoken';

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

  // Verify the Ed25519 signature
  const message = 'INGAT auth: ' + nonce;
  const messageBytes = new TextEncoder().encode(message);
  const signatureBytes = Buffer.from(signature, 'base64');
  const publicKeyBytes = StrKey.decodeEd25519PublicKey(address);

  const isValid = nacl.sign.detached.verify(
    messageBytes,
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
```

---

## Phase 3: Wallet Signing Integration
We extend the Freighter helper utility to sign messages using SEP-53 message signing.

### File 4: Add to `apps/web/lib/stellar/freighter.ts`
```typescript
import { signMessage } from '@stellar/freighter-api';

/**
 * Sign an arbitrary message using Freighter (SEP-53).
 * Used for wallet authentication challenge-response.
 */
export const signMessageWithFreighter = async (
  message: string,
  address: string
): Promise<string> => {
  const result = await signMessage(message, { address });
  if (result.error) {
    throw new Error(result.error.message || 'Message signing failed');
  }
  if (!result.signedMessage) {
    throw new Error('No signature returned from Freighter');
  }

  const signed = result.signedMessage;
  if (typeof signed === 'string') {
    return signed;
  }

  // Safe base64 conversion in browser for Buffer / Uint8Array
  const bytes = new Uint8Array(signed as any);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};
```

---

## Phase 4: Supabase Authenticated Client & Service Wrappers
We update the Supabase client creation and transaction operations to support custom JWT authentication headers.

### File 5: `apps/web/lib/supabase/client.ts` (REPLACE)
```typescript
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
```

### File 6: `apps/web/lib/supabase/transactions.ts` (UPDATE)
```typescript
import { supabase } from './client';
import { TransactionRow, TransactionInsert } from './types';
import { SupabaseClient } from '@supabase/supabase-js';

const TABLE = 'transactions';

function getClient(client?: SupabaseClient | null): SupabaseClient | null {
  return client || supabase;
}

export async function insertTransaction(
  data: TransactionInsert,
  client?: SupabaseClient | null
): Promise<void> {
  const sb = getClient(client);
  if (!sb) {
    console.warn('[Supabase] Client not configured.');
    return;
  }

  const { error } = await sb.from(TABLE).insert(data);
  if (error) {
    if (error.code === '23505') {
      console.info('[Supabase] Transaction already persisted:', data.tx_hash);
      return;
    }
    console.error('[Supabase] Failed to insert transaction:', error.message);
  }
}

export async function fetchTransactionsByAddress(
  address: string,
  client?: SupabaseClient | null
): Promise<TransactionRow[]> {
  const sb = getClient(client);
  if (!sb) return [];

  const { data, error } = await sb
    .from(TABLE)
    .select('*')
    .or(`sender_address.eq.${address},receiver_address.eq.${address}`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Supabase] Failed to fetch transactions:', error.message);
    return [];
  }
  return (data as TransactionRow[]) || [];
}

export async function fetchSentTransactions(
  address: string,
  client?: SupabaseClient | null
): Promise<TransactionRow[]> {
  const sb = getClient(client);
  if (!sb) return [];

  const { data, error } = await sb
    .from(TABLE)
    .select('*')
    .eq('sender_address', address)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Supabase] Failed to fetch sent transactions:', error.message);
    return [];
  }
  return (data as TransactionRow[]) || [];
}

export async function fetchReceivedTransactions(
  address: string,
  client?: SupabaseClient | null
): Promise<TransactionRow[]> {
  const sb = getClient(client);
  if (!sb) return [];

  const { data, error } = await sb
    .from(TABLE)
    .select('*')
    .eq('receiver_address', address)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Supabase] Failed to fetch received transactions:', error.message);
    return [];
  }
  return (data as TransactionRow[]) || [];
}
```

---

## Phase 5: Client-Side Auth Hook & Context Integration
We create a React hook to manage the wallet authentication lifecycle and integrate it into the global `WalletContext`.

### File 7: `apps/web/hooks/useAuth.ts` (NEW)
```typescript
import { useState, useCallback } from 'react';
import { signMessageWithFreighter } from '@/lib/stellar/freighter';
import { createAuthenticatedClient } from '@/lib/supabase/client';
import { SupabaseClient } from '@supabase/supabase-js';

interface AuthState {
  token: string | null;
  client: SupabaseClient | null;
  isAuthenticating: boolean;
  error: string | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    token: null,
    client: null,
    isAuthenticating: false,
    error: null,
  });

  const authenticate = useCallback(async (address: string): Promise<SupabaseClient | null> => {
    setAuthState(prev => ({ ...prev, isAuthenticating: true, error: null }));

    try {
      // Step 1: Request nonce
      const nonceRes = await fetch(`/api/auth/nonce?address=${encodeURIComponent(address)}`);
      if (!nonceRes.ok) throw new Error('Failed to get auth nonce');
      const { nonce } = await nonceRes.json();

      // Step 2: Sign with Freighter
      const message = 'INGAT auth: ' + nonce;
      const signature = await signMessageWithFreighter(message, address);

      // Step 3: Verify and get JWT
      const verifyRes = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, nonce, signature }),
      });

      if (!verifyRes.ok) {
        const err = await verifyRes.json();
        throw new Error(err.error || 'Authentication failed');
      }

      const { token } = await verifyRes.json();

      // Step 4: Create authenticated client
      const authenticatedClient = createAuthenticatedClient(token);

      setAuthState({
        token,
        client: authenticatedClient,
        isAuthenticating: false,
        error: null,
      });

      return authenticatedClient;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Authentication failed';
      console.error('[useAuth] Authentication failed:', errorMsg);
      setAuthState(prev => ({ ...prev, isAuthenticating: false, error: errorMsg }));
      return null;
    }
  }, []);

  const clearAuth = useCallback(() => {
    setAuthState({ token: null, client: null, isAuthenticating: false, error: null });
  }, []);

  return {
    token: authState.token,
    supabaseClient: authState.client,
    isAuthenticating: authState.isAuthenticating,
    authError: authState.error,
    authenticate,
    clearAuth,
  };
}
```

### File 8: `apps/web/context/WalletContext.tsx` (UPDATE)
Integrate the following changes inside the context provider:
- Import `useAuth` hook from `@/hooks/useAuth`.
- Call `authenticate(publicKey)` upon a successful wallet connection.
- Call `clearAuth()` when the wallet is disconnected.
- Expose `supabaseClient` and `isAuthenticating` within the context values so other containers can access them.

---

## Phase 6: Tightening Row-Level Security (RLS) Policies
We restrict read and write access to the `transactions` table based on the authenticated wallet address claim stored in the custom JWT.

### File 9: `supabase/migrations/003_tighten_rls_policies.sql`
```sql
-- Drop old permissive policies
DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;
DROP POLICY IF EXISTS "Anyone can insert transactions" ON transactions;

-- SELECT: enforce wallet_address from JWT
CREATE POLICY "Users can view their own transactions"
  ON transactions
  FOR SELECT
  USING (
    sender_address = coalesce(
      current_setting('request.jwt.claims', true)::json->>'wallet_address',
      current_setting('request.jwt.claims', true)::json->>'sub'
    )
    OR receiver_address = coalesce(
      current_setting('request.jwt.claims', true)::json->>'wallet_address',
      current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

-- INSERT: only your own transactions
CREATE POLICY "Authenticated users can insert their own transactions"
  ON transactions
  FOR INSERT
  WITH CHECK (
    sender_address = coalesce(
      current_setting('request.jwt.claims', true)::json->>'wallet_address',
      current_setting('request.jwt.claims', true)::json->>'sub'
    )
    OR receiver_address = coalesce(
      current_setting('request.jwt.claims', true)::json->>'wallet_address',
      current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );
```

---

## Phase 7: Configuration & Dependencies
Install the required packages and add keys to your environment.

### Dependencies to Install
Run the following commands in the workspace root:
```bash
npm install jsonwebtoken@9.0.2 tweetnacl@1.0.3 --workspace=web --save-exact
npm install @types/jsonwebtoken@9.0.9 --workspace=web --save-dev --save-exact
```

### Environment Variables
Configure the environment variables in `.env.local` and document them in `.env.example`:

**`.env.local`** (Keep private and do not commit):
```env
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
SUPABASE_JWT_SECRET=your-supabase-jwt-secret
```

**`.env.example`** (Document for other environments):
```env
# Server-side only (NOT prefixed with NEXT_PUBLIC_)
# Get from: Supabase Dashboard > Settings > API
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret
```

---

## Detailed Execution Steps & Checklist

- [x] **1. Nonce Table Migration**: Create `supabase/migrations/002_create_auth_nonces_table.sql`.
- [x] **2. Dependency Installation**: Install `jsonwebtoken` and `tweetnacl` dependencies.
- [x] **3. Nonce API Route**: Create `apps/web/app/api/auth/nonce/route.ts`.
- [x] **4. Verification API Route**: Create `apps/web/app/api/auth/verify/route.ts`.
- [x] **5. Freighter SDK Extension**: Add `signMessageWithFreighter` to `apps/web/lib/stellar/freighter.ts`.
- [x] **6. Supabase Client Update**: Update `apps/web/lib/supabase/client.ts` to support authenticated clients.
- [x] **7. Transactions Library Update**: Update `apps/web/lib/supabase/transactions.ts` to use custom Supabase clients.
- [x] **8. React Hook Creation**: Implement `apps/web/hooks/useAuth.ts` hook.
- [x] **9. Wallet Context Refactor**: Update `apps/web/context/WalletContext.tsx` with JWT auth state.
- [x] **10. Secure RLS Policies**: Create `supabase/migrations/003_tighten_rls_policies.sql` to enforce user ownership of data.
- [x] **11. Environment Configuration**: Update `.env.local` and `.env.example`.
- [ ] **12. Verification**: Run TypeScript checks (`npx tsc --noEmit`) and verify build passes before committing.
