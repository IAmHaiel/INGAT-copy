'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Handshake } from 'lucide-react';
import SpendingBucketCard from '@/components/ui/buckets/SpendingBucketCard';
import GoalBucketCard from '@/components/ui/buckets/GoalBucketCard';
import WalletAddressBadge from '@/components/ui/wallet/WalletAddressBadge';
import TransactionStatus from '@/components/ui/feedback/TransactionStatus';
import { useWalletContext } from '@/context/WalletContext';
import { useBucketBalances } from '@/hooks/useBucketBalances';
import { useWithdraw } from '@/hooks/useWithdraw';
import { fetchReceivedTransactions } from '@/lib/supabase';
import { TransactionRow } from '@/lib/supabase/types';
import { toast } from 'sonner';

export default function ReceiverDashboardContainer() {
  const router = useRouter();
  const { 
    publicKey, 
    isConnected, 
    isInitializing,
    disconnect, 
    isAuthenticating, 
    authError, 
    authenticate,
    supabaseClient
  } = useWalletContext();
  const { balances, isLoading, error: fetchError, refreshBalances } = useBucketBalances(publicKey);
  const { withdraw, isWithdrawing, error: withdrawError, txHash } = useWithdraw(publicKey, () => {
    refreshBalances();
  });
  const [depositRecords, setDepositRecords] = useState<TransactionRow[]>([]);

  const fetchDeposits = useCallback(async () => {
    if (!supabaseClient || !publicKey) return;
    try {
      const rows = await fetchReceivedTransactions(publicKey, supabaseClient);
      setDepositRecords(rows.filter(r => r.type === 'deposit'));
    } catch (err) {
      console.error('Failed to fetch deposit records for goal labels:', err);
    }
  }, [publicKey, supabaseClient]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDeposits();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchDeposits]);

  /**
   * Look up the goal label for a bucket by matching sender address and unlock date.
   */
  const getGoalLabel = (senderAddress: string, unlockDate: number): string | null => {
    const match = depositRecords.find(
      r => r.sender_address === senderAddress && r.unlock_date === unlockDate
    );
    return match?.goal_label ?? null;
  };

  useEffect(() => {
    if (isInitializing) return;
    if (!isConnected) {
      router.push('/');
    }
  }, [isConnected, isInitializing, router]);

  useEffect(() => {
    if (txHash) {
      toast.success('Withdrawal Completed', {
        description: 'Successfully withdrew from receiver bucket.',
        action: {
          label: 'View Tx',
          onClick: () => window.open(`https://stellar.expert/explorer/testnet/tx/${txHash}`, '_blank')
        },
        duration: 10000
      });
    }
  }, [txHash]);

  useEffect(() => {
    if (withdrawError) {
      toast.error('Withdrawal Failed', {
        description: withdrawError,
        duration: 5000
      });
    }
  }, [withdrawError]);

  if (!isConnected || (isAuthenticating && !supabaseClient)) {
    return (
      <div className="flex justify-center items-center h-screen">
        <span className="w-12 h-12 border-4 border-secondary border-t-transparent rounded-full animate-spin"></span>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-background-warm px-4">
        <div className="bg-white p-8 rounded-2xl border border-outline-variant shadow-lg max-w-md w-full text-center space-y-6 animate-[fadeIn_200ms_ease-out]">
          <div className="bg-amber-50 text-amber-600 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto border border-amber-100">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-secondary">Signature Required</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              We need your secure signature to authenticate and load your protected vault buckets.
            </p>
            {authError !== 'The user rejected this request.' && (
              <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-100 mt-2 font-mono break-words">
                {authError}
              </p>
            )}
          </div>
          <button
            onClick={() => publicKey && authenticate(publicKey)}
            disabled={isAuthenticating}
            className="w-full bg-secondary text-white py-3 rounded-lg font-bold transition-all active:scale-95 cursor-pointer shadow-md hover:shadow-lg border-0 disabled:opacity-50"
          >
            {isAuthenticating ? 'Waiting for signature...' : 'Sign Authentication Message'}
          </button>
          <button
            onClick={disconnect}
            className="text-xs text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer border-0 bg-transparent"
          >
            Disconnect Wallet
          </button>
        </div>
      </div>
    );
  }

  const handleWithdrawSpending = (bucketId: number, amount: number) => {
    const bucket = balances.find(b => b.id === bucketId);
    withdraw(bucketId, 'spending', amount, bucket?.unlockDate);
  };

  const handleWithdrawGoal = (bucketId: number, amount: number) => {
    const bucket = balances.find(b => b.id === bucketId);
    withdraw(bucketId, 'goal', amount, bucket?.unlockDate);
  };

  const showWithdrawStatus = isWithdrawing !== null || txHash || withdrawError;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 flex-grow w-full animate-fade-in">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-outline-variant shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/')}
            className="p-2 hover:bg-surface-container rounded-lg transition-colors cursor-pointer text-on-surface-variant border-0 flex items-center justify-center"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-secondary flex items-center gap-2">
              <Handshake size={24} />
              Receiver Dashboard
            </h1>
            <p className="text-xs text-on-surface-variant mt-0.5">Access split funds, check lock timers, and withdraw savings.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 self-end md:self-auto">
          <WalletAddressBadge address={publicKey} onDisconnect={disconnect} />
        </div>
      </header>

      {/* Transaction Feedbacks */}
      {showWithdrawStatus && (
        <TransactionStatus
          status={isWithdrawing !== null ? 'pending' : withdrawError ? 'error' : 'success'}
          hash={txHash}
          errorMsg={withdrawError}
        />
      )}

      {/* Error state if fetch fails */}
      {fetchError && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 text-sm">
          <strong>Error loading bucket balances:</strong> {fetchError}. Please make sure you are on Stellar Testnet and have registered contract state.
        </div>
      )}

      {/* Buckets Grid */}
      {isLoading && (!balances || balances.length === 0) ? (
        <div className="flex justify-center items-center py-20">
          <span className="w-12 h-12 border-4 border-secondary border-t-transparent rounded-full animate-spin"></span>
        </div>
      ) : !balances || balances.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-outline-variant shadow-sm p-6">
          <p className="text-on-surface-variant font-medium text-lg">No active buckets found</p>
          <p className="text-on-surface-variant text-xs mt-1">Once a sender deposits funds for you, they will appear here.</p>
        </div>
      ) : (
        <div className="space-y-6 max-h-[550px] overflow-y-auto p-4 border border-outline-variant rounded-2xl bg-surface-container/20">
          {balances.map((bucket) => (
            <div key={bucket.id} className="bg-white p-6 rounded-2xl border border-outline-variant shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-outline-variant pb-3 mb-2">
                <div className="flex items-center gap-2">
                  <span className="bg-secondary/10 text-secondary text-xs font-semibold px-2.5 py-1 rounded-full">
                    Bucket #{bucket.id + 1}
                  </span>
                  <span className="text-xs text-on-surface-variant font-medium">
                    Sender: <span className="inline-block max-w-[150px] sm:max-w-none truncate font-mono bg-surface-container px-2 py-0.5 rounded text-[11px] select-all align-middle" title={bucket.sender}>{bucket.sender}</span>
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SpendingBucketCard
                  balance={bucket.spendingBalance}
                  onWithdraw={(amount) => handleWithdrawSpending(bucket.id, amount)}
                  isWithdrawing={isWithdrawing === bucket.id}
                />
                <GoalBucketCard
                  balance={bucket.goalBalance}
                  unlockDate={bucket.unlockDate}
                  goalLabel={getGoalLabel(bucket.sender, bucket.unlockDate)}
                  onWithdraw={(amount) => handleWithdrawGoal(bucket.id, amount)}
                  isWithdrawing={isWithdrawing === bucket.id}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
