import React from 'react';
import { RefreshCw } from 'lucide-react';
import { SummaryCard } from '@/components/ui/dashboard/SummaryCard';
import TransactionStatus from '@/components/ui/feedback/TransactionStatus';
import SpendingBucketCard from '@/components/ui/buckets/SpendingBucketCard';
import GoalBucketCard from '@/components/ui/buckets/GoalBucketCard';
import DashboardHistoryList from '@/components/ui/history/DashboardHistoryList';
import PaginationControls from '@/components/ui/dashboard/PaginationControls';
import AuthRequiredCard from '@/components/ui/dashboard/AuthRequiredCard';
import { formatXlmWithUsd } from '@/lib/utils/price';
import { DepositAllocation } from '@/types/transaction';
import { BucketState } from '@/types/bucket';

interface ReceivedDashboardViewProps {
  publicKey: string | null;
  totalReceived: number;
  activeReceivedLocks: number;
  receivedTransactions: DepositAllocation[];
  receivedHistoryLoading: boolean;
  receivedBalances: BucketState[];
  receivedBalancesLoading: boolean;
  receivedBalancesError: string | null;
  paginatedReceivedBalances: BucketState[];
  receivedBucketsPage: number;
  totalReceivedBucketsPages: number;
  isReceiverWithdrawing: number | null;
  receiverTxHash: string | null;
  receiverWithdrawError: string | null;
  isReceiverEmergencyLoading: boolean;
  priceUsd: number;
  isAuthenticating: boolean;
  authError: string | null;
  supabaseClient: any | null;
  onSign: () => void;
  onRefreshBalances: () => void;
  onWithdrawSpending: (bucketId: number, amount: number) => void;
  onWithdrawGoal: (bucketId: number, amount: number) => void;
  onRequestEmergency: (bucketId: number, amount: number, sender: string) => void;
  onCancelEmergency: (bucketId: number) => void;
  onExecuteEmergency: (bucketId: number, amount: number) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  onNavigateToBuckets: () => void;
  getGoalLabel: (senderAddress: string, unlockDate: number) => string | null;
}

export default function ReceivedDashboardView({
  publicKey,
  totalReceived,
  activeReceivedLocks,
  receivedTransactions,
  receivedHistoryLoading,
  receivedBalances,
  receivedBalancesLoading,
  receivedBalancesError,
  paginatedReceivedBalances,
  receivedBucketsPage,
  totalReceivedBucketsPages,
  isReceiverWithdrawing,
  receiverTxHash,
  receiverWithdrawError,
  isReceiverEmergencyLoading,
  priceUsd,
  isAuthenticating,
  authError,
  supabaseClient,
  onSign,
  onRefreshBalances,
  onWithdrawSpending,
  onWithdrawGoal,
  onRequestEmergency,
  onCancelEmergency,
  onExecuteEmergency,
  onPrevPage,
  onNextPage,
  onNavigateToBuckets,
  getGoalLabel,
}: ReceivedDashboardViewProps) {
  const showReceiverFeedback = isReceiverWithdrawing !== null || receiverTxHash || receiverWithdrawError;

  return (
    <div className="space-y-6 animate-[fadeIn_150ms_ease-out]">
      {isAuthenticating && !supabaseClient ? (
        <AuthRequiredCard
          onSign={onSign}
          isAuthenticating={isAuthenticating}
          authError={authError}
        />
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
              onClick={onRefreshBalances}
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
                onClick={onNavigateToBuckets}
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
                <PaginationControls
                  page={receivedBucketsPage}
                  totalPages={totalReceivedBucketsPages}
                  onPrev={onPrevPage}
                  onNext={onNextPage}
                  mobileOnly
                />

                <div className="space-y-6 h-[550px] overflow-y-auto p-4 border border-outline-variant rounded-2xl bg-surface-container/20">
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
                          onWithdraw={(amount) => onWithdrawSpending(bucket.id, amount)}
                          isWithdrawing={isReceiverWithdrawing === bucket.id}
                        />
                        <GoalBucketCard
                          bucketId={bucket.id}
                          balance={bucket.goalBalance}
                          unlockDate={bucket.unlockDate}
                          goalLabel={getGoalLabel(bucket.sender, bucket.unlockDate)}
                          senderAddress={bucket.sender}
                          onWithdraw={(amount) => onWithdrawGoal(bucket.id, amount)}
                          isWithdrawing={isReceiverWithdrawing === bucket.id}
                          emergencyRequest={bucket.emergencyRequest}
                          onRequestEmergency={(amount) => onRequestEmergency(bucket.id, amount, bucket.sender)}
                          onCancelEmergency={() => onCancelEmergency(bucket.id)}
                          onExecuteEmergency={() => {
                            if (bucket.emergencyRequest) {
                              onExecuteEmergency(bucket.id, bucket.emergencyRequest.amount);
                            }
                          }}
                          isEmergencyLoading={isReceiverEmergencyLoading}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <PaginationControls
                  page={receivedBucketsPage}
                  totalPages={totalReceivedBucketsPages}
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
              allocations={receivedTransactions}
              isLoading={receivedHistoryLoading}
              currentUserAddress={publicKey}
            />
          </section>
        </>
      )}
    </div>
  );
}
