'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send } from 'lucide-react';
import AllocationHistoryList from '@/components/ui/history/AllocationHistoryList';
import WalletAddressBadge from '@/components/ui/wallet/WalletAddressBadge';
import { SummaryCard } from '@/components/ui/dashboard/SummaryCard';
import { useWalletContext } from '@/context/WalletContext';
import { useAllocationHistory } from '@/hooks/useAllocationHistory';
import { useXlmPrice } from '@/hooks/useXlmPrice';
import { formatXlmWithUsd } from '@/lib/utils/price';

export default function SenderDashboardContainer() {
  const router = useRouter();
  const { publicKey, isConnected, isInitializing, disconnect } = useWalletContext();
  const { allocations, isLoading: historyLoading } = useAllocationHistory(publicKey);
  const { priceUsd } = useXlmPrice();
  const [currentTime, setCurrentTime] = useState<number>(0);

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
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 flex-grow w-full">
      {/* Dashboard Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-outline-variant shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/')}
            className="p-2 hover:bg-surface-container rounded-lg transition-colors cursor-pointer text-on-surface-variant border-0 flex items-center justify-center"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-primary flex items-center gap-2">
              <Send size={24} />
              Sender Dashboard
            </h1>
            <p className="text-xs text-on-surface-variant mt-0.5">Manage splits, lock savings, and track allocation history.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 self-end md:self-auto">
          <WalletAddressBadge address={publicKey} onDisconnect={disconnect} />
        </div>
      </header>

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
          onClick={() => router.push('/sender/deposit')}
          className="bg-secondary-container text-on-secondary-container font-black py-3 px-6 rounded-xl transition-all hover:brightness-110 active:scale-95 cursor-pointer shadow-md text-sm border-0"
        >
          Create Split Remittance
        </button>
      </section>

      {/* History */}
      <section>
        <AllocationHistoryList allocations={allocations} isLoading={historyLoading} />
      </section>
    </div>
  );
}
