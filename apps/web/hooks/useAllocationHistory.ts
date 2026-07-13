import { useState, useEffect, useCallback } from 'react';
import { DepositAllocation } from '@/types/transaction';
import { fetchDepositEvents } from '@/lib/stellar/contract';

export const useAllocationHistory = (senderAddress: string | null) => {
  const [allocations, setAllocations] = useState<DepositAllocation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchHistory = useCallback(async () => {
    if (!senderAddress) {
      setAllocations([]);
      return;
    }
    setIsLoading(true);
    try {
      const events = await fetchDepositEvents(senderAddress);
      setAllocations(events);
    } catch (err) {
      console.error('Failed to fetch allocation history from chain:', err);
      setAllocations([]);
    } finally {
      setIsLoading(false);
    }
  }, [senderAddress]);

  useEffect(() => {
    let active = true;
    fetchHistory().then(() => {
      if (!active) {
        // cleanup — avoid state updates after unmount
      }
    });
    return () => {
      active = false;
    };
  }, [fetchHistory]);

  return {
    allocations,
    isLoading,
    refreshHistory: fetchHistory,
  };
};
