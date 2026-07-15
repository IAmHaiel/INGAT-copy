import { Address, nativeToScVal } from '@stellar/stellar-sdk';
import { scaleAmount, buildContractCallXDR } from './shared';

export const buildWithdrawSpendingTx = async (
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
    'withdraw_spending',
    [receiverScVal, bucketIdScVal, amountScVal],
    'spending withdrawal'
  );
};

export const buildWithdrawGoalTx = async (
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
    'withdraw_goal',
    [receiverScVal, bucketIdScVal, amountScVal],
    'goal withdrawal'
  );
};

export const buildWithdrawGoalSenderTx = async (
  senderAddress: string,
  receiverAddress: string,
  bucketId: number,
  amount: number
): Promise<string> => {
  const senderScVal = Address.fromString(senderAddress).toScVal();
  const receiverScVal = Address.fromString(receiverAddress).toScVal();
  const bucketIdScVal = nativeToScVal(bucketId, { type: 'u32' });
  
  const scaledAmount = scaleAmount(amount);
  const amountScVal = nativeToScVal(scaledAmount, { type: 'i128' });

  return buildContractCallXDR(
    senderAddress,
    'withdraw_goal_sender',
    [senderScVal, receiverScVal, bucketIdScVal, amountScVal],
    'sender goal withdrawal'
  );
};
