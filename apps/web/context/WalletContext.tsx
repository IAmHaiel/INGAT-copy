'use client';

import React, { createContext, useContext, ReactNode, useEffect, useRef } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useAuth } from '@/hooks/useAuth';
import { WalletConnectionStatus } from '@/types/wallet';
import { SupabaseClient } from '@supabase/supabase-js';

interface WalletContextType {
  publicKey: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  isInitializing: boolean;
  connectionStatus: WalletConnectionStatus;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  supabaseClient: SupabaseClient | null;
  isAuthenticating: boolean;
  authError: string | null;
  authenticate: (address: string) => Promise<SupabaseClient | null>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const wallet = useWallet();
  const auth = useAuth();
  const hasTriggeredAuth = useRef(false);

  // On mount, attempt to restore session from the HttpOnly cookie.
  // This runs once and does NOT trigger a Freighter popup.
  useEffect(() => {
    auth.restoreSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When publicKey becomes available and session restoration is complete,
  // only trigger Freighter authentication if no valid session was restored.
  useEffect(() => {
    if (!auth.isSessionRestored) return; // Wait for session check to finish
    if (!wallet.publicKey) {
      // Wallet disconnected — reset auth flag
      hasTriggeredAuth.current = false;
      return;
    }
    if (auth.supabaseClient) return; // Already authenticated (restored from cookie)
    if (auth.isAuthenticating) return; // Already in progress
    if (hasTriggeredAuth.current) return; // Already attempted this session

    // No valid session exists — trigger Freighter sign message (one time only)
    hasTriggeredAuth.current = true;
    auth.authenticate(wallet.publicKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet.publicKey, auth.isSessionRestored, auth.supabaseClient, auth.isAuthenticating, auth.authenticate]);

  // When wallet disconnects, clear the cookie and auth state
  useEffect(() => {
    if (!wallet.publicKey && auth.supabaseClient) {
      auth.logout();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet.publicKey]);

  const value: WalletContextType = {
    ...wallet,
    supabaseClient: auth.supabaseClient,
    isAuthenticating: auth.isAuthenticating,
    authError: auth.authError,
    authenticate: auth.authenticate,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWalletContext = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWalletContext must be used within a WalletProvider');
  }
  return context;
};
