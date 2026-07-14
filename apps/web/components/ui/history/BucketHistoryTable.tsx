import React, { useState } from 'react';
import { Search, ArrowUpDown, Filter, Eye, ChevronRight, Info } from 'lucide-react';
import { EnrichedBucketEntry } from '@/hooks/useBucketHistory';
import { formatAmount, formatDate } from '@/lib/utils/format';
import { truncateAddress } from '@/lib/utils/format';
import BucketStatusBadge from './BucketStatusBadge';

interface BucketHistoryTableProps {
  entries: EnrichedBucketEntry[];
  onSelectEntry: (entry: EnrichedBucketEntry) => void;
  mode?: 'sent' | 'received';
}

type SortField = 'depositDate' | 'unlockDate' | 'amount';
type SortOrder = 'asc' | 'desc';

export const BucketHistoryTable: React.FC<BucketHistoryTableProps> = ({
  entries,
  onSelectEntry,
  mode = 'sent',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('depositDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Filter entries
  const filtered = entries.filter((entry) => {
    const nameMatch = entry.receiverName?.toLowerCase().includes(searchTerm.toLowerCase());
    const addressMatch = entry.receiverAddress.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSearch = nameMatch || addressMatch;

    const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Sort entries
  const sorted = [...filtered].sort((a, b) => {
    let aVal = 0;
    let bVal = 0;

    if (sortField === 'depositDate') {
      aVal = a.depositDate;
      bVal = b.depositDate;
    } else if (sortField === 'unlockDate') {
      aVal = a.unlockDate;
      bVal = b.unlockDate;
    } else if (sortField === 'amount') {
      aVal = a.depositAmount;
      bVal = b.depositAmount;
    }

    if (sortOrder === 'asc') {
      return aVal - bVal;
    } else {
      return bVal - aVal;
    }
  });

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters Row */}
      <div className="flex flex-col md:flex-row gap-3 bg-white p-4 rounded-xl border border-outline-variant shadow-sm">
        {/* Search */}
        <div className="relative flex-grow">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/70" />
          <input
            type="text"
            placeholder={mode === 'received' ? "Search by sender name or address..." : "Search by receiver name or address..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-outline-variant rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-on-surface"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 shrink-0">
          <Filter size={16} className="text-on-surface-variant" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-outline-variant rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-on-surface"
          >
            <option value="all">All Statuses</option>
            <option value="locked">🔒 Locked</option>
            <option value="unlocked">🔓 Unlocked</option>
            <option value="withdrawn">✓ Withdrawn</option>
            <option value="spending_only">⇆ Spending Only</option>
          </select>
        </div>

        {/* Sort Select (Visible on Mobile only as fallback) */}
        <div className="flex md:hidden items-center gap-2 shrink-0">
          <ArrowUpDown size={16} className="text-on-surface-variant" />
          <select
            value={`${sortField}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortField(field as SortField);
              setSortOrder(order as SortOrder);
            }}
            className="bg-white border border-outline-variant rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-on-surface w-full"
          >
            <option value="depositDate-desc">Newest Deposit</option>
            <option value="depositDate-asc">Oldest Deposit</option>
            <option value="unlockDate-desc">Unlock Date (Far to Near)</option>
            <option value="unlockDate-asc">Unlock Date (Near to Far)</option>
            <option value="amount-desc">Amount (High to Low)</option>
            <option value="amount-asc">Amount (Low to High)</option>
          </select>
        </div>
      </div>

      {/* Stats summary */}
      <div className="flex justify-between items-center text-xs text-on-surface-variant font-medium px-1">
        <span>Showing {sorted.length} of {entries.length} buckets</span>
        {sorted.length > 0 && (
          <span className="flex items-center gap-1">
            <Info size={12} /> Click any entry to view full transaction receipt
          </span>
        )}
      </div>

      {/* Grid/Table Area */}
      {sorted.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-outline-variant shadow-sm">
          <p className="text-on-surface-variant font-semibold text-sm">No matching buckets found</p>
          <p className="text-on-surface-variant text-[11px] mt-0.5">Try adjusting your search query or status filter.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-lowest border-b border-outline-variant text-xs font-bold text-on-surface uppercase tracking-wider select-none">
                  <th className="p-4">{mode === 'received' ? 'Sender' : 'Receiver'}</th>
                  <th className="p-4 cursor-pointer hover:bg-surface-container transition-colors" onClick={() => toggleSort('amount')}>
                    <span className="flex items-center gap-1">
                      Allocated Amount
                      <ArrowUpDown size={12} />
                    </span>
                  </th>
                  <th className="p-4">Split (Spend/Goal)</th>
                  <th className="p-4 cursor-pointer hover:bg-surface-container transition-colors" onClick={() => toggleSort('unlockDate')}>
                    <span className="flex items-center gap-1">
                      Unlock Date
                      <ArrowUpDown size={12} />
                    </span>
                  </th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/60 text-xs">
                {sorted.map((entry) => (
                  <tr
                    key={entry.depositTxHash}
                    onClick={() => onSelectEntry(entry)}
                    className="hover:bg-surface-container/30 transition-colors cursor-pointer group"
                  >
                    <td className="p-4">
                      <div>
                        <p className="font-bold text-on-surface">
                          {entry.receiverName || truncateAddress(entry.receiverAddress)}
                        </p>
                        {entry.receiverName && (
                          <p className="text-[10px] text-on-surface-variant font-mono mt-0.5">
                            {truncateAddress(entry.receiverAddress)}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-black text-on-surface">{formatAmount(entry.depositAmount)} XLM</p>
                        <p className="text-[10px] text-on-surface-variant mt-0.5">
                          Dep. {formatDate(entry.depositDate)}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-0.5">
                        <p className="font-medium text-on-surface">
                          {entry.splitRatio}% / {100 - entry.splitRatio}%
                        </p>
                        <p className="text-[10px] text-on-surface-variant">
                          Goal: {formatAmount(entry.goalAmount)} XLM
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      {entry.goalAmount > 0 ? (
                        <p className="font-semibold text-on-surface">{formatDate(entry.unlockDate)}</p>
                      ) : (
                        <p className="text-on-surface-variant font-medium">None (Spending Only)</p>
                      )}
                    </td>
                    <td className="p-4">
                      <BucketStatusBadge status={entry.status} />
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectEntry(entry);
                        }}
                        className="p-1.5 hover:bg-surface-container rounded-lg transition-colors cursor-pointer text-on-surface-variant hover:text-primary border-0 bg-transparent flex items-center justify-center ml-auto"
                        title="View details"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="block md:hidden space-y-3">
            {sorted.map((entry) => (
              <div
                key={entry.depositTxHash}
                onClick={() => onSelectEntry(entry)}
                className="bg-white p-4 rounded-xl border border-outline-variant shadow-sm space-y-3 active:bg-surface-container/20 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-bold text-sm text-on-surface">
                      {entry.receiverName || truncateAddress(entry.receiverAddress)}
                    </h5>
                    {entry.receiverName && (
                      <p className="text-[10px] font-mono text-on-surface-variant mt-0.5">
                        {truncateAddress(entry.receiverAddress)}
                      </p>
                    )}
                  </div>
                  <BucketStatusBadge status={entry.status} />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs border-t border-b border-outline-variant/50 py-2.5 my-1">
                  <div>
                    <span className="text-on-surface-variant block text-[10px] font-medium">Allocated Amount</span>
                    <span className="font-black text-on-surface">{formatAmount(entry.depositAmount)} XLM</span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant block text-[10px] font-medium">Split (Spend/Goal)</span>
                    <span className="font-semibold text-on-surface">{entry.splitRatio}% / {100 - entry.splitRatio}%</span>
                  </div>
                  <div className="mt-1">
                    <span className="text-on-surface-variant block text-[10px] font-medium">Deposit Date</span>
                    <span className="font-medium text-on-surface">{formatDate(entry.depositDate)}</span>
                  </div>
                  <div className="mt-1">
                    <span className="text-on-surface-variant block text-[10px] font-medium">Timelock Release</span>
                    <span className="font-medium text-on-surface">
                      {entry.goalAmount > 0 ? formatDate(entry.unlockDate) : 'None'}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end items-center text-xs text-primary font-bold gap-0.5">
                  <span>View full transaction history</span>
                  <ChevronRight size={14} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default BucketHistoryTable;
