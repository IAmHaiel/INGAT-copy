import { useState, useEffect, useCallback } from 'react';
import { getConnectedPublicKey, isFreighterInstalled, requestWalletAccess, getFreighterNetwork } from '@/lib/stellar/freighter';
import { WalletConnectionStatus } from '@/types/wallet';

export const useWallet = () => {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<WalletConnectionStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const checkWalletConnection = useCallback(async () => {
    try {
      const installed = await isFreighterInstalled();
      if (!installed) {
        return;
      }
      const pubKey = await getConnectedPublicKey();
      if (pubKey) {
        const networkInfo = await getFreighterNetwork();
        if (networkInfo && networkInfo.network !== 'TESTNET') {
          setError('Please switch Freighter to Stellar Testnet to use INGAT');
          setPublicKey(null);
          setIsConnected(false);
          return;
        }
        setPublicKey(pubKey);
        setIsConnected(true);
        setError(null);
      } else {
        setPublicKey(null);
        setIsConnected(false);
      }
    } catch {
      // Silent fail on mount check — don't change connectionStatus
    }
  }, []);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setConnectionStatus('connecting');
    setError(null);
    try {
      const installed = await isFreighterInstalled();
      if (!installed) {
        setError('Freighter wallet extension is not installed');
        setConnectionStatus('not-installed');
        setIsConnecting(false);
        return;
      }

      // Use requestAccess to explicitly trigger the Freighter popup
      // This works for first-time auth AND when switching accounts
      const { address, error: accessError } = await requestWalletAccess();

      if (accessError || !address) {
        setError(accessError || 'Wallet connection was rejected or no account selected');
        setConnectionStatus('locked');
        setIsConnecting(false);
        return;
      }

      // Verify network
      const networkInfo = await getFreighterNetwork();
      if (networkInfo && networkInfo.network !== 'TESTNET') {
        setError('Please switch Freighter to Stellar Testnet to use INGAT');
        setConnectionStatus('error');
        setIsConnecting(false);
        return;
      }

      setPublicKey(address);
      setIsConnected(true);
      setConnectionStatus('idle');
    } catch {
      setError('Connection request failed');
      setConnectionStatus('error');
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setPublicKey(null);
    setIsConnected(false);
    setConnectionStatus('idle');
    setError(null);
  }, []);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) {
        checkWalletConnection();
      }
    });
    return () => {
      active = false;
    };
  }, [checkWalletConnection]);

  return {
    publicKey,
    isConnected,
    isConnecting,
    connectionStatus,
    error,
    connect,
    disconnect,
    checkWalletConnection
  };
};
