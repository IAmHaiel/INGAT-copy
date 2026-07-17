import { Address, TransactionBuilder, scValToNative, nativeToScVal, rpc, xdr } from '@stellar/stellar-sdk';
import { getServer, NETWORK_PASSPHRASE } from '../client';
import { BucketState, ReleaseRequest, ReleaseStatus } from '@/types/bucket';
import { EmergencyRequest, EmergencyRequestStatus } from '@/types/emergency';
import { contract, getDummyAccount, DECIMALS, extractSimError } from './shared';

export const simulateRead = async (
  operationName: string,
  args: xdr.ScVal[]
): Promise<xdr.ScVal | null> => {
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

    interface RawBucketItem {
      id: string | number | bigint;
      sender: string;
      spending_balance: string | number | bigint;
      goal_balance: string | number | bigint;
      unlock_date: string | number | bigint;
      approval_required: boolean;
    }

    const rawItems = nativeVal as unknown as Array<Record<string, unknown>>;
    const buckets = rawItems.map((item) => {
      const isApproval = item.approval_required === true || item.approval_required === 1 || String(item.approval_required).toLowerCase() === 'true';
      return {
        id: Number(item.id),
        sender: String(item.sender),
        spendingBalance: Number(item.spending_balance) / DECIMALS,
        goalBalance: Number(item.goal_balance) / DECIMALS,
        unlockDate: Number(item.unlock_date),
        approvalRequired: isApproval,
        // Use _isApprovalBucket as the SOURCE OF TRUTH for approval status in the UI
        // This bypasses any data flow issues with the approvalRequired field
        _isApprovalBucket: isApproval,
      };
    });

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
    const bucketsWithRelease = await Promise.all(
      bucketsWithEmergency.map(async (bucket) => {
        const isApproval = bucket._isApprovalBucket || bucket.approvalRequired;
        if (isApproval && bucket.goalBalance > 0) {
          try {
            const releaseReq = await fetchReleaseRequest(receiverAddress, bucket.id);
            return { ...bucket, approvalRequired: true, releaseRequest: releaseReq || undefined, _reqFetched: true };
          } catch {
            return { ...bucket, approvalRequired: true, _reqFetched: true };
          }
        }
        return { ...bucket, _reqFetched: !!isApproval, approvalRequired: !!isApproval };
      })
    );
    // DEBUG: log final values before returning
    console.warn('[INGAT_FINAL] buckets:', bucketsWithRelease.map(b => ({ id: b.id, appr: b.approvalRequired, req: b._reqFetched, hasIs: '_isApprovalBucket' in b })));
    return bucketsWithRelease;
  } catch (err) {
    console.error('Error fetching bucket balances:', err);
    throw err;
  }
};

export const fetchReleaseRequest = async (
  receiverAddress: string,
  bucketId: number
): Promise<ReleaseRequest | null> => {
  try {
    const receiverScVal = Address.fromString(receiverAddress).toScVal();
    const bucketIdScVal = nativeToScVal(bucketId, { type: 'u32' });

    const retval = await simulateRead('get_release_request', [receiverScVal, bucketIdScVal]);
    if (!retval) return null;

    const nativeVal = scValToNative(retval);
    if (!nativeVal) return null;

    let statusStr: ReleaseStatus = 'Pending';
    const rawStatus = nativeVal.status;
    if (rawStatus === 'Approved' || rawStatus === 1 || (typeof rawStatus === 'object' && rawStatus.tag === 'Approved')) {
      statusStr = 'Approved';
    } else if (rawStatus === 'Executed' || rawStatus === 2 || (typeof rawStatus === 'object' && rawStatus.tag === 'Executed')) {
      statusStr = 'Executed';
    } else {
      const str = String(rawStatus);
      if (str.includes('Pending') || str.includes('0')) statusStr = 'Pending';
      else if (str.includes('Approved') || str.includes('1')) statusStr = 'Approved';
      else if (str.includes('Executed') || str.includes('2')) statusStr = 'Executed';
    }

    return {
      requestedAt: Number(nativeVal.requested_at),
      gracePeriodEndsAt: Number(nativeVal.grace_period_ends_at),
      status: statusStr,
    };
  } catch (err) {
    console.error('Error fetching release request:', err);
    return null;
  }
};
