'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Coins, Send, RefreshCw, ArrowRight } from 'lucide-react';
import { useWalletContext } from '@/context/WalletContext';
import { useAllocationHistory } from '@/hooks/useAllocationHistory';
import { useXlmPrice } from '@/hooks/useXlmPrice';
import { formatXlmWithUsd } from '@/lib/utils/price';
import { useSenderBuckets } from '@/hooks/useSenderBuckets';
import { useBucketBalances } from '@/hooks/useBucketBalances';
import { useWithdraw } from '@/hooks/useWithdraw';
import { useDashboardTransactions } from '@/hooks/useDashboardTransactions';
import { toast } from 'sonner';

// UI components
import Header from '../ui/layout/Header';
import Footer from '../ui/layout/Footer';
import { SummaryCard } from '@/components/ui/dashboard/SummaryCard';
import SenderBucketCard from '@/components/ui/dashboard/SenderBucketCard';
import SpendingBucketCard from '@/components/ui/buckets/SpendingBucketCard';
import GoalBucketCard from '@/components/ui/buckets/GoalBucketCard';
import DashboardHistoryList from '@/components/ui/history/DashboardHistoryList';
import TransactionStatus from '@/components/ui/feedback/TransactionStatus';

export default function DashboardContainer() {
  const router = useRouter();
  const {
    publicKey,
    isConnected,
    isConnecting,
    isInitializing,
    connect,
    disconnect,
    isAuthenticating,
    authError,
    authenticate,
    supabaseClient,
  } = useWalletContext();

  const [tab, setTab] = useState<'sent' | 'received'>('sent');
  const [currentTime, setCurrentTime] = useState<number>(0);

  // Pagination states for buckets
  const [sentBucketsPage, setSentBucketsPage] = useState(1);
  const [receivedBucketsPage, setReceivedBucketsPage] = useState(1);
  const bucketsPerPage = 5;

  // Sender data hooks
  const { allocations: sentAllocations, isLoading: sentHistoryLoading, refreshHistory: refreshSentHistory } = useAllocationHistory(publicKey);
  const {
    buckets: sentBuckets,
    isLoading: sentBucketsLoading,
    error: sentBucketsError,
    withdrawSenderGoal,
    isWithdrawing: isSenderWithdrawing,
    withdrawError: senderWithdrawError,
    txHash: senderTxHash,
  } = useSenderBuckets(publicKey);

  // Receiver data hooks
  const { balances: receivedBalances, isLoading: receivedBalancesLoading, error: receivedBalancesError, refreshBalances } = useBucketBalances(publicKey);
  const { receivedTransactions, isLoading: receivedHistoryLoading, refreshTransactions } = useDashboardTransactions(publicKey);
  const { withdraw: withdrawReceived, isWithdrawing: isReceiverWithdrawing, error: receiverWithdrawError, txHash: receiverTxHash } = useWithdraw(publicKey, () => {
    refreshBalances();
    refreshTransactions(true);
  });

  const { priceUsd } = useXlmPrice();

  useEffect(() => {
    setSentBucketsPage(1);
  }, [sentBuckets.length]);

  useEffect(() => {
    setReceivedBucketsPage(1);
  }, [receivedBalances.length]);

  // Paginated buckets calculations
  const totalSentBucketsPages = Math.ceil(sentBuckets.length / bucketsPerPage);
  const paginatedSentBuckets = sentBuckets.slice(
    (sentBucketsPage - 1) * bucketsPerPage,
    sentBucketsPage * bucketsPerPage
  );

  const totalReceivedBucketsPages = Math.ceil(receivedBalances.length / bucketsPerPage);
  const paginatedReceivedBalances = receivedBalances.slice(
    (receivedBucketsPage - 1) * bucketsPerPage,
    receivedBucketsPage * bucketsPerPage
  );

  useEffect(() => {
    Promise.resolve().then(() => {
      setCurrentTime(Math.floor(Date.now() / 1000));
    });
  }, []);

  // Synchronize active tab with URL query parameter
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
  };

  const handleWithdrawSenderGoal = async (receiverAddress: string, bucketId: number, amount: number) => {
    const bucket = sentBuckets.find(b => b.id === bucketId && b.receiverAddress === receiverAddress);
    const success = await withdrawSenderGoal(receiverAddress, bucketId, amount, bucket?.unlockDate);
    if (success) {
      refreshSentHistory();
    }
  };

  const handleWithdrawSpending = (bucketId: number, amount: number) => {
    const bucket = receivedBalances.find(b => b.id === bucketId);
    withdrawReceived(bucketId, 'spending', amount, bucket?.unlockDate);
  };

  const handleWithdrawGoal = (bucketId: number, amount: number) => {
    const bucket = receivedBalances.find(b => b.id === bucketId);
    withdrawReceived(bucketId, 'goal', amount, bucket?.unlockDate);
  };

  useEffect(() => {
    if (senderTxHash) {
      toast.success('Withdrawal Completed', {
        description: 'Successfully withdrew goal amount to wallet.',
        action: {
          label: 'View Tx',
          onClick: () => window.open(`https://stellar.expert/explorer/testnet/tx/${senderTxHash}`, '_blank')
        },
        duration: 10000
      });
    }
  }, [senderTxHash]);

  useEffect(() => {
    if (senderWithdrawError) {
      toast.error('Withdrawal Failed', {
        description: senderWithdrawError,
        duration: 5000
      });
    }
  }, [senderWithdrawError]);

  useEffect(() => {
    if (receiverTxHash) {
      toast.success('Withdrawal Completed', {
        description: 'Successfully withdrew from receiver bucket.',
        action: {
          label: 'View Tx',
          onClick: () => window.open(`https://stellar.expert/explorer/testnet/tx/${receiverTxHash}`, '_blank')
        },
        duration: 10000
      });
    }
  }, [receiverTxHash]);

  useEffect(() => {
    if (receiverWithdrawError) {
      toast.error('Withdrawal Failed', {
        description: receiverWithdrawError,
        duration: 5000
      });
    }
  }, [receiverWithdrawError]);

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

  // Sent calculations
  const totalSent = sentAllocations.reduce((acc, curr) => acc + curr.amount, 0);
  const activeSentLocks = sentAllocations.filter((a) => a.unlockDate > currentTime).length;

  // Received calculations
  const totalReceived = receivedTransactions.reduce((acc, curr) => acc + curr.amount, 0);
  const activeReceivedLocks = receivedBalances.filter((b) => b.goalBalance > 0 && b.unlockDate > currentTime).length;

  const showSenderFeedback = isSenderWithdrawing !== null || senderTxHash || senderWithdrawError;
  const showReceiverFeedback = isReceiverWithdrawing !== null || receiverTxHash || receiverWithdrawError;

  return (
    <>
      <Header
        publicKey={publicKey}
        isConnected={isConnected}
        isConnecting={isConnecting}
        onConnect={connect}
        onDisconnect={disconnect}
      />
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 flex-grow w-full animate-fade-in">
        {/* Tab Toggle Navigation */}
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
            Sent / Deposit
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
            Received
          </button>
        </div>

        {tab === 'sent' ? (
          /* Sent Flow */
          <div className="space-y-6 animate-[fadeIn_150ms_ease-out]">
            {/* Feedback message */}
            {showSenderFeedback && (
              <TransactionStatus
                status={isSenderWithdrawing !== null ? 'pending' : senderWithdrawError ? 'error' : 'success'}
                hash={senderTxHash}
                errorMsg={senderWithdrawError}
              />
            )}

            {/* Metrics */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SummaryCard
                title="Total Remitted"
                value={`${totalSent.toLocaleString(undefined, { minimumFractionDigits: 2 })} XLM`}
                subtitle={priceUsd > 0 ? formatXlmWithUsd(totalSent, priceUsd) : 'Loading price...'}
              />
              <SummaryCard
                title="Active Locked Goals"
                value={`${activeSentLocks} Goals`}
                subtitle="Currently locked on-chain"
              />
              <SummaryCard
                title="Total Allocations"
                value={`${sentAllocations.length}`}
                subtitle="Historical deposits"
              />
            </section>

            {/* CTA Banner */}
            <section className="bg-primary p-6 rounded-2xl text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-md border-0">
              <div className="space-y-1">
                <h2 className="text-lg font-bold">Need to send a new remittance?</h2>
                <p className="text-xs text-on-primary-container/85">Configure split percentages and protect emergency/tuition savings immediately.</p>
              </div>
              <button
                onClick={() => router.push('/sender')}
                className="bg-secondary-container text-on-secondary-container font-black py-3 px-6 rounded-xl transition-all hover:brightness-110 active:scale-95 cursor-pointer shadow-md text-sm border-0 flex items-center gap-1.5"
              >
                Create Split Remittance
                <ArrowRight size={14} />
              </button>
            </section>

            {/* Active Buckets */}
            <section className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-on-surface">Your Deposited Vault Buckets</h2>
                  {sentBuckets.length > 0 && (
                    <span className="text-[11px] bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full">
                      {sentBuckets.length} Active
                    </span>
                  )}
                </div>
                <button
                  onClick={() => router.push('/dashboard/buckets?tab=sent')}
                  className="text-xs font-bold text-secondary hover:text-secondary-dark hover:underline bg-transparent border-0 cursor-pointer flex items-center gap-0.5"
                >
                  View Full History →
                </button>
              </div>

              {sentBucketsLoading && sentBuckets.length === 0 ? (
                <div className="flex justify-center items-center py-8">
                  <span className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                </div>
              ) : sentBucketsError ? (
                <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 text-xs">
                  Error fetching bucket balances: {sentBucketsError}
                </div>
              ) : sentBuckets.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-2xl border border-outline-variant shadow-sm p-5">
                  <p className="text-on-surface-variant font-semibold text-sm">No active vault buckets found</p>
                  <p className="text-on-surface-variant text-[11px] mt-0.5">Deposits you send will show live on-chain balances here.</p>
                </div>
              ) : (
                <div className="space-y-4 flex flex-col">
                  {totalSentBucketsPages > 1 && (
                    <div className="md:hidden flex items-center justify-between bg-white px-4 py-2.5 rounded-xl border border-outline-variant shadow-sm text-xs font-semibold mb-2">
                      <button
                        onClick={() => setSentBucketsPage(prev => Math.max(prev - 1, 1))}
                        disabled={sentBucketsPage === 1}
                        className="px-3 py-1.5 rounded-lg border border-outline-variant bg-white text-on-surface hover:bg-surface-container-high transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        Previous
                      </button>
                      <span className="text-on-surface-variant">
                        Page {sentBucketsPage} of {totalSentBucketsPages}
                      </span>
                      <button
                        onClick={() => setSentBucketsPage(prev => Math.min(prev + 1, totalSentBucketsPages))}
                        disabled={sentBucketsPage === totalSentBucketsPages}
                        className="px-3 py-1.5 rounded-lg border border-outline-variant bg-white text-on-surface hover:bg-surface-container-high transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        Next
                      </button>
                    </div>
                  )}

                  <div className="space-y-4 max-h-[500px] overflow-y-auto p-2 border border-outline-variant rounded-2xl bg-surface-container/20">
                    {paginatedSentBuckets.map((bucket) => (
                      <SenderBucketCard
                        key={`${bucket.receiverAddress}-${bucket.id}`}
                        id={bucket.id}
                        receiverAddress={bucket.receiverAddress}
                        spendingBalance={bucket.spendingBalance}
                        goalBalance={bucket.goalBalance}
                        unlockDate={bucket.unlockDate}
                        onWithdrawGoal={handleWithdrawSenderGoal}
                        isWithdrawing={isSenderWithdrawing === bucket.id}
                      />
                    ))}
                  </div>

                  {totalSentBucketsPages > 1 && (
                    <div className="hidden md:flex items-center justify-between bg-white px-4 py-2.5 rounded-xl border border-outline-variant shadow-sm text-xs font-semibold">
                      <button
                        onClick={() => setSentBucketsPage(prev => Math.max(prev - 1, 1))}
                        disabled={sentBucketsPage === 1}
                        className="px-3 py-1.5 rounded-lg border border-outline-variant bg-white text-on-surface hover:bg-surface-container-high transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        Previous
                      </button>
                      <span className="text-on-surface-variant">
                        Page {sentBucketsPage} of {totalSentBucketsPages}
                      </span>
                      <button
                        onClick={() => setSentBucketsPage(prev => Math.min(prev + 1, totalSentBucketsPages))}
                        disabled={sentBucketsPage === totalSentBucketsPages}
                        className="px-3 py-1.5 rounded-lg border border-outline-variant bg-white text-on-surface hover:bg-surface-container-high transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* History */}
            <section className="space-y-4">
              <DashboardHistoryList
                allocations={sentAllocations}
                isLoading={sentHistoryLoading}
                currentUserAddress={publicKey}
                title="Allocation History"
              />
            </section>
          </div>
        ) : (
          /* Received Flow */
          <div className="space-y-6 animate-[fadeIn_150ms_ease-out]">
            {isAuthenticating && !supabaseClient ? (
              /* Inline Authentication Guard for Received Section */
              <div className="bg-white p-8 rounded-2xl border border-outline-variant shadow-lg max-w-md mx-auto text-center space-y-6">
                <div className="bg-amber-50 text-amber-600 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto border border-amber-100">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                  </svg>
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-secondary">Signature Required</h2>
                  <p className="text-sm text-on-primary-container leading-relaxed">
                    We need your secure signature to authenticate and load your protected vault buckets.
                  </p>
                  {authError && authError !== 'The user rejected this request.' && (
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
              </div>
            ) : (
              <>
                {/* Feedback message */}
                {showReceiverFeedback && (
                  <TransactionStatus
                    status={isReceiverWithdrawing !== null ? 'pending' : receiverWithdrawError ? 'error' : 'success'}
                    hash={receiverTxHash}
                    errorMsg={receiverWithdrawError}
                  />
                )}

                {/* Metrics */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <SummaryCard
                    title="Total Received"
                    value={`${totalReceived.toLocaleString(undefined, { minimumFractionDigits: 2 })} XLM`}
                    subtitle={priceUsd > 0 ? formatXlmWithUsd(totalReceived, priceUsd) : 'Loading price...'}
                  />
                  <SummaryCard
                    title="Active Timelock Buckets"
                    value={`${activeReceivedLocks} Buckets`}
                    subtitle="Funds currently locked on-chain"
                  />
                  <SummaryCard
                    title="Total Received Splits"
                    value={`${receivedTransactions.length}`}
                    subtitle="Historical split remittances"
                  />
                </section>

                {/* CTA Banner */}
                <section className="bg-secondary p-6 rounded-2xl text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-md border-0">
                  <div className="space-y-1">
                    <h2 className="text-lg font-bold">Expecting a remittance?</h2>
                    <p className="text-xs text-on-primary">Refresh your wallet balance to query the smart contract for new incoming split remittances.</p>
                  </div>
                  <button
                    onClick={() => refreshBalances(false)}
                    disabled={receivedBalancesLoading}
                    className="bg-secondary-container text-on-secondary-container font-black py-3 px-6 rounded-xl transition-all hover:brightness-110 active:scale-95 cursor-pointer shadow-md text-sm border-0 flex items-center gap-1.5"
                  >
                    <RefreshCw size={14} className={receivedBalancesLoading ? 'animate-spin' : ''} />
                    Refresh Buckets
                  </button>
                </section>

                {/* Active Buckets */}
                <section className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-on-surface">Your Received Vault Buckets</h2>
                      {receivedBalances.length > 0 && (
                        <span className="text-[11px] bg-secondary/10 text-secondary font-semibold px-2 py-0.5 rounded-full">
                          {receivedBalances.length} Active
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => router.push('/dashboard/buckets?tab=received')}
                      className="text-xs font-bold text-secondary hover:text-secondary-dark hover:underline bg-transparent border-0 cursor-pointer flex items-center gap-0.5"
                    >
                      View Full History →
                    </button>
                  </div>

                  {receivedBalancesLoading && receivedBalances.length === 0 ? (
                    <div className="flex justify-center items-center py-8">
                      <span className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin"></span>
                    </div>
                  ) : receivedBalancesError ? (
                    <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 text-xs">
                      Error fetching bucket balances: {receivedBalancesError}
                    </div>
                  ) : receivedBalances.length === 0 ? (
                    <div className="text-center py-10 bg-white rounded-2xl border border-outline-variant shadow-sm p-5">
                      <p className="text-on-surface-variant font-semibold text-sm">No active received buckets found</p>
                      <p className="text-on-surface-variant text-[11px] mt-0.5">When someone remits funds to your address, they will show up here.</p>
                    </div>
                  ) : (
                    <div className="space-y-4 flex flex-col">
                      {totalReceivedBucketsPages > 1 && (
                        <div className="md:hidden flex items-center justify-between bg-white px-4 py-2.5 rounded-xl border border-outline-variant shadow-sm text-xs font-semibold mb-2">
                          <button
                            onClick={() => setReceivedBucketsPage(prev => Math.max(prev - 1, 1))}
                            disabled={receivedBucketsPage === 1}
                            className="px-3 py-1.5 rounded-lg border border-outline-variant bg-white text-on-surface hover:bg-surface-container-high transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                          >
                            Previous
                          </button>
                          <span className="text-on-surface-variant">
                            Page {receivedBucketsPage} of {totalReceivedBucketsPages}
                          </span>
                          <button
                            onClick={() => setReceivedBucketsPage(prev => Math.min(prev + 1, totalReceivedBucketsPages))}
                            disabled={receivedBucketsPage === totalReceivedBucketsPages}
                            className="px-3 py-1.5 rounded-lg border border-outline-variant bg-white text-on-surface hover:bg-surface-container-high transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                          >
                            Next
                          </button>
                        </div>
                      )}

                      <div className="space-y-6 max-h-[550px] overflow-y-auto p-4 border border-outline-variant rounded-2xl bg-surface-container/20">
                        {paginatedReceivedBalances.map((bucket) => (
                          <div key={bucket.id} className="bg-white p-6 rounded-2xl border border-outline-variant shadow-sm space-y-4">
                            <div className="flex items-center justify-between border-b border-outline-variant pb-3 mb-2">
                              <div className="flex items-center gap-2">
                                <span className="bg-secondary/10 text-secondary text-xs font-semibold px-2.5 py-1 rounded-full">
                                  Bucket #{bucket.id + 1}
                                </span>
                                <span className="text-xs text-on-surface-variant font-medium">
                                  Sender:{' '}
                                  <span
                                    className="inline-block max-w-[150px] sm:max-w-none truncate font-mono bg-surface-container px-2 py-0.5 rounded text-[11px] select-all align-middle"
                                    title={bucket.sender}
                                  >
                                    {bucket.sender}
                                  </span>
                                </span>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <SpendingBucketCard
                                balance={bucket.spendingBalance}
                                onWithdraw={(amount) => handleWithdrawSpending(bucket.id, amount)}
                                isWithdrawing={isReceiverWithdrawing === bucket.id}
                              />
                              <GoalBucketCard
                                balance={bucket.goalBalance}
                                unlockDate={bucket.unlockDate}
                                onWithdraw={(amount) => handleWithdrawGoal(bucket.id, amount)}
                                isWithdrawing={isReceiverWithdrawing === bucket.id}
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      {totalReceivedBucketsPages > 1 && (
                        <div className="hidden md:flex items-center justify-between bg-white px-4 py-2.5 rounded-xl border border-outline-variant shadow-sm text-xs font-semibold">
                          <button
                            onClick={() => setReceivedBucketsPage(prev => Math.max(prev - 1, 1))}
                            disabled={receivedBucketsPage === 1}
                            className="px-3 py-1.5 rounded-lg border border-outline-variant bg-white text-on-surface hover:bg-surface-container-high transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                          >
                            Previous
                          </button>
                          <span className="text-on-surface-variant">
                            Page {receivedBucketsPage} of {totalReceivedBucketsPages}
                          </span>
                          <button
                            onClick={() => setReceivedBucketsPage(prev => Math.min(prev + 1, totalReceivedBucketsPages))}
                            disabled={receivedBucketsPage === totalReceivedBucketsPages}
                            className="px-3 py-1.5 rounded-lg border border-outline-variant bg-white text-on-surface hover:bg-surface-container-high transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                          >
                            Next
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </section>

                {/* History */}
                <section className="space-y-4">
                  <DashboardHistoryList
                    allocations={receivedTransactions}
                    isLoading={receivedHistoryLoading}
                    currentUserAddress={publicKey}
                  />
                </section>
              </>
            )}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
