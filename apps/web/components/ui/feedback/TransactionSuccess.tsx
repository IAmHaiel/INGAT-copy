import { CheckCircle2, X } from "lucide-react";
 
interface TransactionSuccessProps {
  txHash: string;
  message?: string;
  onDismiss?: () => void;
}
 
export function TransactionSuccess({ txHash, message, onDismiss }: TransactionSuccessProps) {
  return (
    <div className="relative flex flex-col items-center gap-4 rounded-2xl border border-[#005145]/20 bg-[#FAF7F2] p-8 text-center shadow-2xl max-w-md w-full mx-auto animate-scale-in">
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 text-[#3f4946] hover:text-[#005145] transition-colors p-1 rounded-full hover:bg-[#ebefec]/50 border-0 cursor-pointer"
          aria-label="Dismiss notification"
        >
          <X className="h-5 w-5" />
        </button>
      )}
      
      <div className="rounded-full bg-[#005145]/10 p-3">
        <CheckCircle2 className="h-16 w-16 text-[#005145]" aria-hidden="true" />
      </div>
      
      <div className="space-y-1">
        <h3 className="text-xl font-black text-[#005145]">
          {message || "Transaction Successful!"}
        </h3>
        <p className="text-xs text-[#3f4946]">
          Your transaction has been confirmed on the Stellar Testnet.
        </p>
      </div>
 
      <div className="w-full bg-[#ebefec]/50 rounded-xl p-3 border border-[#bec9c5]/30 font-mono">
        <span className="text-[10px] text-[#3f4946] block uppercase tracking-wider mb-1 font-bold">
          Transaction Hash
        </span>
        <a
          href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[#005145] hover:text-[#0f6b5c] hover:underline break-all block"
        >
          {txHash}
        </a>
      </div>
 
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="mt-2 w-full bg-[#005145] text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-all active:scale-95 hover:brightness-110 shadow-sm border-0 cursor-pointer"
        >
          Dismiss
        </button>
      )}
    </div>
  );
}
