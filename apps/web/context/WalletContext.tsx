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

  useEffect(() => {
    auth.restoreSession();
  }, []);

  useEffect(() => {
    if (!auth.isSessionRestored) return;
    if (!wallet.publicKey) {
      hasTriggeredAuth.current = false;
      return;
    }
    if (auth.supabaseClient) return;
    if (auth.isAuthenticating) return; 
    if (hasTriggeredAuth.current) return; 

    hasTriggeredAuth.current = true;
    auth.authenticate(wallet.publicKey);
  }, [wallet.publicKey, auth.isSessionRestored, auth.supabaseClient, auth.isAuthenticating, auth.authenticate]);

  useEffect(() => {
    if (!wallet.publicKey && auth.supabaseClient) {
      auth.logout();
    }
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
