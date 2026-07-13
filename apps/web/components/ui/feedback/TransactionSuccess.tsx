import { CheckCircle2 } from "lucide-react";
interface TransactionSuccessProps {
  txHash: string;
  message?: string;
}

export function TransactionSuccess({ txHash, message }: TransactionSuccessProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-6 text-center">
      <CheckCircle2 className="h-12 w-12 text-green-500" aria-hidden="true" />
      <p className="text-sm font-medium text-green-800">
        {message || "Transaction successful!"}
      </p>
      <a
        href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-green-600 hover:text-green-700 hover:underline font-mono break-all"
      >
        {txHash}
      </a>
    </div>
  );
}
