import { Contract, TransactionBuilder, Account, rpc, xdr } from '@stellar/stellar-sdk';
import { getServer, CONTRACT_ID, NETWORK_PASSPHRASE } from '../client';

export const contract = new Contract(CONTRACT_ID);
export const DECIMALS = 10_000_000; // 7 decimals for Stellar assets

export const getDummyAccount = () => {
  return new Account('GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF', '0');
};

export const scaleAmount = (amount: number): bigint => {
  return BigInt(Math.round(amount * DECIMALS));
};

export const extractSimError = (sim: rpc.Api.SimulateTransactionResponse): string => {
  if (rpc.Api.isSimulationRestore(sim)) {
    return 'Simulation requires restore';
  }
  if (rpc.Api.isSimulationSuccess(sim)) {
    return 'No error';
  }
  const errResponse = sim as unknown as { error?: string; result?: { error?: string } };
  return errResponse.error || errResponse.result?.error || 'Simulation failed';
};

export const buildContractCallXDR = async (
  sourceAddress: string,
  operationName: string,
  args: xdr.ScVal[],
  errorContext: string
): Promise<string> => {
  const server = getServer();
  const accountResponse = await server.getAccount(sourceAddress);
  const tx = new TransactionBuilder(accountResponse, {
    fee: '100',
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(operationName, ...args))
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationSuccess(sim)) {
    const assembledTx = rpc.assembleTransaction(tx, sim);
    return assembledTx.build().toXDR();
  } else {
    throw new Error(extractSimError(sim) || `Simulation failed for ${errorContext}`);
  }
};
