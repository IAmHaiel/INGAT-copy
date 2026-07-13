import type { AllocationRecord } from "@/types/transaction";

interface AllocationHistoryRowProps {
  record: AllocationRecord;
}

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function truncateHash(hash: string): string {
  return `${hash.slice(0, 8)}...`;
}

export function AllocationHistoryRow({ record }: AllocationHistoryRowProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm text-gray-700">{record.timestamp}</span>
        <span className="text-xs text-gray-400 font-mono">
          To: {truncateAddress(record.receiverAddress)}
        </span>
      </div>

      <div className="flex flex-col items-end gap-0.5">
        <span className="text-sm font-semibold text-gray-900">
          {record.totalAmount} XLM
        </span>
        <span className="text-xs text-gray-500">
          <span className="text-teal-600">{record.spendingAmount}</span>
          {" / "}
          <span className="text-amber-600">{record.goalAmount}</span>
        </span>
      </div>

      <a
        href={`https://stellar.expert/explorer/testnet/tx/${record.txHash}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-amber-600 hover:text-amber-700 hover:underline font-mono"
      >
        {truncateHash(record.txHash)}
      </a>
    </div>
  );
}
