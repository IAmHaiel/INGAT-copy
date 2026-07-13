import { useState, useEffect, useCallback } from 'react';
import { DepositAllocation } from '@/types/transaction';
import { fetchSentTransactions } from '@/lib/supabase';
import { TransactionRow } from '@/lib/supabase/types';
import { useWalletContext } from '@/context/WalletContext';

/**
 * Map a Supabase TransactionRow to the frontend DepositAllocation shape.
 */
function toDepositAllocation(row: TransactionRow): DepositAllocation {
  return {
    id: row.tx_hash,
    sender: row.sender_address,
    receiver: row.receiver_address,
    amount: Number(row.amount),
    splitRatio: row.split_ratio ?? 0,
    unlockDate: row.unlock_date ?? 0,
    timestamp: Math.floor(new Date(row.created_at).getTime() / 1000),
  };
}

export const useAllocationHistory = (senderAddress: string | null) => {
  const { supabaseClient } = useWalletContext();
  const [allocations, setAllocations] = useState<DepositAllocation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchHistory = useCallback(async () => {
    if (!senderAddress) {
      setAllocations([]);
      return;
    }
    setIsLoading(true);
    try {
      const rows = await fetchSentTransactions(senderAddress, supabaseClient);
      // Only show deposit-type transactions in allocation history
      const deposits = rows.filter(r => r.type === 'deposit');
      setAllocations(deposits.map(toDepositAllocation));
    } catch (err) {
      console.error('Failed to fetch allocation history from Supabase:', err);
      setAllocations([]);
    } finally {
      setIsLoading(false);
    }
  }, [senderAddress, supabaseClient]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) {
        fetchHistory();
      }
    });
    return () => {
      active = false;
    };
  }, [senderAddress, fetchHistory]);

  return {
    allocations,
    isLoading,
    refreshHistory: fetchHistory,
  };
};
