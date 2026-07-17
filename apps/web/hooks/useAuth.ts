import { useState, useCallback, useRef } from 'react';
import { signMessageWithFreighter } from '@/lib/stellar/freighter';
import { createAuthenticatedClient } from '@/lib/supabase/client';
import { SupabaseClient } from '@supabase/supabase-js';

interface AuthState {
  token: string | null;
  client: SupabaseClient | null;
  isAuthenticating: boolean;
  error: string | null;
  isSessionRestored: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    token: null,
    client: null,
    isAuthenticating: false,
    error: null,
    isSessionRestored: false,
  });

  // Prevent duplicate restore calls
  const restoreAttempted = useRef(false);

  /**
   * Attempt to restore an existing auth session from the HttpOnly cookie.
   * Calls GET /api/auth/session which reads the cookie server-side and
   * returns the JWT if still valid. No Freighter popup is triggered.
   */
  const restoreSession = useCallback(async (): Promise<boolean> => {
    if (restoreAttempted.current) return !!authState.client;
    restoreAttempted.current = true;

    try {
      const res = await fetch('/api/auth/session', { credentials: 'same-origin' });
      if (!res.ok) {
        setAuthState(prev => ({ ...prev, isSessionRestored: true }));
        return false;
      }

      const { token, wallet_address } = await res.json();

      if (token && wallet_address) {
        const authenticatedClient = createAuthenticatedClient(token);
        setAuthState({
          token,
          client: authenticatedClient,
          isAuthenticating: false,
          error: null,
          isSessionRestored: true,
        });
        return true;
      }

      setAuthState(prev => ({ ...prev, isSessionRestored: true }));
      return false;
    } catch {
      setAuthState(prev => ({ ...prev, isSessionRestored: true }));
      return false;
    }
  }, [authState.client]);

  /**
   * Full authentication flow: request nonce, sign with Freighter, verify signature.
   * This triggers the Freighter "Sign message" popup.
   * Only call this when no valid session cookie exists.
   */
  const authenticate = useCallback(async (address: string): Promise<SupabaseClient | null> => {
    setAuthState(prev => ({ ...prev, isAuthenticating: true, error: null }));

    try {
      // Step 1: Request nonce
      const nonceRes = await fetch(`/api/auth/nonce?address=${encodeURIComponent(address)}`);
      if (!nonceRes.ok) throw new Error('Failed to get auth nonce');
      const { nonce } = await nonceRes.json();

      // Step 2: Sign with Freighter (triggers popup)
      const message = 'INGAT auth: ' + nonce;
      const signature = await signMessageWithFreighter(message, address);

      // Step 3: Verify and get JWT (also sets HttpOnly cookie)
      const verifyRes = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, nonce, signature }),
        credentials: 'same-origin',
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
        isSessionRestored: true,
      });

      return authenticatedClient;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Authentication failed';
      console.error('[useAuth] Authentication failed:', errorMsg);
      setAuthState(prev => ({
        ...prev,
        isAuthenticating: false,
        error: errorMsg,
        isSessionRestored: true,
      }));
      return null;
    }
  }, []);

  /**
   * Logout: clear the HttpOnly cookie via API and reset local state.
   */
  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
      });
    } catch {
      // Best-effort cookie clear
    }
    restoreAttempted.current = false;
    setAuthState({
      token: null,
      client: null,
      isAuthenticating: false,
      error: null,
      isSessionRestored: false,
    });
  }, []);

  const clearAuth = useCallback(() => {
    restoreAttempted.current = false;
    setAuthState({
      token: null,
      client: null,
      isAuthenticating: false,
      error: null,
      isSessionRestored: false,
    });
  }, []);

  return {
    token: authState.token,
    supabaseClient: authState.client,
    isAuthenticating: authState.isAuthenticating,
    authError: authState.error,
    isSessionRestored: authState.isSessionRestored,
    restoreSession,
    authenticate,
    logout,
    clearAuth,
  };
}
