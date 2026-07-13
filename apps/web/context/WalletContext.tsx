'use client';

import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useAuth } from '@/hooks/useAuth';
import { WalletConnectionStatus } from '@/types/wallet';
import { SupabaseClient } from '@supabase/supabase-js';

interface WalletContextType {
  publicKey: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  connectionStatus: WalletConnectionStatus;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  supabaseClient: SupabaseClient | null;
  isAuthenticating: boolean;
  authError: string | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const wallet = useWallet();
  const auth = useAuth();

  useEffect(() => {
    if (wallet.publicKey) {
      auth.authenticate(wallet.publicKey);
    } else {
      auth.clearAuth();
    }
  }, [wallet.publicKey, auth.authenticate, auth.clearAuth]);

  const value: WalletContextType = {
    ...wallet,
    supabaseClient: auth.supabaseClient,
    isAuthenticating: auth.isAuthenticating,
    authError: auth.authError,
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
