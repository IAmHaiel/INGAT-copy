import { rpc, nativeToScVal, Address } from '@stellar/stellar-sdk';

async function main() {
  const server = new rpc.Server('https://soroban-testnet.stellar.org');
  const contractId = 'CCIXHEXJULBZSRCB5DOMRFB24F73LVNKEVYNB5SPNFW7HV7EHRGKBHFF';
  
  const latest = await server.getLatestLedger();
  const startLedger = Math.max(1, latest.sequence - 17280 * 7); // Last 7 days
  
  const depositSymbolXdr = nativeToScVal('deposit', { type: 'symbol' }).toXDR('base64');
  
  const response = await server.getEvents({
    startLedger,
    filters: [
      {
        type: 'contract',
        contractIds: [contractId],
        topics: [
          [depositSymbolXdr],
          ['*'],
          ['*']
        ], 
      },
    ],
    limit: 100,
  });
  console.log("Found events:", response.events.length);
}

main().catch(console.error);
