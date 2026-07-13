import { useState, useEffect, useCallback, useRef } from 'react';
import { getConnectedPublicKey, isFreighterInstalled, requestWalletAccess, getFreighterNetwork } from '@/lib/stellar/freighter';
import { WalletConnectionStatus } from '@/types/wallet';

const WALLET_SESSION_KEY = 'ingat_wallet_connected';

export const useWallet = () => {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [connectionStatus, setConnectionStatus] = useState<WalletConnectionStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const initDone = useRef(false);

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
      sessionStorage.setItem(WALLET_SESSION_KEY, 'true');
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
    sessionStorage.removeItem(WALLET_SESSION_KEY);
  }, []);

  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;

    const init = async () => {
      if (sessionStorage.getItem(WALLET_SESSION_KEY)) {
        await checkWalletConnection();
      }
      setIsInitializing(false);
    };

    init();
  }, [checkWalletConnection]);

  return {
    publicKey,
    isConnected,
    isConnecting,
    isInitializing,
    connectionStatus,
    error,
    connect,
    disconnect,
    checkWalletConnection
  };
};
