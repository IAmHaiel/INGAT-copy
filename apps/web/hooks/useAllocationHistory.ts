import { useState, useEffect, useCallback } from 'react';
import { DepositAllocation } from '@/types/transaction';

export const useAllocationHistory = (senderAddress: string | null) => {
  const [allocations, setAllocations] = useState<DepositAllocation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchHistory = useCallback(() => {
    if (!senderAddress) {
      setAllocations([]);
      return;
    }
    setIsLoading(true);
    try {
      const stored = localStorage.getItem(`allocations_${senderAddress}`);
      if (stored) {
        setAllocations(JSON.parse(stored));
      } else {
        const demoHistory: DepositAllocation[] = [
          {
            id: 't_demo_hash_1',
            sender: senderAddress,
            receiver: 'GDQP237HWGTU7RUXZHVYA7QM62P7N3B4P5G25XJ7SND7PL64PKUSDC',
            amount: 500,
            splitRatio: 70,
            unlockDate: Math.floor(Date.now() / 1000) + 3600 * 24 * 7,
            timestamp: Math.floor(Date.now() / 1000) - 3600 * 3
          },
          {
            id: 't_demo_hash_2',
            sender: senderAddress,
            receiver: 'GDQP237HWGTU7RUXZHVYA7QM62P7N3B4P5G25XJ7SND7PL64PKUSDC',
            amount: 200,
            splitRatio: 50,
            unlockDate: Math.floor(Date.now() / 1000) - 3600,
            timestamp: Math.floor(Date.now() / 1000) - 3600 * 24
          }
        ];
        localStorage.setItem(`allocations_${senderAddress}`, JSON.stringify(demoHistory));
        setAllocations(demoHistory);
      }
    } catch (err) {
      console.error('Failed to load history', err);
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
    refreshHistory: fetchHistory
  };
};
