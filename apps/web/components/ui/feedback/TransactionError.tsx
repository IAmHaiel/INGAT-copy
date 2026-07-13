"use client";
import { XCircle } from "lucide-react";

interface TransactionErrorProps {
  error: string;
  onRetry?: () => void;
}

export function TransactionError({ error, onRetry }: TransactionErrorProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-6 text-center">
      <XCircle className="h-12 w-12 text-red-500" aria-hidden="true" />
      <p className="text-sm font-medium text-red-800">{error}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
