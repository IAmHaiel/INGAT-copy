import { useState, useEffect, useCallback } from 'react';
import { fetchDepositEvents } from '@/lib/stellar/contract/events';

export const useKnownAddresses = (senderAddress: string | null) => {
  const [knownAddresses, setKnownAddresses] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchAddresses = useCallback(async () => {
    if (!senderAddress) {
      setKnownAddresses([]);
      return;
    }
    setIsLoading(true);
    try {
      const events = await fetchDepositEvents(senderAddress);
      const uniqueReceivers = Array.from(
        new Set(events.map((r) => r.receiver).filter(Boolean))
      );
      setKnownAddresses(uniqueReceivers);
    } catch (err) {
      console.error('Failed to fetch known receiver addresses:', err);
      setKnownAddresses([]);
    } finally {
      setIsLoading(false);
    }
  }, [senderAddress]);

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
