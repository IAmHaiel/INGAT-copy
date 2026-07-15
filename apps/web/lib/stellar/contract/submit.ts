import { TransactionBuilder } from '@stellar/stellar-sdk';
import { getServer, NETWORK_PASSPHRASE } from '../client';

export const submitTransaction = async (signedXDR: string): Promise<string> => {
  const server = getServer();
  const tx = TransactionBuilder.fromXDR(signedXDR, NETWORK_PASSPHRASE);
  const response = await server.sendTransaction(tx);
  
  if (response.status === 'ERROR') {
    throw new Error(
      (response as { errorResult?: string; errorResultXdr?: string }).errorResult ||
        (response as { errorResult?: string; errorResultXdr?: string }).errorResultXdr ||
        'Transaction submission failed'
    );
  }
  
  const hash = response.hash;
  
  let txStatus = await server.getTransaction(hash);
  let retries = 0;
  
  while (txStatus.status === 'NOT_FOUND' && retries < 30) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    txStatus = await server.getTransaction(hash);
    retries++;
  }
  
  if (txStatus.status === 'SUCCESS') {
    return hash;
  } else if (txStatus.status === 'FAILED') {
    throw new Error('Transaction execution failed on chain');
  }
  
  throw new Error('Transaction submission timeout or failure');
};
