import { EmergencyRequest } from './emergency';

export interface BucketState {
  id: number;
  sender: string;
  spendingBalance: number;
  goalBalance: number;
  unlockDate: number; // unix timestamp in seconds
  emergencyRequest?: EmergencyRequest | null;
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
