import { Contract, Address, TransactionBuilder, Account, scValToNative, nativeToScVal, rpc } from '@stellar/stellar-sdk';
import { server, CONTRACT_ID, NETWORK_PASSPHRASE } from './client';
import { BucketState } from '@/types/bucket';
import { DepositAllocation } from '@/types/transaction';

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
    return assembledTx.build().toXDR();
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
    return assembledTx.build().toXDR();
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
    return assembledTx.build().toXDR();
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

const LEDGERS_PER_DAY = 17_280; // ~24h at 5s/ledger

export const fetchDepositEvents = async (senderAddress: string): Promise<DepositAllocation[]> => {
  if (!CONTRACT_ID) {
    return [];
  }

  try {
    const latestLedgerResponse = await server.getLatestLedger();
    const latestLedger = latestLedgerResponse.sequence;
    const startLedger = Math.max(1, latestLedger - LEDGERS_PER_DAY);

    // Build topic filters: deposit events where sender matches
    const depositSymbolXdr = nativeToScVal('deposit', { type: 'symbol' }).toXDR('base64');
    const senderScValXdr = Address.fromString(senderAddress).toScVal().toXDR('base64');

    const response = await server.getEvents({
      startLedger,
      filters: [
        {
          type: 'contract',
          contractIds: [CONTRACT_ID],
          topics: [
            [depositSymbolXdr],
            [senderScValXdr],
            ['*']
          ],
        },
      ],
      limit: 100,
    });

    const allocations: DepositAllocation[] = response.events.map((event) => {
      // Topics: [symbol("deposit"), sender_address, receiver_address]
      // Value: tuple (amount: i128, split_ratio: u32, unlock_date: u64)
      const receiverScVal = event.topic[2];
      const receiver = Address.fromScVal(receiverScVal).toString();

      const valueNative = scValToNative(event.value);
      const amount = Number(valueNative[0]) / DECIMALS;
      const splitRatio = Number(valueNative[1]);
      const unlockDate = Number(valueNative[2]);

      const timestamp = Math.floor(new Date(event.ledgerClosedAt).getTime() / 1000);

      return {
        id: event.txHash,
        sender: senderAddress,
        receiver,
        amount,
        splitRatio,
        unlockDate,
        timestamp,
      };
    });

    // Return most recent first
    return allocations.reverse();
  } catch (err) {
    console.error('Error fetching deposit events:', err);
    return [];
  }
};

export const fetchReceivedDepositEvents = async (receiverAddress: string): Promise<DepositAllocation[]> => {
  if (!CONTRACT_ID) {
    return [];
  }

  try {
    const latestLedgerResponse = await server.getLatestLedger();
    const latestLedger = latestLedgerResponse.sequence;
    const startLedger = Math.max(1, latestLedger - LEDGERS_PER_DAY);

    const depositSymbolXdr = nativeToScVal('deposit', { type: 'symbol' }).toXDR('base64');
    const receiverScValXdr = Address.fromString(receiverAddress).toScVal().toXDR('base64');

    const response = await server.getEvents({
      startLedger,
      filters: [
        {
          type: 'contract',
          contractIds: [CONTRACT_ID],
          topics: [
            [depositSymbolXdr],
            ['*'],
            [receiverScValXdr]
          ],
        },
      ],
      limit: 100,
    });

    const allocations: DepositAllocation[] = response.events.map((event) => {
      const senderScVal = event.topic[1];
      const sender = Address.fromScVal(senderScVal).toString();

      const valueNative = scValToNative(event.value);
      const amount = Number(valueNative[0]) / DECIMALS;
      const splitRatio = Number(valueNative[1]);
      const unlockDate = Number(valueNative[2]);

      const timestamp = Math.floor(new Date(event.ledgerClosedAt).getTime() / 1000);

      return {
        id: event.txHash,
        sender,
        receiver: receiverAddress,
        amount,
        splitRatio,
        unlockDate,
        timestamp,
      };
    });

    return allocations.reverse();
  } catch (err) {
    console.error('Error fetching received deposit events:', err);
    return [];
  }
};