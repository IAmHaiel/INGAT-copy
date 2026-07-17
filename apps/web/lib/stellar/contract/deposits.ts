import { Address, nativeToScVal } from '@stellar/stellar-sdk';
import { scaleAmount, buildContractCallXDR } from './shared';

export const buildDepositTx = async (
  senderAddress: string,
  receiverAddress: string,
  amount: number,
  splitRatio: number,
  unlockDate: number,
  approvalRequired: boolean
): Promise<string> => {
  const senderScVal = Address.fromString(senderAddress).toScVal();
  const receiverScVal = Address.fromString(receiverAddress).toScVal();
  
  const scaledAmount = scaleAmount(amount);
  const amountScVal = nativeToScVal(scaledAmount, { type: 'i128' });
  const splitRatioScVal = nativeToScVal(splitRatio, { type: 'u32' });
  const unlockDateScVal = nativeToScVal(BigInt(unlockDate), { type: 'u64' });
  const approvalRequiredScVal = nativeToScVal(approvalRequired);

  return buildContractCallXDR(
    senderAddress,
    'deposit',
    [senderScVal, receiverScVal, amountScVal, splitRatioScVal, unlockDateScVal, approvalRequiredScVal],
    'deposit transaction'
  );
};
