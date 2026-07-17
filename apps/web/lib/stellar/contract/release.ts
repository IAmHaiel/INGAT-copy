import { Address, nativeToScVal } from '@stellar/stellar-sdk';
import { buildContractCallXDR } from './shared';

export const buildRequestReleaseTx = async (
  receiverAddress: string,
  bucketId: number
): Promise<string> => {
  const receiverScVal = Address.fromString(receiverAddress).toScVal();
  const bucketIdScVal = nativeToScVal(bucketId, { type: 'u32' });

  return buildContractCallXDR(
    receiverAddress,
    'request_release',
    [receiverScVal, bucketIdScVal],
    'request release'
  );
};

export const buildApproveReleaseTx = async (
  senderAddress: string,
  receiverAddress: string,
  bucketId: number
): Promise<string> => {
  const senderScVal = Address.fromString(senderAddress).toScVal();
  const receiverScVal = Address.fromString(receiverAddress).toScVal();
  const bucketIdScVal = nativeToScVal(bucketId, { type: 'u32' });

  return buildContractCallXDR(
    senderAddress,
    'approve_release',
    [senderScVal, receiverScVal, bucketIdScVal],
    'approve release'
  );
};
