import React, { useState } from 'react';
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
  title?: string;
  itemsPerPage?: number;
}

const DashboardHistoryList: React.FC<DashboardHistoryListProps> = ({ 
  allocations, 
  isLoading, 
  currentUserAddress,
  variant = 'default',
  title,
  itemsPerPage = 10
}) => {
  const { priceUsd } = useXlmPrice();
  const [currentPage, setCurrentPage] = useState(1);
  const [prevAllocations, setPrevAllocations] = useState(allocations);

  if (allocations !== prevAllocations) {
    setPrevAllocations(allocations);
    setCurrentPage(1);
  }

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

  const sortedAllocations = [...allocations].sort((a, b) => b.timestamp - a.timestamp);
  const totalPages = Math.ceil(sortedAllocations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAllocations = sortedAllocations.slice(startIndex, startIndex + itemsPerPage);

  const renderPaginationControls = (isMobile: boolean) => {
    return (
      <div className={`p-3 bg-surface-container/20 flex items-center justify-between text-xs ${
        isMobile ? 'md:hidden border-b border-outline-variant' : 'hidden md:flex border-t border-outline-variant'
      }`}>
        <button
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-3 py-1.5 rounded-lg border border-outline-variant bg-white text-on-surface hover:bg-surface-container-high transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold cursor-pointer"
        >
          Previous
        </button>
        <span className="text-on-surface-variant font-semibold">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="px-3 py-1.5 rounded-lg border border-outline-variant bg-white text-on-surface hover:bg-surface-container-high transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold cursor-pointer"
        >
          Next
        </button>
      </div>
    );
  };

  const renderPlainPaginationControls = (isMobile: boolean) => {
    return (
      <div className={`py-3 flex items-center justify-between text-xs ${
        isMobile ? 'md:hidden border-b border-outline-variant mb-2' : 'hidden md:flex border-t border-outline-variant mt-2'
      }`}>
        <button
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-3 py-1.5 rounded-lg border border-outline-variant bg-white text-on-surface hover:bg-surface-container-high transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold cursor-pointer"
        >
          Previous
        </button>
        <span className="text-on-surface-variant font-semibold">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="px-3 py-1.5 rounded-lg border border-outline-variant bg-white text-on-surface hover:bg-surface-container-high transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold cursor-pointer"
        >
          Next
        </button>
      </div>
    );
  };

  if (variant === 'plain') {
    return (
      <div className="space-y-4 flex flex-col">
        {/* Pagination at the top on mobile */}
        {totalPages > 1 && renderPlainPaginationControls(true)}

        <div className="divide-y divide-outline-variant">
          {paginatedAllocations.map((alloc) => {
            const isSent = alloc.sender === currentUserAddress;
            
            return (
              <div key={alloc.id} className="py-2 px-1 flex justify-between items-center hover:bg-surface/50 transition-colors">
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
        
        {/* Pagination at the bottom on desktop */}
        {totalPages > 1 && renderPlainPaginationControls(false)}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden flex flex-col">
      <div className="p-4 border-b border-outline-variant bg-surface-container/30">
        <h3 className="font-bold text-sm text-primary">{title || 'Transaction History'}</h3>
      </div>

      {/* Pagination at the top on mobile */}
      {totalPages > 1 && renderPaginationControls(true)}

      <div className="max-h-[480px] overflow-y-auto overflow-x-auto flex-grow">
        <div className="min-w-[480px] divide-y divide-outline-variant">
          {paginatedAllocations.map((alloc) => {
            const isSent = alloc.sender === currentUserAddress;
            
            return (
              <div key={alloc.id} className="py-2.5 px-4 flex justify-between items-center hover:bg-surface/50 transition-colors">
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

      {/* Pagination at the bottom on desktop */}
      {totalPages > 1 && renderPaginationControls(false)}
    </div>
  );
};

export default DashboardHistoryList;
