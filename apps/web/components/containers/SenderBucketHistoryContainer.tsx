'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, History, RefreshCw, Layers } from 'lucide-react';
import { useWalletContext } from '@/context/WalletContext';
import { useBucketHistory, EnrichedBucketEntry } from '@/hooks/useBucketHistory';
import BucketHistoryTable from '@/components/ui/history/BucketHistoryTable';
import BucketDetailDrawer from '@/components/ui/history/BucketDetailDrawer';

export default function SenderBucketHistoryContainer() {
  const router = useRouter();
  const { publicKey, isConnected, isInitializing } = useWalletContext();
  
  const {
    entries,
    isLoading,
    error,
    refreshHistory,
  } = useBucketHistory(publicKey);

  const [selectedEntry, setSelectedEntry] = useState<EnrichedBucketEntry | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    if (isInitializing) return;
    if (!isConnected) {
      router.push('/');
    }
  }, [isConnected, isInitializing, router]);

  if (!isConnected) {
    return (
      <div className="flex justify-center items-center h-screen bg-background-warm">
        <span className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></span>
      </div>
    );
  }

  const handleOpenDrawer = (entry: EnrichedBucketEntry) => {
    setSelectedEntry(entry);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    // Don't clear selectedEntry immediately to allow exit animation to finish
  };

  const handleContactSaved = () => {
    refreshHistory();
  };

  // Metrics derivation
  const totalEntries = entries.length;
  const lockedEntries = entries.filter((e) => e.status === 'locked').length;
  const withdrawnEntries = entries.filter((e) => e.status === 'withdrawn').length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 flex-grow w-full">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-outline-variant shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/sender')}
            className="p-2 hover:bg-surface-container rounded-lg transition-colors cursor-pointer text-on-surface-variant border-0 bg-transparent flex items-center justify-center"
            title="Back to Sender Dashboard"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-primary flex items-center gap-2">
              <History size={24} />
              Remittance Bucket History
            </h1>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Comprehensive list of all spending and goal splits you have allocated on-chain.
            </p>
          </div>
        </div>
        
        <button
          onClick={() => refreshHistory()}
          disabled={isLoading}
          className="flex items-center gap-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface font-bold text-xs py-2 px-4 rounded-lg border border-outline-variant transition-colors disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          Refresh History
        </button>
      </header>

      {/* Quick Metrics Grid */}
      <section className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-outline-variant shadow-sm text-center">
          <span className="text-[10px] text-on-surface-variant font-medium block uppercase tracking-wider">Total Buckets</span>
          <span className="text-xl font-black text-on-surface mt-1 block">{totalEntries}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-outline-variant shadow-sm text-center">
          <span className="text-[10px] text-on-surface-variant font-medium block uppercase tracking-wider">Active Timelocks</span>
          <span className="text-xl font-black text-secondary mt-1 block">{lockedEntries}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-outline-variant shadow-sm text-center">
          <span className="text-[10px] text-on-surface-variant font-medium block uppercase tracking-wider">Fully Claimed</span>
          <span className="text-xl font-black text-gray-500 mt-1 block">{withdrawnEntries}</span>
        </div>
      </section>

      {/* Main List */}
      <main className="space-y-4">
        {isLoading && entries.length === 0 ? (
          <div className="flex justify-center items-center py-20 bg-white rounded-2xl border border-outline-variant">
            <span className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></span>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-700 p-5 rounded-2xl border border-red-200 text-xs">
            <strong>Error loading bucket history:</strong> {error}
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-outline-variant shadow-sm p-6 space-y-3">
            <div className="bg-primary/5 p-4 rounded-full w-14 h-14 flex items-center justify-center mx-auto text-primary">
              <Layers size={28} />
            </div>
            <div>
              <p className="text-on-surface-variant font-bold text-base">No Remittances Found</p>
              <p className="text-on-surface-variant text-xs mt-1">
                You haven&apos;t deposited or created any vault split buckets yet.
              </p>
            </div>
            <button
              onClick={() => router.push('/sender/deposit')}
              className="bg-primary text-white font-bold text-xs py-2.5 px-5 rounded-lg border-0 shadow-sm cursor-pointer hover:brightness-105 active:scale-95 transition-all inline-block"
            >
              Send Your First Remittance
            </button>
          </div>
        ) : (
          <BucketHistoryTable entries={entries} onSelectEntry={handleOpenDrawer} />
        )}
      </main>

      {/* Slide-over Detail Drawer */}
      <BucketDetailDrawer
        key={selectedEntry?.id || 'none'}
        entry={selectedEntry}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        onContactSaved={handleContactSaved}
      />
    </div>
  );
}
