import { useState, useCallback, useRef } from 'react';
import { signMessageWithFreighter } from '@/lib/stellar/freighter';

interface AuthState {
  token: string | null;
  isAuthenticating: boolean;
  error: string | null;
  isSessionRestored: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    token: null,
    isAuthenticating: false,
    error: null,
    isSessionRestored: false,
  });

  const restoreAttempted = useRef(false);

  const restoreSession = useCallback(async (): Promise<boolean> => {
    if (restoreAttempted.current) return !!authState.token;
    restoreAttempted.current = true;

    try {
      const res = await fetch('/api/auth/session', { credentials: 'same-origin' });
      if (!res.ok) {
        setAuthState(prev => ({ ...prev, isSessionRestored: true }));
        return false;
      }

      const { token } = await res.json();

      if (token) {
        setAuthState({
          token,
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
  }, [authState.token]);

  const authenticate = useCallback(async (address: string): Promise<string | null> => {
    setAuthState(prev => ({ ...prev, isAuthenticating: true, error: null }));

    try {
      const nonceRes = await fetch(`/api/auth/nonce?address=${encodeURIComponent(address)}`);
      if (!nonceRes.ok) throw new Error('Failed to get auth nonce');
      const { nonce } = await nonceRes.json();

      const message = 'INGAT auth: ' + nonce;
      const signature = await signMessageWithFreighter(message, address);

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

      setAuthState({
        token,
        isAuthenticating: false,
        error: null,
        isSessionRestored: true,
      });

      return token;
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
      isAuthenticating: false,
      error: null,
      isSessionRestored: false,
    });
  }, []);

  const clearAuth = useCallback(() => {
    restoreAttempted.current = false;
    setAuthState({
      token: null,
      isAuthenticating: false,
      error: null,
      isSessionRestored: false,
    });
  }, []);

  return {
    token: authState.token,
    isAuthenticating: authState.isAuthenticating,
    authError: authState.error,
    isSessionRestored: authState.isSessionRestored,
    restoreSession,
    authenticate,
    logout,
    clearAuth,
  };
}
