'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Handshake } from 'lucide-react';
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

  const handleWithdrawSpending = (bucketId: number, amount: number) => {
    withdraw(bucketId, 'spending', amount);
  };

  const handleWithdrawGoal = (bucketId: number, amount: number) => {
    withdraw(bucketId, 'goal', amount);
  };

  const showWithdrawStatus = isWithdrawing !== null || txHash || withdrawError;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 flex-grow w-full">
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
        <div className="space-y-8">
          {balances.map((bucket) => (
            <div key={bucket.id} className="bg-white p-6 rounded-2xl border border-outline-variant shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-outline-variant pb-3 mb-2">
                <div className="flex items-center gap-2">
                  <span className="bg-secondary/10 text-secondary text-xs font-semibold px-2.5 py-1 rounded-full">
                    Bucket #{bucket.id + 1}
                  </span>
                  <span className="text-xs text-on-surface-variant font-medium">
                    Sender: <span className="font-mono bg-surface-container px-2 py-0.5 rounded text-[11px] select-all">{bucket.sender}</span>
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
