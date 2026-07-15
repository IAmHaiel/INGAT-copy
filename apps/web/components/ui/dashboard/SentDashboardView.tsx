import React from 'react';
import { ArrowRight } from 'lucide-react';
import { SummaryCard } from '@/components/ui/dashboard/SummaryCard';
import TransactionStatus from '@/components/ui/feedback/TransactionStatus';
import SenderBucketCard from '@/components/ui/dashboard/SenderBucketCard';
import DashboardHistoryList from '@/components/ui/history/DashboardHistoryList';
import PaginationControls from '@/components/ui/dashboard/PaginationControls';
import { formatXlmWithUsd } from '@/lib/utils/price';
import { DepositAllocation } from '@/types/transaction';
import { SenderBucketState } from '@/hooks/useSenderBuckets';

interface SentDashboardViewProps {
  publicKey: string | null;
  totalSent: number;
  activeSentLocks: number;
  sentAllocations: DepositAllocation[];
  sentHistoryLoading: boolean;
  sentBuckets: SenderBucketState[];
  sentBucketsLoading: boolean;
  sentBucketsError: string | null;
  paginatedSentBuckets: SenderBucketState[];
  sentBucketsPage: number;
  totalSentBucketsPages: number;
  isSenderWithdrawing: number | null;
  senderTxHash: string | null;
  senderWithdrawError: string | null;
  isSenderEmergencyLoading: boolean;
  priceUsd: number;
  onWithdrawGoal: (receiverAddr: string, bucketId: number, amount: number) => void;
  onCancelEmergency: (receiverAddr: string, bucketId: number) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  onNavigateToSender: () => void;
  onNavigateToBuckets: () => void;
}

export default function SentDashboardView({
  publicKey,
  totalSent,
  activeSentLocks,
  sentAllocations,
  sentHistoryLoading,
  sentBuckets,
  sentBucketsLoading,
  sentBucketsError,
  paginatedSentBuckets,
  sentBucketsPage,
  totalSentBucketsPages,
  isSenderWithdrawing,
  senderTxHash,
  senderWithdrawError,
  isSenderEmergencyLoading,
  priceUsd,
  onWithdrawGoal,
  onCancelEmergency,
  onPrevPage,
  onNextPage,
  onNavigateToSender,
  onNavigateToBuckets,
}: SentDashboardViewProps) {
  const showSenderFeedback = isSenderWithdrawing !== null || senderTxHash || senderWithdrawError;

  return (
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
          onClick={onNavigateToSender}
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
            onClick={onNavigateToBuckets}
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
            <PaginationControls
              page={sentBucketsPage}
              totalPages={totalSentBucketsPages}
              onPrev={onPrevPage}
              onNext={onNextPage}
              mobileOnly
            />

            <div className="space-y-4 h-[480px] overflow-y-auto p-2 border border-outline-variant rounded-2xl bg-surface-container/20">
              {paginatedSentBuckets.map((bucket) => (
                <SenderBucketCard
                  key={`${bucket.receiverAddress}-${bucket.id}`}
                  id={bucket.id}
                  receiverAddress={bucket.receiverAddress}
                  spendingBalance={bucket.spendingBalance}
                  goalBalance={bucket.goalBalance}
                  unlockDate={bucket.unlockDate}
                  goalLabel={bucket.goalLabel}
                  onWithdrawGoal={onWithdrawGoal}
                  isWithdrawing={isSenderWithdrawing === bucket.id}
                  emergencyRequest={bucket.emergencyRequest}
                  onCancelEmergency={(receiverAddr, bId) => onCancelEmergency(receiverAddr, bId)}
                  isEmergencyLoading={isSenderEmergencyLoading}
                />
              ))}
            </div>

            <PaginationControls
              page={sentBucketsPage}
              totalPages={totalSentBucketsPages}
              onPrev={onPrevPage}
              onNext={onNextPage}
              desktopOnly
            />
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
  );
}
