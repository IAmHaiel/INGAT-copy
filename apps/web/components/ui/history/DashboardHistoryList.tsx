import React from 'react';
import { DepositAllocation } from '@/types/transaction';
import { formatAddress, formatAmount, formatDate } from '@/lib/utils/format';
import { History, ExternalLink, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { useXlmPrice } from '@/hooks/useXlmPrice';
import { formatXlmWithUsd } from '@/lib/utils/price';

interface DashboardHistoryListProps {
  allocations: DepositAllocation[];
  isLoading: boolean;
  currentUserAddress: string | null;
  variant?: 'default' | 'plain';
}

const DashboardHistoryList: React.FC<DashboardHistoryListProps> = ({ 
  allocations, 
  isLoading, 
  currentUserAddress,
  variant = 'default'
}) => {
  const { priceUsd } = useXlmPrice();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <span className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></span>
      </div>
    );
  }

  if (!allocations || allocations.length === 0) {
    if (variant === 'plain') {
      return (
        <div className="py-12 text-center text-on-surface-variant flex flex-col items-center justify-center">
          <History size={48} className="text-outline-variant mb-2" />
          <p className="font-semibold text-sm">No transactions found</p>
          <p className="text-xs text-on-surface-variant mt-1">Transactions will appear here once executed.</p>
        </div>
      );
    }
    return (
      <div className="bg-white rounded-xl border border-outline-variant p-8 text-center text-on-surface-variant shadow-sm flex flex-col items-center">
        <History size={48} className="text-outline-variant mb-2" />
        <p className="font-semibold text-sm">No transactions found</p>
        <p className="text-xs text-on-surface-variant mt-1">Transactions will appear here once executed.</p>
      </div>
    );
  }

  if (variant === 'plain') {
    return (
      <div className="divide-y divide-outline-variant">
        {allocations.map((alloc) => {
          const isSent = alloc.sender === currentUserAddress;
          
          return (
            <div key={alloc.id} className="py-4 flex justify-between items-center hover:bg-surface/50 transition-colors">
              <div className="flex items-center gap-3">
                {/* Arrow Indicator */}
                <div className={`p-2 rounded-xl flex items-center justify-center ${
                  isSent 
                    ? 'bg-primary/10 text-primary' 
                    : 'bg-secondary/10 text-secondary'
                }`}>
                  {isSent ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-on-surface">
                      {isSent ? `Sent to ${formatAddress(alloc.receiver)}` : `Received from ${formatAddress(alloc.sender)}`}
                    </span>
                    <a
                      href={`https://stellar.expert/explorer/testnet/tx/${alloc.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-primary hover:underline flex items-center"
                    >
                      view tx <ExternalLink size={10} className="ml-0.5" />
                    </a>
                  </div>
                  <div className="text-[10px] text-on-surface-variant flex items-center gap-2">
                    <span>{formatDate(alloc.timestamp)}</span>
                    <span>•</span>
                    <span>Split: {alloc.splitRatio}% Spending / {100 - alloc.splitRatio}% Goal</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className={`text-base font-black block ${
                  isSent ? 'text-primary' : 'text-secondary'
                }`}>
                  {isSent ? '-' : '+'}{formatAmount(alloc.amount)} XLM
                </span>
                {priceUsd > 0 && (
                  <span className="text-[10px] text-on-surface-variant block">
                    {formatXlmWithUsd(alloc.amount, priceUsd)}
                  </span>
                )}
                <span className="text-[9px] text-on-surface-variant block">
                  Lock ends: {formatDate(alloc.unlockDate)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden">
      <div className="p-4 border-b border-outline-variant bg-surface-container/30">
        <h3 className="font-bold text-sm text-primary">Transaction History</h3>
      </div>
      <div className="max-h-[480px] overflow-y-auto overflow-x-auto">
        <div className="min-w-[480px] divide-y divide-outline-variant">
        {allocations.map((alloc) => {
          const isSent = alloc.sender === currentUserAddress;
          
          return (
            <div key={alloc.id} className="p-4 flex justify-between items-center hover:bg-surface/50 transition-colors">
              <div className="flex items-center gap-3">
                {/* Arrow Indicator */}
                <div className={`p-2 rounded-xl flex items-center justify-center ${
                  isSent 
                    ? 'bg-primary/10 text-primary' 
                    : 'bg-secondary/10 text-secondary'
                }`}>
                  {isSent ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-on-surface">
                      {isSent ? `Sent to ${formatAddress(alloc.receiver)}` : `Received from ${formatAddress(alloc.sender)}`}
                    </span>
                    <a
                      href={`https://stellar.expert/explorer/testnet/tx/${alloc.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-primary hover:underline flex items-center"
                    >
                      view tx <ExternalLink size={10} className="ml-0.5" />
                    </a>
                  </div>
                  <div className="text-[10px] text-on-surface-variant flex items-center gap-2">
                    <span>{formatDate(alloc.timestamp)}</span>
                    <span>•</span>
                    <span>Split: {alloc.splitRatio}% Spending / {100 - alloc.splitRatio}% Goal</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className={`text-base font-black block ${
                  isSent ? 'text-primary' : 'text-secondary'
                }`}>
                  {isSent ? '-' : '+'}{formatAmount(alloc.amount)} XLM
                </span>
                {priceUsd > 0 && (
                  <span className="text-[10px] text-on-surface-variant block">
                    {formatXlmWithUsd(alloc.amount, priceUsd)}
                  </span>
                )}
                <span className="text-[9px] text-on-surface-variant block">
                  Lock ends: {formatDate(alloc.unlockDate)}
                </span>
              </div>
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
};

export default DashboardHistoryList;
