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

    const load = async () => {
      if (!senderAddress) {
        return;
      }
      setIsLoading(true);
      try {
        const events = await fetchDepositEvents(senderAddress);
        if (active) {
          setAllocations(events);
        }
      } catch (err) {
        console.error('Failed to fetch allocation history from chain:', err);
        if (active) {
          setAllocations([]);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [senderAddress]);

  return {
    allocations,
    isLoading,
    refreshHistory: fetchHistory,
  };
};
