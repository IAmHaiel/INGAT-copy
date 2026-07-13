import { Contract, Address, TransactionBuilder, Account, scValToNative, nativeToScVal, rpc, Transaction } from '@stellar/stellar-sdk';
import { server, CONTRACT_ID, NETWORK_PASSPHRASE } from './client';
import { BucketState } from '@/types/bucket';

const contract = new Contract(CONTRACT_ID);
const DECIMALS = 10_000_000; // 7 decimals for Stellar assets

const getDummyAccount = () => {
  return new Account('GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF', '0');
};

export const fetchBucketBalances = async (receiverAddress: string): Promise<BucketState | null> => {
  try {
    const receiverScVal = Address.fromString(receiverAddress).toScVal();
    const dummySource = getDummyAccount();
    
    const tx = new TransactionBuilder(dummySource, {
      fee: '100',
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(contract.call('get_bucket', receiverScVal))
      .setTimeout(30)
      .build();

    const sim = await server.simulateTransaction(tx);
    
    if (rpc.Api.isSimulationSuccess(sim) && sim.result?.retval) {
      const nativeVal = scValToNative(sim.result.retval);
      if (!nativeVal) {
        return {
          spendingBalance: 0,
          goalBalance: 0,
          unlockDate: 0,
        };
      }
      return {
        spendingBalance: Number(nativeVal.spending_balance) / DECIMALS,
        goalBalance: Number(nativeVal.goal_balance) / DECIMALS,
        unlockDate: Number(nativeVal.unlock_date),
      };
    }
    return {
      spendingBalance: 0,
      goalBalance: 0,
      unlockDate: 0,
    };
  } catch (err) {
    console.error('Error fetching bucket balances:', err);
    return null;
  }
};

export const buildDepositTx = async (
  senderAddress: string,
  receiverAddress: string,
  amount: number,
  splitRatio: number,
  unlockDate: number
): Promise<string> => {
  const senderScVal = Address.fromString(senderAddress).toScVal();
  const receiverScVal = Address.fromString(receiverAddress).toScVal();
  
  const scaledAmount = BigInt(Math.round(amount * DECIMALS));
  const amountScVal = nativeToScVal(scaledAmount, { type: 'i128' });
  const splitRatioScVal = nativeToScVal(splitRatio, { type: 'u32' });
  const unlockDateScVal = nativeToScVal(BigInt(unlockDate), { type: 'u64' });

  const accountResponse = await server.getAccount(senderAddress);
  const tx = new TransactionBuilder(accountResponse, {
    fee: '100',
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call('deposit', senderScVal, receiverScVal, amountScVal, splitRatioScVal, unlockDateScVal))
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationSuccess(sim)) {
    const assembledTx = rpc.assembleTransaction(tx, sim);
    return (assembledTx as unknown as Transaction).toXDR();
  } else {
    throw new Error((sim as { error?: string }).error || (sim as { result?: { error?: string } }).result?.error || 'Simulation failed for deposit transaction');
  }
};

export const buildWithdrawSpendingTx = async (
  receiverAddress: string,
  amount: number
): Promise<string> => {
  const receiverScVal = Address.fromString(receiverAddress).toScVal();
  
  const scaledAmount = BigInt(Math.round(amount * DECIMALS));
  const amountScVal = nativeToScVal(scaledAmount, { type: 'i128' });

  const accountResponse = await server.getAccount(receiverAddress);
  const tx = new TransactionBuilder(accountResponse, {
    fee: '100',
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call('withdraw_spending', receiverScVal, amountScVal))
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationSuccess(sim)) {
    const assembledTx = rpc.assembleTransaction(tx, sim);
    return (assembledTx as unknown as Transaction).toXDR();
  } else {
    throw new Error((sim as { error?: string }).error || (sim as { result?: { error?: string } }).result?.error || 'Simulation failed for spending withdrawal');
  }
};

export const buildWithdrawGoalTx = async (
  receiverAddress: string,
  amount: number
): Promise<string> => {
  const receiverScVal = Address.fromString(receiverAddress).toScVal();
  
  const scaledAmount = BigInt(Math.round(amount * DECIMALS));
  const amountScVal = nativeToScVal(scaledAmount, { type: 'i128' });

  const accountResponse = await server.getAccount(receiverAddress);
  const tx = new TransactionBuilder(accountResponse, {
    fee: '100',
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call('withdraw_goal', receiverScVal, amountScVal))
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationSuccess(sim)) {
    const assembledTx = rpc.assembleTransaction(tx, sim);
    return (assembledTx as unknown as Transaction).toXDR();
  } else {
    throw new Error((sim as { error?: string }).error || (sim as { result?: { error?: string } }).result?.error || 'Simulation failed for goal withdrawal');
  }
};

export const submitTransaction = async (signedXDR: string): Promise<string> => {
  const tx = TransactionBuilder.fromXDR(signedXDR, NETWORK_PASSPHRASE);
  const response = await server.sendTransaction(tx);
  
  if (response.status === 'ERROR') {
    throw new Error((response as { errorResult?: string; errorResultXdr?: string }).errorResult || (response as { errorResult?: string; errorResultXdr?: string }).errorResultXdr || 'Transaction submission failed');
  }
  
  let status = response.status as string;
  const hash = response.hash;
  
  while (status === 'PENDING') {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const txStatus = await server.getTransaction(hash);
    status = txStatus.status;
    if (status === 'SUCCESS') {
      return hash;
    } else if (status === 'FAILED') {
      throw new Error('Transaction execution failed on chain');
    }
  }
  
  if (status === 'SUCCESS') {
    return hash;
  }
  throw new Error('Transaction submission timeout or failure');
};
