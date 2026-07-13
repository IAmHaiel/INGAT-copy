interface TransactionSuccessProps {
  txHash: string;
  message?: string;
}

export function TransactionSuccess({ txHash, message }: TransactionSuccessProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-6 text-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-12 w-12 text-green-500"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
          clipRule="evenodd"
        />
      </svg>
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
