import React from 'react';
import { DepositAllocation } from '@/types/transaction';
import { formatAddress, formatAmount, formatDate } from '@/lib/utils/format';
import { History, ExternalLink } from 'lucide-react';
import { useXlmPrice } from '@/hooks/useXlmPrice';
import { formatXlmWithUsd } from '@/lib/utils/price';

interface AllocationHistoryListProps {
  allocations: DepositAllocation[];
  isLoading: boolean;
}

const AllocationHistoryList: React.FC<AllocationHistoryListProps> = ({ allocations, isLoading }) => {
  const { priceUsd } = useXlmPrice();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <span className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></span>
      </div>
    );
  }

  if (!allocations || allocations.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-outline-variant p-8 text-center text-on-surface-variant shadow-md flex flex-col items-center">
        <History size={48} className="text-outline-variant mb-2" />
        <p className="font-semibold text-sm">No deposits found</p>
        <p className="text-xs text-on-surface-variant mt-1">Start by sending your first remittance above!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-outline-variant shadow-md overflow-hidden">
      <div className="p-4 border-b border-outline-variant bg-surface-container/30">
        <h3 className="font-bold text-sm text-primary">Allocation History</h3>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[480px] divide-y divide-outline-variant">
        {allocations.map((alloc) => (
          <div key={alloc.id} className="p-4 flex justify-between items-center hover:bg-surface/50 transition-colors">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-on-surface">To: {formatAddress(alloc.receiver)}</span>
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
                <span>Split: {alloc.splitRatio}% / {100 - alloc.splitRatio}%</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-base font-black text-primary block">{formatAmount(alloc.amount)} XLM</span>
              {priceUsd > 0 && (
                <span className="text-[10px] text-on-surface-variant block">{formatXlmWithUsd(alloc.amount, priceUsd)}</span>
              )}
              <span className="text-[9px] text-on-surface-variant">Lock ends: {formatDate(alloc.unlockDate)}</span>
            </div>
          </div>
        ))}
        </div>
      </div>
    </div>
  );
};

export default AllocationHistoryList;
