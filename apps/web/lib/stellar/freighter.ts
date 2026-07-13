import { isConnected, getAddress, signTransaction } from '@stellar/freighter-api';

export const isFreighterInstalled = async (): Promise<boolean> => {
  try {
    const connected = await isConnected();
    return !!connected;
  } catch {
    return false;
  }
};

export const getConnectedPublicKey = async (): Promise<string | null> => {
  try {
    const installed = await isFreighterInstalled();
    if (installed) {
      const pubKey = await getAddress();
      return pubKey.address || null;
    }
    return null;
  } catch (err) {
    console.error('Failed to get Freighter address:', err);
    return null;
  }
};

export const signTxWithFreighter = async (xdr: string): Promise<string> => {
  try {
    const result = await signTransaction(xdr, { networkPassphrase: 'Test Stellar Network ; September 2015' });
    return result.signedTxXdr;
  } catch (err) {
    console.error('Failed to sign transaction with Freighter:', err);
    throw err;
  }
};
