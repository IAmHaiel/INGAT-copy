export interface BucketState {
  spendingBalance: number;
  goalBalance: number;
  unlockDate: number; // unix timestamp in seconds
}

export type BucketType = 'spending' | 'goal';

export interface Bucket {
  id: string;
  receiverAddress: string;
  spendingBalance: string;
  goalBalance: string;
  unlockDate: string;
  isLocked: boolean;
}

export interface BucketBalances {
  spending: string;
  goal: string;
  total: string;
}
