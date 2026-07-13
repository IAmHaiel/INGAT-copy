import { useState, useEffect, useCallback } from 'react';
import { getConnectedPublicKey, isFreighterInstalled, getFreighterNetwork } from '@/lib/stellar/freighter';

export const useWallet = () => {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const checkWalletConnection = useCallback(async () => {
    try {
      const installed = await isFreighterInstalled();
      if (!installed) {
        setError('Freighter wallet extension is not installed');
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
      setError('Failed to check wallet connection');
    }
  }, []);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const installed = await isFreighterInstalled();
      if (!installed) {
        setError('Freighter wallet extension is not installed');
        setIsConnecting(false);
        return;
      }
      const pubKey = await getConnectedPublicKey();
      if (pubKey) {
        const networkInfo = await getFreighterNetwork();
        if (networkInfo && networkInfo.network !== 'TESTNET') {
          setError('Please switch Freighter to Stellar Testnet to use INGAT');
          setIsConnecting(false);
          return;
        }
        setPublicKey(pubKey);
        setIsConnected(true);
      } else {
        setError('Wallet connection rejected or no account selected');
      }
    } catch {
      setError('Connection request failed');
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setPublicKey(null);
    setIsConnected(false);
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
    error,
    connect,
    disconnect,
    checkWalletConnection
  };
};
