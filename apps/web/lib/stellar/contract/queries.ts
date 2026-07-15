import { Address, TransactionBuilder, scValToNative, nativeToScVal, rpc } from '@stellar/stellar-sdk';
import { getServer, NETWORK_PASSPHRASE } from '../client';
import { BucketState } from '@/types/bucket';
import { EmergencyRequest, EmergencyRequestStatus } from '@/types/emergency';
import { contract, getDummyAccount, DECIMALS, extractSimError } from './shared';

export const simulateRead = async (
  operationName: string,
  args: any[]
): Promise<any> => {
  const dummySource = getDummyAccount();
  const tx = new TransactionBuilder(dummySource, {
    fee: '100',
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(operationName, ...args))
    .setTimeout(30)
    .build();

  const sim = await getServer().simulateTransaction(tx);
  if (rpc.Api.isSimulationSuccess(sim)) {
    return sim.result?.retval || null;
  }
  throw new Error(extractSimError(sim));
};

export const fetchEmergencyRequest = async (
  receiverAddress: string,
  bucketId: number
): Promise<EmergencyRequest | null> => {
  try {
    const receiverScVal = Address.fromString(receiverAddress).toScVal();
    const bucketIdScVal = nativeToScVal(bucketId, { type: 'u32' });

    const retval = await simulateRead('get_emergency_request', [receiverScVal, bucketIdScVal]);
    if (!retval) return null;

    const nativeVal = scValToNative(retval);
    if (!nativeVal) return null;

    let statusStr: EmergencyRequestStatus = 'Pending';
    const rawStatus = nativeVal.status;
    if (rawStatus === 'Pending' || rawStatus === 0 || (typeof rawStatus === 'object' && rawStatus.tag === 'Pending')) {
      statusStr = 'Pending';
    } else if (rawStatus === 'Executed' || rawStatus === 1 || (typeof rawStatus === 'object' && rawStatus.tag === 'Executed')) {
      statusStr = 'Executed';
    } else if (rawStatus === 'Cancelled' || rawStatus === 2 || (typeof rawStatus === 'object' && rawStatus.tag === 'Cancelled')) {
      statusStr = 'Cancelled';
    } else {
      const str = String(rawStatus);
      if (str.includes('Pending') || str.includes('0')) statusStr = 'Pending';
      else if (str.includes('Executed') || str.includes('1')) statusStr = 'Executed';
      else if (str.includes('Cancelled') || str.includes('2')) statusStr = 'Cancelled';
    }

    return {
      amount: Number(nativeVal.amount) / DECIMALS,
      requestedAt: Number(nativeVal.requested_at),
      cooldownEndsAt: Number(nativeVal.cooldown_ends_at),
      status: statusStr,
      lastCancelAt: Number(nativeVal.last_cancel_at),
    };
  } catch (err) {
    console.error('Error fetching emergency request:', err);
    return null;
  }
};

export const fetchBucketBalances = async (receiverAddress: string): Promise<BucketState[]> => {
  try {
    const receiverScVal = Address.fromString(receiverAddress).toScVal();
    const retval = await simulateRead('get_buckets', [receiverScVal]);
    if (!retval) return [];

    const nativeVal = scValToNative(retval);
    if (!nativeVal || !Array.isArray(nativeVal)) return [];

    const buckets = nativeVal.map((item: any) => ({
      id: Number(item.id),
      sender: String(item.sender),
      spendingBalance: Number(item.spending_balance) / DECIMALS,
      goalBalance: Number(item.goal_balance) / DECIMALS,
      unlockDate: Number(item.unlock_date),
    }));

    const nowSeconds = Math.floor(Date.now() / 1000);
    const bucketsWithEmergency = await Promise.all(
      buckets.map(async (bucket) => {
        if (bucket.goalBalance > 0 && bucket.unlockDate > nowSeconds) {
          const emergencyRequest = await fetchEmergencyRequest(receiverAddress, bucket.id);
          return { ...bucket, emergencyRequest };
        }
        return { ...bucket, emergencyRequest: null };
      })
    );
    return bucketsWithEmergency;
  } catch (err) {
    console.error('Error fetching bucket balances:', err);
    throw err;
  }
};
