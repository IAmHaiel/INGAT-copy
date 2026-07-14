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
  const {
    restoreSession,
    isSessionRestored,
    supabaseClient,
    isAuthenticating,
    authenticate,
    logout,
    authError,
  } = useAuth();
  const hasTriggeredAuth = useRef(false);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    if (!isSessionRestored) return;
    if (!wallet.publicKey) {
      hasTriggeredAuth.current = false;
      return;
    }
    if (supabaseClient) return;
    if (isAuthenticating) return; 
    if (hasTriggeredAuth.current) return; 

    hasTriggeredAuth.current = true;
    authenticate(wallet.publicKey);
  }, [wallet.publicKey, isSessionRestored, supabaseClient, isAuthenticating, authenticate]);

  useEffect(() => {
    if (!wallet.publicKey && supabaseClient) {
      logout();
    }
  }, [wallet.publicKey, supabaseClient, logout]);

  const value: WalletContextType = {
    ...wallet,
    supabaseClient,
    isAuthenticating,
    authError,
    authenticate,
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
