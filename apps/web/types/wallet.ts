export interface WalletState {
  address: string | null;
  isConnected: boolean;
  network: string | null;
  isLoading: boolean;
  error: string | null;
}
