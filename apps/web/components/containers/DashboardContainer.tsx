'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Coins, Send, ShieldAlert } from 'lucide-react';
import { useWalletContext } from '@/context/WalletContext';
import { useXlmPrice } from '@/hooks/useXlmPrice';
import { useUrlTab } from '@/hooks/useUrlTab';
import { usePagination } from '@/hooks/usePagination';
import { useSentDashboardData } from '@/hooks/composed/useSentDashboardData';
import { useReceivedDashboardData } from '@/hooks/composed/useReceivedDashboardData';
import { useTxSuccessToast, useTxErrorToast } from '@/hooks/useTransactionToast';
import { getActiveEmergencyRequest } from '@/lib/supabase';
import { toast } from 'sonner';

// UI components
import Header from '../ui/layout/Header';
import Footer from '../ui/layout/Footer';
import SentDashboardView from '../ui/dashboard/SentDashboardView';
import ReceivedDashboardView from '../ui/dashboard/ReceivedDashboardView';
import EarlyAccessView from '../ui/dashboard/EarlyAccessView';

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

  const [tab, setTab] = useUrlTab<'sent' | 'received' | 'alerts'>('sent', ['sent', 'received', 'alerts']);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const { priceUsd } = useXlmPrice();

  const sentData = useSentDashboardData(publicKey, supabaseClient);
  const receivedData = useReceivedDashboardData(publicKey);

  const sentPagination = usePagination(sentData.sentBuckets, 5);
  const receivedPagination = usePagination(receivedData.receivedBalances, 5);

  // Setup transaction success and error toasts
  useTxSuccessToast(sentData.senderTxHash, 'Withdrawal Completed', 'Successfully withdrew goal amount to wallet.');
  useTxErrorToast(sentData.senderWithdrawError, 'Withdrawal Failed');
  
  useTxSuccessToast(receivedData.receiverTxHash, 'Withdrawal Completed', 'Successfully withdrew from receiver bucket.');
  useTxErrorToast(receivedData.receiverWithdrawError, 'Withdrawal Failed');

  useTxErrorToast(sentData.senderEmergencyError, 'Sender Emergency Action Failed');
  useTxErrorToast(receivedData.receiverEmergencyError, 'Receiver Emergency Action Failed');

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
      <div className="flex justify-center items-center h-screen bg-background-warm">
        <span className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></span>
      </div>
    );
  }

  // Sent calculations
  const totalSent = sentData.sentAllocations.reduce((acc, curr) => acc + curr.amount, 0);
  const activeSentLocks = sentData.sentAllocations.filter((a) => a.unlockDate > currentTime).length;

  // Received calculations
  const totalReceived = receivedData.receivedTransactions.reduce((acc, curr) => acc + curr.amount, 0);
  const activeReceivedLocks = receivedData.receivedBalances.filter((b) => b.goalBalance > 0 && b.unlockDate > currentTime).length;

  const handleWithdrawSenderGoal = async (receiverAddress: string, bucketId: number, amount: number) => {
    const bucket = sentData.sentBuckets.find(b => b.id === bucketId && b.receiverAddress === receiverAddress);
    const success = await sentData.withdrawSenderGoal(receiverAddress, bucketId, amount, bucket?.unlockDate);
    if (success) {
      sentData.refreshSentHistory();
    }
  };

  const handleWithdrawSpending = (bucketId: number, amount: number) => {
    const bucket = receivedData.receivedBalances.find(b => b.id === bucketId);
    receivedData.withdrawReceived(bucketId, 'spending', amount, bucket?.unlockDate);
  };

  const handleWithdrawGoal = (bucketId: number, amount: number) => {
    const bucket = receivedData.receivedBalances.find(b => b.id === bucketId);
    receivedData.withdrawReceived(bucketId, 'goal', amount, bucket?.unlockDate);
  };

  const getGoalLabel = (senderAddress: string, unlockDate: number): string | null => {
    const match = receivedData.receivedTransactions.find(
      r => r.sender === senderAddress && r.unlockDate === unlockDate
    );
    return match?.goalLabel ?? null;
  };

  const getSenderGoalLabel = (receiverAddress: string, bucketId: number): string | null => {
    const match = sentData.sentBuckets.find(
      b => b.receiverAddress === receiverAddress && b.id === bucketId
    );
    return match?.goalLabel ?? null;
  };

  const alertCount = sentData.senderPendingRequests.length + receivedData.receivedBalances.filter(b => b.emergencyRequest && b.emergencyRequest.status === 'Pending').length;

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
            onClick={() => setTab('sent')}
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
            onClick={() => setTab('received')}
            className={`pb-3 font-bold text-sm border-b-2 transition-all cursor-pointer bg-transparent border-0 flex items-center gap-2 ${
              tab === 'received'
                ? 'border-secondary text-secondary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Coins size={16} />
            Received
          </button>
          <button
            onClick={() => setTab('alerts')}
            className={`pb-3 font-bold text-sm border-b-2 transition-all cursor-pointer bg-transparent border-0 flex items-center gap-2 ${
              tab === 'alerts'
                ? 'border-amber-600 text-amber-600'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <ShieldAlert size={16} />
            Early Access
            {alertCount > 0 && (
              <span className="bg-amber-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none flex items-center justify-center">
                {alertCount}
              </span>
            )}
          </button>
        </div>

        {tab === 'sent' ? (
          <SentDashboardView
            publicKey={publicKey}
            totalSent={totalSent}
            activeSentLocks={activeSentLocks}
            sentAllocations={sentData.sentAllocations}
            sentHistoryLoading={sentData.sentHistoryLoading}
            sentBuckets={sentData.sentBuckets}
            sentBucketsLoading={sentData.sentBucketsLoading}
            sentBucketsError={sentData.sentBucketsError}
            paginatedSentBuckets={sentPagination.paginatedItems}
            sentBucketsPage={sentPagination.page}
            totalSentBucketsPages={sentPagination.totalPages}
            isSenderWithdrawing={sentData.isSenderWithdrawing}
            senderTxHash={sentData.senderTxHash}
            senderWithdrawError={sentData.senderWithdrawError}
            isSenderEmergencyLoading={sentData.isSenderEmergencyLoading}
            priceUsd={priceUsd}
            onWithdrawGoal={handleWithdrawSenderGoal}
            onCancelEmergency={async (receiverAddr, bId) => {
              try {
                const req = await getActiveEmergencyRequest(receiverAddr, bId, supabaseClient);
                if (req) {
                  await sentData.senderCancelEmergency(receiverAddr, bId, req.tx_hash);
                } else {
                  toast.error('No active emergency request found in database.');
                }
              } catch (err) {
                console.error(err);
                toast.error('Failed to cancel emergency request.');
              }
            }}
            onPrevPage={sentPagination.goPrev}
            onNextPage={sentPagination.goNext}
            onNavigateToSender={() => router.push('/sender')}
            onNavigateToBuckets={() => router.push('/dashboard/buckets?tab=sent')}
          />
        ) : tab === 'received' ? (
          <ReceivedDashboardView
            publicKey={publicKey}
            totalReceived={totalReceived}
            activeReceivedLocks={activeReceivedLocks}
            receivedTransactions={receivedData.receivedTransactions}
            receivedHistoryLoading={receivedData.receivedHistoryLoading}
            receivedBalances={receivedData.receivedBalances}
            receivedBalancesLoading={receivedData.receivedBalancesLoading}
            receivedBalancesError={receivedData.receivedBalancesError}
            paginatedReceivedBalances={receivedPagination.paginatedItems}
            receivedBucketsPage={receivedPagination.page}
            totalReceivedBucketsPages={receivedPagination.totalPages}
            isReceiverWithdrawing={receivedData.isReceiverWithdrawing}
            receiverTxHash={receivedData.receiverTxHash}
            receiverWithdrawError={receivedData.receiverWithdrawError}
            isReceiverEmergencyLoading={receivedData.isReceiverEmergencyLoading}
            priceUsd={priceUsd}
            isAuthenticating={isAuthenticating}
            authError={authError}
            supabaseClient={supabaseClient}
            onSign={() => publicKey && authenticate(publicKey)}
            onRefreshBalances={() => receivedData.refreshBalances(false)}
            onWithdrawSpending={handleWithdrawSpending}
            onWithdrawGoal={handleWithdrawGoal}
            onRequestEmergency={(bucketId, amount, sender) => receivedData.requestEmergency(bucketId, amount, sender)}
            onCancelEmergency={(bucketId) => receivedData.cancelEmergencyReceiver(bucketId)}
            onExecuteEmergency={(bucketId, amount) => receivedData.executeEmergency(bucketId, amount)}
            onPrevPage={receivedPagination.goPrev}
            onNextPage={receivedPagination.goNext}
            onNavigateToBuckets={() => router.push('/dashboard/buckets?tab=received')}
            getGoalLabel={getGoalLabel}
          />
        ) : (
          <EarlyAccessView
            senderPendingRequests={sentData.senderPendingRequests}
            onSenderCancel={async (receiverAddr, bId) => {
              try {
                const req = await getActiveEmergencyRequest(receiverAddr, bId, supabaseClient);
                if (req) {
                  await sentData.senderCancelEmergency(receiverAddr, bId, req.tx_hash);
                } else {
                  toast.error('No active emergency request found in database.');
                }
              } catch (err) {
                console.error(err);
                toast.error('Failed to cancel emergency request.');
              }
            }}
            isSenderCancelLoading={sentData.isSenderEmergencyLoading}
            getGoalLabel={getSenderGoalLabel}
            receivedBalances={receivedData.receivedBalances}
            onReceiverCancel={(bucketId) => {
              receivedData.cancelEmergencyReceiver(bucketId);
            }}
            onReceiverExecute={(bucketId, amount) => {
              receivedData.executeEmergency(bucketId, amount);
            }}
            isReceiverEmergencyLoading={receivedData.isReceiverEmergencyLoading}
            getReceivedGoalLabel={getGoalLabel}
          />
        )}
      </div>
      <Footer />
    </>
  );
}
