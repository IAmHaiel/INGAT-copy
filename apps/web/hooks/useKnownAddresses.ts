import { useState, useEffect, useCallback } from 'react';
import { fetchSentTransactions } from '@/lib/supabase';
import { useWalletContext } from '@/context/WalletContext';

export const useKnownAddresses = (senderAddress: string | null) => {
  const { supabaseClient } = useWalletContext();
  const [knownAddresses, setKnownAddresses] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchAddresses = useCallback(async () => {
    if (!supabaseClient || !senderAddress) {
      setKnownAddresses([]);
      return;
    }
    setIsLoading(true);
    try {
      const rows = await fetchSentTransactions(senderAddress, supabaseClient);
      const uniqueReceivers = Array.from(
        new Set(rows.map((r) => r.receiver_address).filter(Boolean))
      );
      setKnownAddresses(uniqueReceivers);
    } catch (err) {
      console.error('Failed to fetch known receiver addresses:', err);
      setKnownAddresses([]);
    } finally {
      setIsLoading(false);
    }
  }, [senderAddress, supabaseClient]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) {
        fetchAddresses();
      }
    });
    return () => {
      active = false;
    };
  }, [senderAddress, fetchAddresses]);

  return {
    knownAddresses,
    isLoading,
    refreshAddresses: fetchAddresses,
  };
};
