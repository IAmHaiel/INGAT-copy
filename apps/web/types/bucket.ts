import { EmergencyRequest } from './emergency';

export interface BucketState {
  id: number;
  sender: string;
  spendingBalance: number;
  goalBalance: number;
  unlockDate: number; // unix timestamp in seconds
  approvalRequired: boolean;
  _reqFetched: boolean;
  _isApprovalBucket?: boolean;
  emergencyRequest?: EmergencyRequest | null;
  releaseRequest?: ReleaseRequest;
}

export type ReleaseStatus = 'Pending' | 'Approved' | 'Executed';

export interface ReleaseRequest {
  requestedAt: number;
  gracePeriodEndsAt: number;
  status: ReleaseStatus;
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
