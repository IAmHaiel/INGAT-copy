export type WalletConnectionStatus = 'idle' | 'connecting' | 'not-installed' | 'locked' | 'error';

export interface WalletState {
  address: string | null;
  isConnected: boolean;
  network: string | null;
  isLoading: boolean;
  error: string | null;
}
