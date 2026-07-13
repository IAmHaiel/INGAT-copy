export interface DepositAllocation {
  id: string;
  sender: string;
  receiver: string;
  amount: number;
  splitRatio: number; // percentage of spending
  unlockDate: number;
  timestamp: number;
}

export interface DepositFormInputs {
  receiver: string;
  amount: string;
  splitRatio: number;
  unlockDate: string;
}

// Keep old interfaces for backward compatibility
export interface DepositParams {
  amount: string;
  splitRatio: number;
  receiverAddress: string;
  unlockDate: string;
}

export interface WithdrawParams {
  bucketId: string;
  amount: string;
}

export interface TransactionResult {
  success: boolean;
  txHash: string | null;
  error: string | null;
  status: 'pending' | 'success' | 'error';
}

export interface AllocationRecord {
  id: string;
  senderAddress: string;
  receiverAddress: string;
  totalAmount: string;
  spendingAmount: string;
  goalAmount: string;
  unlockDate: string;
  timestamp: string;
  txHash: string;
}
