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
