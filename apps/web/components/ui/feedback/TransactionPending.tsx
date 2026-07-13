interface TransactionPendingProps {
  message?: string;
}

export function TransactionPending({ message }: TransactionPendingProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-200 border-t-amber-500" />
      <p className="text-sm font-medium text-amber-800">
        {message || "Transaction pending..."}
      </p>
    </div>
  );
}
