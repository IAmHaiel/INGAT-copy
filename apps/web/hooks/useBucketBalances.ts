import { useState, useEffect, useCallback } from 'react';
import { fetchBucketBalances } from '@/lib/stellar/contract';
import { BucketState } from '@/types/bucket';

export const useBucketBalances = (receiverAddress: string | null) => {
  const [balances, setBalances] = useState<BucketState | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refreshBalances = useCallback(async () => {
    if (!receiverAddress) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchBucketBalances(receiverAddress);
      if (res) {
        setBalances(res);
      } else {
        setError('Failed to fetch bucket balances');
      }
    } catch (err) {
      setError('Error connecting to Stellar node');
    } finally {
      setIsLoading(false);
    }
  }, [receiverAddress]);

  useEffect(() => {
    refreshBalances();
  }, [receiverAddress, refreshBalances]);

  return {
    balances,
    isLoading,
    error,
    refreshBalances
  };
};
