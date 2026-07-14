const { rpc, nativeToScVal, Address } = require('@stellar/stellar-sdk');

const server = new rpc.Server('https://soroban-testnet.stellar.org');
const CONTRACT_ID = 'CDHP4KWHKFOODLUSR4B4KWFIPXCI3NAUGIBENSISTWZS4TU7O3NGHBKL';
const DECIMALS = 10000000;
const LEDGERS_PER_DAY = 17280;

async function test() {
  try {
    const latestLedgerResponse = await server.getLatestLedger();
    const latestLedger = latestLedgerResponse.sequence;
    const startLedger = Math.max(1, latestLedger - LEDGERS_PER_DAY * 6);
    
    const depositSymbolXdr = nativeToScVal('deposit', { type: 'symbol' }).toXDR('base64');

    const events = await server.getEvents({
      startLedger: startLedger,
      filters: [
        {
          type: 'contract',
          contractIds: [CONTRACT_ID],

        }
      ]
    });
    console.log('Success, fetched events:', events.events.length);
  } catch (err) {
    console.error('Error caught:');
    console.error('Message:', err.message);
    if (err.response) {
      console.error('Response data:', err.response.data);
    } else {
      console.error(err);
    }
  }
}

test();
