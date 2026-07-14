'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, History, RefreshCw, Layers, Send, Coins } from 'lucide-react';
import { useWalletContext } from '@/context/WalletContext';
import { useBucketHistory, EnrichedBucketEntry } from '@/hooks/useBucketHistory';
import { useReceiverBucketHistory } from '@/hooks/useReceiverBucketHistory';
import BucketHistoryTable from '@/components/ui/history/BucketHistoryTable';
import BucketDetailDrawer from '@/components/ui/history/BucketDetailDrawer';

export default function BucketHistoryPageContainer() {
  const router = useRouter();
  const { publicKey, isConnected, isInitializing } = useWalletContext();
  
  const [tab, setTab] = useState<'sent' | 'received'>('sent');

  // Sent bucket history data
  const {
    entries: sentEntries,
    isLoading: sentLoading,
    error: sentError,
    refreshHistory: refreshSentHistory,
  } = useBucketHistory(publicKey);

  // Received bucket history data
  const {
    entries: receivedEntries,
    isLoading: receivedLoading,
    error: receivedError,
    refreshHistory: refreshReceivedHistory,
  } = useReceiverBucketHistory(publicKey);

  const [selectedEntry, setSelectedEntry] = useState<EnrichedBucketEntry | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Synchronize active tab with URL query parameter on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('tab');
    if (t === 'received' || t === 'sent') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTab(t);
    }
  }, []);

  const handleTabChange = (newTab: 'sent' | 'received') => {
    setTab(newTab);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', newTab);
    window.history.pushState({}, '', url.pathname + url.search);
    setSelectedEntry(null);
    setIsDrawerOpen(false);
  };

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
  };

  const handleContactSaved = () => {
    if (tab === 'sent') {
      refreshSentHistory();
    } else {
      refreshReceivedHistory();
    }
  };

  // Derive active tab data
  const activeEntries = tab === 'sent' ? sentEntries : receivedEntries;
  const isLoading = tab === 'sent' ? sentLoading : receivedLoading;
  const error = tab === 'sent' ? sentError : receivedError;
  const refreshHistory = tab === 'sent' ? refreshSentHistory : refreshReceivedHistory;

  // Metrics derivation
  const totalEntries = activeEntries.length;
  const lockedEntries = activeEntries.filter((e) => e.status === 'locked').length;
  const withdrawnEntries = activeEntries.filter((e) => e.status === 'withdrawn').length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 flex-grow w-full">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-outline-variant shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/dashboard?tab=${tab}`)}
            className="p-2 hover:bg-surface-container rounded-lg transition-colors cursor-pointer text-on-surface-variant border-0 bg-transparent flex items-center justify-center"
            title="Back to Dashboard"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-primary flex items-center gap-2">
              <History size={24} />
              Vault Bucket History
            </h1>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {tab === 'sent' 
                ? 'Comprehensive list of all spending and goal splits you have allocated on-chain.'
                : 'Comprehensive list of all spending and goal splits you have received on-chain.'}
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

      {/* Tab Navigation */}
      <div className="border-b border-outline-variant flex gap-4">
        <button
          onClick={() => handleTabChange('sent')}
          className={`pb-3 font-bold text-sm border-b-2 transition-all cursor-pointer bg-transparent border-0 flex items-center gap-2 ${
            tab === 'sent'
              ? 'border-primary text-primary'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <Send size={16} />
          Sent Remittances
        </button>
        <button
          onClick={() => handleTabChange('received')}
          className={`pb-3 font-bold text-sm border-b-2 transition-all cursor-pointer bg-transparent border-0 flex items-center gap-2 ${
            tab === 'received'
              ? 'border-secondary text-secondary'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <Coins size={16} />
          Received Remittances
        </button>
      </div>

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
        {isLoading && activeEntries.length === 0 ? (
          <div className="flex justify-center items-center py-20 bg-white rounded-2xl border border-outline-variant">
            <span className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></span>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-700 p-5 rounded-2xl border border-red-200 text-xs">
            <strong>Error loading bucket history:</strong> {error}
          </div>
        ) : activeEntries.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-outline-variant shadow-sm p-6 space-y-3">
            <div className="bg-primary/5 p-4 rounded-full w-14 h-14 flex items-center justify-center mx-auto text-primary">
              <Layers size={28} />
            </div>
            <div>
              <p className="text-on-surface-variant font-bold text-base">
                {tab === 'sent' ? 'No Sent Remittances Found' : 'No Received Remittances Found'}
              </p>
              <p className="text-on-surface-variant text-xs mt-1">
                {tab === 'sent' 
                  ? "You haven't deposited or created any vault split buckets yet."
                  : "You haven't received any vault split deposits yet."}
              </p>
            </div>
            {tab === 'sent' && (
              <button
                onClick={() => router.push('/sender')}
                className="bg-primary text-white font-bold text-xs py-2.5 px-5 rounded-lg border-0 shadow-sm cursor-pointer hover:brightness-105 active:scale-95 transition-all inline-block"
              >
                Send Your First Remittance
              </button>
            )}
          </div>
        ) : (
          <BucketHistoryTable 
            entries={activeEntries} 
            onSelectEntry={handleOpenDrawer} 
            mode={tab} 
          />
        )}
      </main>

      {/* Slide-over Detail Drawer */}
      <BucketDetailDrawer
        key={selectedEntry?.id || 'none'}
        entry={selectedEntry}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        onContactSaved={handleContactSaved}
        mode={tab}
      />
    </div>
  );
}
