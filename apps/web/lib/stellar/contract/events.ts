import { Address, nativeToScVal, scValToNative } from '@stellar/stellar-sdk';
import { server, CONTRACT_ID } from '../client';
import { DepositAllocation } from '@/types/transaction';
import { DECIMALS } from './shared';

const LEDGERS_PER_DAY = 17_280; // ~24h at 5s/ledger

export const parseDepositEvent = (
  eventValue: any,
  txHash: string,
  ledgerClosedAt: string | number,
  sender: string,
  receiver: string
): DepositAllocation => {
  const valueNative = scValToNative(eventValue);
  const amount = Number(valueNative[0]) / DECIMALS;
  const splitRatio = Number(valueNative[1]);
  const unlockDate = Number(valueNative[2]);

  const timestamp = typeof ledgerClosedAt === 'string'
    ? Math.floor(new Date(ledgerClosedAt).getTime() / 1000)
    : ledgerClosedAt;

  return {
    id: txHash,
    sender,
    receiver,
    amount,
    splitRatio,
    unlockDate,
    timestamp,
    goalLabel: null,
  };
};

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
            [senderScValXdr]
          ],
        },
      ],
      limit: 1000,
    });

    const allocations: DepositAllocation[] = response.events.map((event) => {
      // Topics: [symbol("deposit"), sender_address, receiver_address]
      // Value: tuple (amount: i128, split_ratio: u32, unlock_date: u64)
      const receiverScVal = event.topic[2];
      const receiver = Address.fromScVal(receiverScVal).toString();

      return parseDepositEvent(
        event.value,
        event.txHash,
        event.ledgerClosedAt,
        senderAddress,
        receiver
      );
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

    const response = await server.getEvents({
      startLedger,
      filters: [
        {
          type: 'contract',
          contractIds: [CONTRACT_ID],
          topics: [
            [depositSymbolXdr]
          ],
        },
      ],
      limit: 1000,
    });

    const allocations: DepositAllocation[] = response.events
      .filter((event) => {
        if (!event.topic || event.topic.length < 3) return false;
        const receiverScVal = event.topic[2];
        const eventReceiver = Address.fromScVal(receiverScVal).toString();
        return eventReceiver === receiverAddress;
      })
      .map((event) => {
        const senderScVal = event.topic[1];
        const sender = Address.fromScVal(senderScVal).toString();

        return parseDepositEvent(
          event.value,
          event.txHash,
          event.ledgerClosedAt,
          sender,
          receiverAddress
        );
      });

    return allocations.reverse();
  } catch (err) {
    console.error('Error fetching received deposit events:', err);
    return [];
  }
};

/**
 * Fetch a deposit transaction by its hash and extract the DepositAllocation data.
 * Uses the RPC getTransaction method (24h retention window on testnet).
 * Returns null if the transaction is not found or is not a deposit transaction.
 */
export const fetchTransactionByHash = async (txHash: string): Promise<DepositAllocation | null> => {
  try {
    const txResponse = await server.getTransaction(txHash);

    if (txResponse.status !== 'SUCCESS') {
      return null;
    }

    const successResponse = txResponse as any;
    const { events, createdAt } = successResponse;

    // Search all contract events for our deposit event
    for (const operationEvents of events.contractEventsXdr) {
      for (const contractEvent of operationEvents) {
        // Check it's a contract-type event (not system/diagnostic)
        if (contractEvent.type().value !== 1) continue; // 1 = contract type

        const body = contractEvent.body().v0();
        const topics = body.topics();

        // Our deposit event has 3 topics: symbol("deposit"), sender, receiver
        if (topics.length !== 3) continue;

        // Check topic[0] is the "deposit" symbol
        const topicSymbol = scValToNative(topics[0]);
        if (topicSymbol !== 'deposit') continue;

        // Extract sender and receiver from topics
        const sender = Address.fromScVal(topics[1]).toString();
        const receiver = Address.fromScVal(topics[2]).toString();

        return parseDepositEvent(
          body.data(),
          txHash,
          createdAt,
          sender,
          receiver
        );
      }
    }

    // No deposit event found in this transaction
    return null;
  } catch (err) {
    console.error('Error fetching transaction by hash:', err);
    return null;
  }
};
