import { useEffect } from 'react';
import { toast } from 'sonner';

export const useTxSuccessToast = (
  txHash: string | null,
  label: string,
  description = 'Successfully completed transaction.'
) => {
  useEffect(() => {
    if (txHash) {
      toast.success(label, {
        description,
        action: {
          label: 'View Tx',
          onClick: () => window.open(`https://stellar.expert/explorer/testnet/tx/${txHash}`, '_blank')
        },
        duration: 10000
      });
    }
  }, [txHash, label, description]);
};

export const useTxErrorToast = (error: string | null, label: string) => {
  useEffect(() => {
    if (error) {
      toast.error(label, {
        description: error,
        duration: 5000
      });
    }
  }, [error, label]);
};
