import { Address, nativeToScVal } from '@stellar/stellar-sdk';
import { scaleAmount, buildContractCallXDR } from './shared';

export const buildRequestEmergencyWithdrawalTx = async (
  receiverAddress: string,
  bucketId: number,
  amount: number
): Promise<string> => {
  const receiverScVal = Address.fromString(receiverAddress).toScVal();
  const bucketIdScVal = nativeToScVal(bucketId, { type: 'u32' });
  const scaledAmount = scaleAmount(amount);
  const amountScVal = nativeToScVal(scaledAmount, { type: 'i128' });

  return buildContractCallXDR(
    receiverAddress,
    'request_emergency_withdrawal',
    [receiverScVal, bucketIdScVal, amountScVal],
    'request emergency withdrawal'
  );
};

export const buildCancelEmergencyWithdrawalTx = async (
  senderAddress: string,
  receiverAddress: string,
  bucketId: number
): Promise<string> => {
  const senderScVal = Address.fromString(senderAddress).toScVal();
  const receiverScVal = Address.fromString(receiverAddress).toScVal();
  const bucketIdScVal = nativeToScVal(bucketId, { type: 'u32' });

  return buildContractCallXDR(
    senderAddress,
    'cancel_emergency_withdrawal',
    [senderScVal, receiverScVal, bucketIdScVal],
    'cancel emergency withdrawal'
  );
};

export const buildCancelEmergencyWithdrawalReceiverTx = async (
  receiverAddress: string,
  bucketId: number
): Promise<string> => {
  const receiverScVal = Address.fromString(receiverAddress).toScVal();
  const bucketIdScVal = nativeToScVal(bucketId, { type: 'u32' });

  return buildContractCallXDR(
    receiverAddress,
    'cancel_emergency_receiver',
    [receiverScVal, bucketIdScVal],
    'receiver cancel emergency withdrawal'
  );
};

export const buildExecuteEmergencyWithdrawalTx = async (
  receiverAddress: string,
  bucketId: number
): Promise<string> => {
  const receiverScVal = Address.fromString(receiverAddress).toScVal();
  const bucketIdScVal = nativeToScVal(bucketId, { type: 'u32' });

  return buildContractCallXDR(
    receiverAddress,
    'execute_emergency_withdrawal',
    [receiverScVal, bucketIdScVal],
    'execute emergency withdrawal'
  );
};
