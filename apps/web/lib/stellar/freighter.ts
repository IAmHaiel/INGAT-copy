import { isConnected, getAddress, requestAccess, signTransaction, getNetworkDetails, signMessage } from '@stellar/freighter-api';
import { NETWORK_PASSPHRASE } from './client';

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
      if (pubKey.error) {
        return null;
      }
      return pubKey.address || null;
    }
    return null;
  } catch (err) {
    console.error('Failed to get Freighter address:', err);
    return null;
  }
};

/**
 * Explicitly request access from Freighter — triggers the extension popup
 * for account selection/authorization even when switching accounts.
 * Returns the address on success, or an error string on failure.
 */
export const requestWalletAccess = async (): Promise<{ address: string | null; error: string | null }> => {
  try {
    const result = await requestAccess();
    if (result.error) {
      return { address: null, error: result.error.message || 'Access request rejected' };
    }
    return { address: result.address || null, error: null };
  } catch (err) {
    console.error('Failed to request Freighter access:', err);
    return { address: null, error: 'Failed to request wallet access' };
  }
};

export const signTxWithFreighter = async (xdr: string, address?: string): Promise<string> => {
  try {
    const network = await getFreighterNetwork();
    if (!network || network.networkPassphrase !== NETWORK_PASSPHRASE) {
      throw new Error(
        `Freighter is connected to the wrong network. Expected Testnet. Please switch in the Freighter extension.`
      );
    }

    const result = await signTransaction(xdr, {
      networkPassphrase: NETWORK_PASSPHRASE,
      address,
    });
    if (result.error) {
      throw new Error(result.error.message || 'Transaction signing failed');
    }
    return result.signedTxXdr;
  } catch (err) {
    console.error('Failed to sign transaction with Freighter:', err);
    throw err;
  }
};

export const getFreighterNetwork = async (): Promise<{ network: string; networkPassphrase: string } | null> => {
  try {
    const details = await getNetworkDetails();
    if (details.error) {
      console.error('Failed to get network details:', details.error);
      return null;
    }
    return {
      network: details.network,
      networkPassphrase: details.networkPassphrase,
    };
  } catch (err) {
    console.error('Failed to get Freighter network:', err);
    return null;
  }
};

/**
 * Sign an arbitrary message using Freighter (SEP-53).
 * Used for wallet authentication challenge-response.
 */
export const signMessageWithFreighter = async (
  message: string,
  address: string
): Promise<string> => {
  const result = await signMessage(message, { address });
  if (result.error) {
    throw new Error(result.error.message || 'Message signing failed');
  }
  if (!result.signedMessage) {
    throw new Error('No signature returned from Freighter');
  }

  const signed = result.signedMessage;
  if (typeof signed === 'string') {
    return signed;
  }

  // Safe base64 conversion in browser for Buffer / Uint8Array
  const bytes = new Uint8Array(signed as any);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};
