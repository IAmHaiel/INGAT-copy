'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWalletContext } from '@/context/WalletContext';
import { useDashboardTransactions } from '@/hooks/useDashboardTransactions';
import Header from '../ui/layout/Header';
import Footer from '../ui/layout/Footer';
import DepositFormContainer from './DepositFormContainer';
import DashboardHistoryList from '@/components/ui/history/DashboardHistoryList';
import { History, Send, Coins } from 'lucide-react';

export default function SenderFormPageContainer() {
  const router = useRouter();
  const { publicKey, isConnected, isConnecting, isInitializing, connect, disconnect } = useWalletContext();
  
  const {
    allTransactions,
    sentTransactions,
    receivedTransactions,
    isLoading: isHistoryLoading,
  } = useDashboardTransactions(publicKey);

  const [historyTab, setHistoryTab] = useState<'all' | 'sent' | 'received'>('all');

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

  // Determine active transactions based on historyTab state
  const activeTransactions = 
    historyTab === 'all' 
      ? allTransactions 
      : historyTab === 'sent' 
        ? sentTransactions 
        : receivedTransactions;

  return (
    <>
      <Header
        publicKey={publicKey}
        isConnected={isConnected}
        isConnecting={isConnecting}
        onConnect={connect}
        onDisconnect={disconnect}
      />
      <div className="max-w-7xl mx-auto px-4 py-8 flex-grow w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Form */}
          <div className="lg:col-span-7 xl:col-span-7 w-full">
            <DepositFormContainer />
          </div>

          {/* Right Column: Transaction History (Desktop Only) */}
          <div className="hidden lg:block lg:col-span-5 xl:col-span-5 w-full sticky top-8 space-y-4">
            {/* Header matches DepositFormContainer header */}
            <header className="flex justify-between items-center bg-white p-4 rounded-2xl border border-outline-variant shadow-sm">
              <div className="flex items-center gap-2">
                <History size={20} className="text-primary" />
                <h1 className="text-base font-bold text-primary">Live Transactions</h1>
              </div>

              {/* mini tabs inside header */}
              <div className="flex bg-surface-container px-1 py-0.5 rounded-lg border border-outline-variant text-[11px] font-semibold">
                <button
                  onClick={() => setHistoryTab('all')}
                  className={`px-2.5 py-1 rounded transition-colors cursor-pointer border-0 ${
                    historyTab === 'all'
                      ? 'bg-white text-on-surface shadow-sm font-bold'
                      : 'text-on-surface-variant bg-transparent hover:text-on-surface'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setHistoryTab('sent')}
                  className={`px-2.5 py-1 rounded transition-colors cursor-pointer border-0 flex items-center gap-1 ${
                    historyTab === 'sent'
                      ? 'bg-white text-on-surface shadow-sm font-bold'
                      : 'text-on-surface-variant bg-transparent hover:text-on-surface'
                  }`}
                >
                  <Send size={10} />
                  Sent
                </button>
                <button
                  onClick={() => setHistoryTab('received')}
                  className={`px-2.5 py-1 rounded transition-colors cursor-pointer border-0 flex items-center gap-1 ${
                    historyTab === 'received'
                      ? 'bg-white text-on-surface shadow-sm font-bold'
                      : 'text-on-surface-variant bg-transparent hover:text-on-surface'
                  }`}
                >
                  <Coins size={10} />
                  Received
                </button>
              </div>
            </header>
            
            {/* Body Card matches DepositForm container card */}
            <div className="bg-white p-6 rounded-xl border border-outline-variant shadow-md">
              <div className="max-h-[480px] overflow-y-auto overflow-x-auto">
                <div className="min-w-[480px]">
                  <DashboardHistoryList
                    allocations={activeTransactions}
                    isLoading={isHistoryLoading}
                    currentUserAddress={publicKey}
                    variant="plain"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
