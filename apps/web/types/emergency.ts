export type EmergencyRequestStatus = 'Pending' | 'Executed' | 'Cancelled';

export interface EmergencyRequest {
  amount: number;
  requestedAt: number;       // unix seconds
  cooldownEndsAt: number;    // unix seconds
  status: EmergencyRequestStatus;
  lastCancelAt: number;      // unix seconds
}
