export { createAuthenticatedClient } from './client';
export { insertTransaction, fetchTransactionsByAddress, fetchSentTransactions, fetchReceivedTransactions } from './transactions';
export { insertEmergencyRequest, updateEmergencyRequestStatus, getActiveEmergencyRequest, getSenderPendingRequests } from './emergency';
export type { TransactionRow, TransactionInsert, TransactionType } from './types';
export type { EmergencyRequestRow, EmergencyRequestInsert, EmergencyRequestStatus } from './types';
