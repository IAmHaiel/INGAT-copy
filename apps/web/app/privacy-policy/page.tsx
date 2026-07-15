import PrivacyPolicyContainer from '@/components/containers/PrivacyPolicyContainer';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | INGAT Remit',
  description: 'Learn how INGAT Remit protects, stores, and handles your financial split records and blockchain data.',
};

export default function PrivacyPolicyPage() {
  return <PrivacyPolicyContainer />;
}
