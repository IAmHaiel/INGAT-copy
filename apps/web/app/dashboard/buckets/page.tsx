import React from 'react';
import BucketHistoryPageContainer from '@/components/containers/BucketHistoryPageContainer';

export const metadata = {
  title: 'INGAT — Remittance Bucket History',
  description: 'View live on-chain status, split balances, release lock times, and withdrawal hashes of your remittances.',
};

export default function BucketHistoryPage() {
  return <BucketHistoryPageContainer />;
}
