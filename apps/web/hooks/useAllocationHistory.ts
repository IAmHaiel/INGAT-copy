import { useState, useEffect, useCallback } from 'react';
import { DepositAllocation } from '@/types/transaction';
import { fetchDepositEvents } from '@/lib/stellar/contract/events';

export const useAllocationHistory = (senderAddress: string | null) => {
  const [allocations, setAllocations] = useState<DepositAllocation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchHistory = useCallback(async (silent = false) => {
    if (!senderAddress) {
      setAllocations([]);
      return;
    }
    if (!silent) setIsLoading(true);
    try {
      const events = await fetchDepositEvents(senderAddress);
      setAllocations(events);
    } catch (err) {
      console.error('Failed to fetch allocation history:', err);
      setAllocations([]);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [senderAddress]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) {
        fetchHistory();
      }
    });

    const interval = setInterval(() => {
      if (active) {
        fetchHistory(true);
      }
    }, 30000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [senderAddress, fetchHistory]);

  return {
    allocations,
    isLoading,
    refreshHistory: fetchHistory,
  };
};
