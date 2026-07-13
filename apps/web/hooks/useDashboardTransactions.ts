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

      // Merge local storage for received if it exists
      const localRecStr = localStorage.getItem(`received_${address}`);
      const localRec: DepositAllocation[] = localRecStr ? JSON.parse(localRecStr) : [];

      const recMap = new Map<string, DepositAllocation>();
      localRec.forEach(a => recMap.set(a.id, a));
      received.forEach(e => recMap.set(e.id, e));
      const finalReceived = Array.from(recMap.values()).sort((a, b) => b.timestamp - a.timestamp);

      // Cache received transactions locally
      localStorage.setItem(`received_${address}`, JSON.stringify(finalReceived));

      // Save to local state
      setSentTransactions(finalSent);
      setReceivedTransactions(finalReceived);

      // Merge and sort all transactions
      const merged = [...finalSent, ...finalReceived].sort((a, b) => b.timestamp - a.timestamp);
      setAllTransactions(merged);
    } catch (err) {
      console.error('Failed to fetch dashboard transactions:', err);
      // Fallback to local storage for both sent and received
      const localSentStr = localStorage.getItem(`allocations_${address}`);
      const localSent: DepositAllocation[] = localSentStr ? JSON.parse(localSentStr) : [];
      const finalSent = localSent.sort((a, b) => b.timestamp - a.timestamp);

      const localRecStr = localStorage.getItem(`received_${address}`);
      const localRec: DepositAllocation[] = localRecStr ? JSON.parse(localRecStr) : [];
      const finalReceived = localRec.sort((a, b) => b.timestamp - a.timestamp);

      setSentTransactions(finalSent);
      setReceivedTransactions(finalReceived);
      
      const merged = [...finalSent, ...finalReceived].sort((a, b) => b.timestamp - a.timestamp);
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
