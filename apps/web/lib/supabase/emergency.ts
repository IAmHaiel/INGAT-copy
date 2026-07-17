import { EmergencyRequestRow, EmergencyRequestInsert } from './types';
import { SupabaseClient } from '@supabase/supabase-js';

const TABLE = 'emergency_requests';

function getClient(client?: SupabaseClient | null): SupabaseClient | null {
  return client ?? null;
}

export async function insertEmergencyRequest(
  data: EmergencyRequestInsert,
  client?: SupabaseClient | null
): Promise<void> {
  const sb = getClient(client);
  if (!sb) {
    console.warn('[Supabase] Client not configured.');
    return;
  }

  const { error } = await sb.from(TABLE).insert(data);
  if (error) {
    if (error.code === '23505') {
      console.info('[Supabase] Emergency request already persisted:', data.tx_hash);
      return;
    }
    console.error('[Supabase] Failed to insert emergency request:', error.message);
  }
}

export async function updateEmergencyRequestStatus(
  txHash: string,
  status: 'cancelled' | 'executed',
  updateTxHash: string,
  client?: SupabaseClient | null
): Promise<void> {
  const sb = getClient(client);
  if (!sb) {
    console.warn('[Supabase] Client not configured.');
    return;
  }

  const updateData: Record<string, string> = { status };
  if (status === 'cancelled') {
    updateData.cancel_tx_hash = updateTxHash;
  } else {
    updateData.execute_tx_hash = updateTxHash;
  }

  const { error } = await sb
    .from(TABLE)
    .update(updateData)
    .eq('tx_hash', txHash);

  if (error) {
    console.error('[Supabase] Failed to update emergency request status:', error.message);
  }
}

export async function getActiveEmergencyRequest(
  receiverAddress: string,
  bucketId: number,
  client?: SupabaseClient | null
): Promise<EmergencyRequestRow | null> {
  const sb = getClient(client);
  if (!sb) return null;

  const { data, error } = await sb
    .from(TABLE)
    .select('*')
    .eq('receiver_address', receiverAddress)
    .eq('bucket_id', bucketId)
    .eq('status', 'pending')
    .maybeSingle();

  if (error) {
    console.error('[Supabase] Failed to fetch active emergency request:', error.message);
    return null;
  }
  return data as EmergencyRequestRow | null;
}

export async function getSenderPendingRequests(
  senderAddress: string,
  client?: SupabaseClient | null
): Promise<EmergencyRequestRow[]> {
  const sb = getClient(client);
  if (!sb) return [];

  const { data, error } = await sb
    .from(TABLE)
    .select('*')
    .eq('sender_address', senderAddress)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Supabase] Failed to fetch sender pending emergency requests:', error.message);
    return [];
  }
  return (data as EmergencyRequestRow[]) || [];
}
