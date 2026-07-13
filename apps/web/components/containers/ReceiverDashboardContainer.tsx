'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SpendingBucketCard from '@/components/ui/buckets/SpendingBucketCard';
import GoalBucketCard from '@/components/ui/buckets/GoalBucketCard';
import WalletAddressBadge from '@/components/ui/wallet/WalletAddressBadge';
import TransactionStatus from '@/components/ui/feedback/TransactionStatus';
import { useWalletContext } from '@/context/WalletContext';
import { useBucketBalances } from '@/hooks/useBucketBalances';
import { useWithdraw } from '@/hooks/useWithdraw';

export default function ReceiverDashboardContainer() {
  const router = useRouter();
  const { publicKey, isConnected, disconnect } = useWalletContext();
  const { balances, isLoading, error: fetchError, refreshBalances } = useBucketBalances(publicKey);
  const { withdraw, isWithdrawing, error: withdrawError, txHash } = useWithdraw(publicKey, () => {
    refreshBalances();
  });

  useEffect(() => {
    if (!isConnected) {
      router.push('/');
    }
  }, [isConnected, router]);

  if (!isConnected) {
    return (
      <div className="flex justify-center items-center h-screen">
        <span className="w-12 h-12 border-4 border-secondary border-t-transparent rounded-full animate-spin"></span>
      </div>
    );
  }

  const handleWithdrawSpending = (amount: number) => {
    withdraw('spending', amount);
  };

  const handleWithdrawGoal = (amount: number) => {
    withdraw('goal', amount);
  };

  const showWithdrawStatus = isWithdrawing || txHash || withdrawError;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 flex-grow w-full">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-outline-variant shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/')}
            className="p-2 hover:bg-surface-container rounded-lg transition-colors cursor-pointer text-on-surface-variant border-0"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h1 className="text-xl font-bold text-secondary flex items-center gap-2">
              <span className="material-symbols-outlined text-[24px]">handshake</span>
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
          status={isWithdrawing ? 'pending' : withdrawError ? 'error' : 'success'}
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
      {isLoading && !balances ? (
        <div className="flex justify-center items-center py-20">
          <span className="w-12 h-12 border-4 border-secondary border-t-transparent rounded-full animate-spin"></span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SpendingBucketCard
            balance={balances?.spendingBalance ?? 0}
            onWithdraw={handleWithdrawSpending}
            isWithdrawing={isWithdrawing}
          />
          <GoalBucketCard
            balance={balances?.goalBalance ?? 0}
            unlockDate={balances?.unlockDate ?? 0}
            onWithdraw={handleWithdrawGoal}
            isWithdrawing={isWithdrawing}
          />
        </div>
      )}
    </div>
  );
}
