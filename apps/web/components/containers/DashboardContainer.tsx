'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Handshake } from 'lucide-react';
import { useWalletContext } from '@/context/WalletContext';
import { useDashboardTransactions } from '@/hooks/useDashboardTransactions';
import { useBucketBalances } from '@/hooks/useBucketBalances';
import { useWithdraw } from '@/hooks/useWithdraw';
import { useXlmPrice } from '@/hooks/useXlmPrice';
import { useDeposit } from '@/hooks/useDeposit';
import Header from '@/components/ui/layout/Header';
import Footer from '@/components/ui/layout/Footer';
import DepositForm from '@/components/ui/deposit/DepositForm';
import SpendingBucketCard from '@/components/ui/buckets/SpendingBucketCard';
import GoalBucketCard from '@/components/ui/buckets/GoalBucketCard';
import DashboardHistoryList from '@/components/ui/history/DashboardHistoryList';
import { SummaryCard } from '@/components/ui/dashboard/SummaryCard';
import TransactionStatus from '@/components/ui/feedback/TransactionStatus';
import { formatXlmWithUsd } from '@/lib/utils/price';
import { DepositFormInputs } from '@/types/transaction';
import { toast } from 'sonner';

export default function DashboardContainer() {
  const router = useRouter();
  const { publicKey, isConnected, isConnecting, disconnect, connect } = useWalletContext();
  
  // Custom states for navigation and tabs
  const [activeMode, setActiveMode] = useState<'sender' | 'receiver'>('sender');
  const [activeTab, setActiveTab] = useState<'all' | 'received' | 'sent'>('all');
  const [currentTime, setCurrentTime] = useState<number>(0);

  // Load XLM Price
  const { priceUsd } = useXlmPrice();

  // Load Transactions (both Sent and Received)
  const { 
    allTransactions, 
    sentTransactions, 
    receivedTransactions, 
    isLoading: txLoading,
    refreshTransactions 
  } = useDashboardTransactions(publicKey);

  // Load Bucket Balances (for Receiver Mode)
  const { 
    balances, 
    isLoading: balancesLoading, 
    error: fetchError, 
    refreshBalances 
  } = useBucketBalances(publicKey);

  // Withdrawal hook
  const { 
    withdraw, 
    isWithdrawing, 
    error: withdrawError, 
    txHash: withdrawTxHash 
  } = useWithdraw(publicKey, (hash) => {
    refreshBalances();
    refreshTransactions();
    toast.success('Withdrawal Successful!', {
      description: `Confirmed on testnet: ${hash.slice(0, 8)}...${hash.slice(-8)}`,
      action: {
        label: 'View Tx',
        onClick: () => window.open(`https://stellar.expert/explorer/testnet/tx/${hash}`, '_blank')
      },
      duration: 10000
    });
  });
 
  // Deposit hook
  const { 
    deposit, 
    isSubmitting: isDepositing, 
    errors: depositErrors, 
    txError: depositTxError 
  } = useDeposit(publicKey, (hash) => {
    refreshTransactions();
    toast.success('Deposit Split Completed!', {
      description: `Confirmed on testnet: ${hash.slice(0, 8)}...${hash.slice(-8)}`,
      action: {
        label: 'View Tx',
        onClick: () => window.open(`https://stellar.expert/explorer/testnet/tx/${hash}`, '_blank')
      },
      duration: 10000
    });
  });

  // Real-time polling for transactions, balances, and current time
  useEffect(() => {
    // Initial time set
    setCurrentTime(Math.floor(Date.now() / 1000));

    // Poll every 5 seconds for real-time background updates
    const interval = setInterval(() => {
      setCurrentTime(Math.floor(Date.now() / 1000));
      if (isConnected) {
        refreshBalances(true); // silent refresh
        refreshTransactions(true); // silent refresh
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isConnected, refreshBalances, refreshTransactions]);

  // Redirect if wallet gets disconnected
  useEffect(() => {
    if (!isConnected && !isConnecting) {
      router.push('/');
    }
  }, [isConnected, isConnecting, router]);

  if (!isConnected) {
    return (
      <div className="flex justify-center items-center h-screen bg-background-warm">
        <span className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></span>
      </div>
    );
  }

  // Sender Metrics
  const totalRemitted = sentTransactions.reduce((acc, curr) => acc + curr.amount, 0);
  const activeLocks = sentTransactions.filter((a) => a.unlockDate > currentTime).length;

  const handleDepositSubmit = async (inputs: DepositFormInputs): Promise<boolean> => {
    return await deposit(inputs);
  };

  const handleWithdrawSpending = (bucketId: number, amount: number) => {
    withdraw(bucketId, 'spending', amount);
  };

  const handleWithdrawGoal = (bucketId: number, amount: number) => {
    withdraw(bucketId, 'goal', amount);
  };

  const showWithdrawStatus = isWithdrawing !== null || withdrawError;

  // Filter history based on active tab
  const getFilteredAllocations = () => {
    if (activeTab === 'sent') return sentTransactions;
    if (activeTab === 'received') return receivedTransactions;
    return allTransactions;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background-warm text-on-surface">
      <Header
        publicKey={publicKey}
        isConnected={isConnected}
        isConnecting={isConnecting}
        onConnect={connect}
        onDisconnect={disconnect}
      />

      <main className="flex-grow max-w-7xl w-full mx-auto px-6 py-8 space-y-8">
        
        {/* Toggle Mode Buttons */}
        <div className="flex justify-center">
          <div className="bg-surface-container p-1 rounded-2xl flex gap-1 border border-outline-variant/60 shadow-sm">
            <button
              onClick={() => setActiveMode('sender')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all border-0 cursor-pointer ${
                activeMode === 'sender'
                  ? 'bg-primary text-white shadow-md'
                  : 'text-on-surface-variant hover:text-primary hover:bg-white/50'
              }`}
            >
              <Send size={16} />
              Send Money (Sender)
            </button>
            <button
              onClick={() => setActiveMode('receiver')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all border-0 cursor-pointer ${
                activeMode === 'receiver'
                  ? 'bg-secondary text-white shadow-md'
                  : 'text-on-surface-variant hover:text-secondary hover:bg-white/50'
              }`}
            >
              <Handshake size={16} />
              Receive Money (Receiver)
            </button>
          </div>
        </div>

        {/* Dashboard Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Form or Vaults */}
          <div className="lg:col-span-7 space-y-6">
            {activeMode === 'sender' ? (
              <>
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
                    subtitle="Locked on-chain"
                  />
                  <SummaryCard
                    title="Total Deposits"
                    value={`${sentTransactions.length}`}
                    subtitle="Historical split deposits"
                  />
                </section>

                {/* XLM Send Form */}
                <section className="animate-[fadeIn_200ms_ease-out]">
                  <DepositForm
                    onDeposit={handleDepositSubmit}
                    isSubmitting={isDepositing}
                    validationErrors={depositErrors}
                    txError={depositTxError}
                  />
                </section>
              </>
            ) : (
              <>
                {/* Withdrawal Status Overlay */}
                {showWithdrawStatus && (
                  <TransactionStatus
                    status={isWithdrawing !== null ? 'pending' : withdrawError ? 'error' : 'success'}
                    hash={withdrawTxHash}
                    errorMsg={withdrawError}
                  />
                )}

                {/* Error Loading Balances */}
                {fetchError && (
                  <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 text-sm">
                    <strong>Error loading bucket balances:</strong> {fetchError}. Please ensure you are on the Stellar Testnet.
                  </div>
                )}

                {/* Vaults/Buckets */}
                {balancesLoading && (!balances || balances.length === 0) ? (
                  <div className="flex justify-center items-center py-20 bg-white rounded-xl border border-outline-variant">
                    <span className="w-12 h-12 border-4 border-secondary border-t-transparent rounded-full animate-spin"></span>
                  </div>
                ) : !balances || balances.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-2xl border border-outline-variant shadow-sm p-6">
                    <p className="text-on-surface-variant font-medium text-lg">No active buckets found</p>
                    <p className="text-on-surface-variant text-xs mt-1">Once a sender deposits funds for you, they will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-8 animate-[fadeIn_200ms_ease-out]">
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
              </>
            )}
          </div>

          {/* Right Column: Transaction History with Filter Tabs */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Centered Filter Tabs */}
            <div className="flex justify-center bg-surface-container/60 p-1 rounded-xl border border-outline-variant/60">
              <button
                onClick={() => setActiveTab('all')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all border-0 cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveTab('received')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all border-0 cursor-pointer ${
                  activeTab === 'received'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                Received
              </button>
              <button
                onClick={() => setActiveTab('sent')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all border-0 cursor-pointer ${
                  activeTab === 'sent'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                Sent/Deposit
              </button>
            </div>

            {/* List */}
            <DashboardHistoryList
              allocations={getFilteredAllocations()}
              isLoading={txLoading}
              currentUserAddress={publicKey}
            />
          </div>

        </div>

      </main>

      <Footer />
    </div>
  );
}
