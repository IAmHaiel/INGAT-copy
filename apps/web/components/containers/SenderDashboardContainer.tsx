'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AllocationHistoryList from '@/components/ui/history/AllocationHistoryList';
import { SummaryCard } from '@/components/ui/dashboard/SummaryCard';
import { useWalletContext } from '@/context/WalletContext';
import { useAllocationHistory } from '@/hooks/useAllocationHistory';
import { useXlmPrice } from '@/hooks/useXlmPrice';
import { formatXlmWithUsd } from '@/lib/utils/price';
import { useSenderBuckets } from '@/hooks/useSenderBuckets';
import { useToast } from '@/context/ToastContext';
import SenderBucketCard from '@/components/ui/dashboard/SenderBucketCard';
import TransactionStatus from '@/components/ui/feedback/TransactionStatus';
import Header from '../ui/layout/Header';
import Footer from '../ui/layout/Footer';

export default function SenderDashboardContainer() {
  const router = useRouter();
  const { showToast } = useToast();
  const { publicKey, isConnected, isConnecting, isInitializing, connect, disconnect } = useWalletContext();
  const { allocations, isLoading: historyLoading, refreshHistory } = useAllocationHistory(publicKey);
  const {
    buckets,
    isLoading: bucketsLoading,
    error: bucketsError,
    withdrawSenderGoal,
    isWithdrawing,
    withdrawError,
    txHash,
  } = useSenderBuckets(publicKey);
  const { priceUsd } = useXlmPrice();
  const [currentTime, setCurrentTime] = useState<number>(0);

  const handleWithdrawSenderGoal = async (receiverAddress: string, bucketId: number, amount: number) => {
    const bucket = buckets.find(b => b.id === bucketId && b.receiverAddress === receiverAddress);
    const success = await withdrawSenderGoal(receiverAddress, bucketId, amount, bucket?.unlockDate);
    if (success) {
      refreshHistory();
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      setCurrentTime(Math.floor(Date.now() / 1000));
    });
  }, []);

  useEffect(() => {
    if (isInitializing) return;
    if (!isConnected) {
      router.push('/');
    }
  }, [isConnected, isInitializing, router]);

  useEffect(() => {
    if (txHash) {
      showToast({
        type: 'success',
        title: 'Withdrawal Completed',
        message: 'Successfully withdrew goal amount to wallet.',
        txHash,
      });
    }
  }, [txHash, showToast]);

  useEffect(() => {
    if (withdrawError) {
      showToast({
        type: 'error',
        title: 'Withdrawal Failed',
        message: withdrawError,
      });
    }
  }, [withdrawError, showToast]);

  if (!isConnected) {
    return (
      <div className="flex justify-center items-center h-screen">
        <span className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></span>
      </div>
    );
  }

  const totalRemitted = allocations.reduce((acc, curr) => acc + curr.amount, 0);
  const activeLocks = allocations.filter((a) => a.unlockDate > currentTime).length;

  return (
    <>
    <Header
      publicKey={publicKey}
      isConnected={isConnected}
      isConnecting={isConnecting}
      onConnect={connect}
      onDisconnect={disconnect}
    />
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 flex-grow w-full">
      {/* Transaction Feedbacks */}
      {(isWithdrawing !== null || txHash || withdrawError) && (
        <TransactionStatus
          status={isWithdrawing !== null ? 'pending' : withdrawError ? 'error' : 'success'}
          hash={txHash}
          errorMsg={withdrawError}
        />
      )}

      {/* Metrics Row */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard
          title="Total Remitted"
          value={`${totalRemitted.toLocaleString(undefined, { minimumFractionDigits: 2 })} XLM`}
          subtitle={priceUsd > 0 ? formatXlmWithUsd(totalRemitted, priceUsd) : 'Loading price...'}
        />
        <SummaryCard
          title="Active Locked Goals"
          value={`${activeLocks} Goals`}
          subtitle="Currently locked on-chain"
        />
        <SummaryCard
          title="Total Allocations"
          value={`${allocations.length}`}
          subtitle="Historical deposits"
        />
      </section>

      {/* Action Row */}
      <section className="bg-primary p-6 rounded-2xl text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-md border-0">
        <div className="space-y-1">
          <h2 className="text-lg font-bold">Need to send a new remittance?</h2>
          <p className="text-xs text-on-primary-container/85">Configure split percentages and protect emergency/tuition savings immediately.</p>
        </div>
        <button
          onClick={() => router.push('/sender')}
          className="bg-secondary-container text-on-secondary-container font-black py-3 px-6 rounded-xl transition-all hover:brightness-110 active:scale-95 cursor-pointer shadow-md text-sm border-0"
        >
          Create Split Remittance
        </button>
      </section>

      {/* Active Buckets */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-on-surface">Your Deposited Vault Buckets</h2>
            {buckets.length > 0 && (
              <span className="text-[11px] bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full">
                {buckets.length} Active
              </span>
            )}
          </div>
          <button
            onClick={() => router.push('/dashboard/buckets')}
            className="text-xs font-bold text-secondary hover:text-secondary-dark hover:underline bg-transparent border-0 cursor-pointer flex items-center gap-0.5"
          >
            View Full History →
          </button>
        </div>

        {bucketsLoading && buckets.length === 0 ? (
          <div className="flex justify-center items-center py-8">
            <span className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
          </div>
        ) : bucketsError ? (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 text-xs">
            Error fetching bucket balances: {bucketsError}
          </div>
        ) : buckets.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-outline-variant shadow-sm p-5">
            <p className="text-on-surface-variant font-semibold text-sm">No active vault buckets found</p>
            <p className="text-on-surface-variant text-[11px] mt-0.5">Deposits you send will show live on-chain balances here.</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[500px] overflow-y-auto p-2 border border-outline-variant rounded-2xl bg-surface-container/20">
            {buckets.map((bucket) => (
              <SenderBucketCard
                key={`${bucket.receiverAddress}-${bucket.id}`}
                id={bucket.id}
                receiverAddress={bucket.receiverAddress}
                spendingBalance={bucket.spendingBalance}
                goalBalance={bucket.goalBalance}
                unlockDate={bucket.unlockDate}
                onWithdrawGoal={handleWithdrawSenderGoal}
                isWithdrawing={isWithdrawing === bucket.id}
              />
            ))}
          </div>
        )}
      </section>

      {/* History */}
      <section className="space-y-4">
        <AllocationHistoryList allocations={allocations} isLoading={historyLoading} />
      </section>
    </div>
    <Footer />
    </>
  );
}
