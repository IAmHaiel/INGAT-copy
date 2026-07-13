import { useState, useEffect, useCallback } from 'react';
import { DepositAllocation } from '@/types/transaction';
import { fetchDepositEvents, fetchReceivedDepositEvents } from '@/lib/stellar/contract';

export const useDashboardTransactions = (address: string | null) => {
  const [sentTransactions, setSentTransactions] = useState<DepositAllocation[]>([]);
  const [receivedTransactions, setReceivedTransactions] = useState<DepositAllocation[]>([]);
  const [allTransactions, setAllTransactions] = useState<DepositAllocation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchTransactions = useCallback(async () => {
    if (!address) {
      setSentTransactions([]);
      setReceivedTransactions([]);
      setAllTransactions([]);
      return;
    }
    setIsLoading(true);
    try {
      // Fetch both in parallel
      const [sent, received] = await Promise.all([
        fetchDepositEvents(address),
        fetchReceivedDepositEvents(address),
      ]);

      // Merge local storage for sent if it exists (for optimistic UI / fast updates)
      const localSentStr = localStorage.getItem(`allocations_${address}`);
      const localSent: DepositAllocation[] = localSentStr ? JSON.parse(localSentStr) : [];
      
      const sentMap = new Map<string, DepositAllocation>();
      localSent.forEach(a => sentMap.set(a.id, a));
      sent.forEach(e => sentMap.set(e.id, e));
      const finalSent = Array.from(sentMap.values()).sort((a, b) => b.timestamp - a.timestamp);

      // Save to local state
      setSentTransactions(finalSent);
      setReceivedTransactions(received);

      // Merge and sort all transactions
      const merged = [...finalSent, ...received].sort((a, b) => b.timestamp - a.timestamp);
      setAllTransactions(merged);
    } catch (err) {
      console.error('Failed to fetch dashboard transactions:', err);
      // Fallback to local storage for sent
      const localSentStr = localStorage.getItem(`allocations_${address}`);
      const localSent: DepositAllocation[] = localSentStr ? JSON.parse(localSentStr) : [];
      const finalSent = localSent.sort((a, b) => b.timestamp - a.timestamp);
      setSentTransactions(finalSent);
      
      const merged = [...finalSent].sort((a, b) => b.timestamp - a.timestamp);
      setAllTransactions(merged);
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) {
        fetchTransactions();
      }
    });
    return () => {
      active = false;
    };
  }, [address, fetchTransactions]);

  return {
    allTransactions,
    sentTransactions,
    receivedTransactions,
    isLoading,
    refreshTransactions: fetchTransactions,
  };
};
