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
      
      const local = localStorage.getItem(`allocations_${senderAddress}`);
      const localAllocations: DepositAllocation[] = local ? JSON.parse(local) : [];
      
      const allAllocationsMap = new Map<string, DepositAllocation>();
      localAllocations.forEach(a => allAllocationsMap.set(a.id, a));
      events.forEach(e => allAllocationsMap.set(e.id, e));
      
      const merged = Array.from(allAllocationsMap.values())
        .sort((a, b) => b.timestamp - a.timestamp);
        
      setAllocations(merged);
    } catch (err) {
      console.error('Failed to fetch allocation history from chain:', err);
      const local = localStorage.getItem(`allocations_${senderAddress}`);
      const localAllocations: DepositAllocation[] = local ? JSON.parse(local) : [];
      setAllocations(localAllocations.sort((a, b) => b.timestamp - a.timestamp));
    } finally {
      setIsLoading(false);
    }
  }, [senderAddress]);

  useEffect(() => {
    fetchHistory();
  }, [senderAddress, fetchHistory]);

  return {
    allocations,
    isLoading,
    refreshHistory: fetchHistory,
  };
};
