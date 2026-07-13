import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBanner } from '@/components/ui/feedback/ErrorBanner';

jest.mock('lucide-react', () => ({
  ShieldCheck: ({ size }: { size: number }) => <span data-testid="shield-icon" />,
  Wallet: ({ size }: { size: number }) => <span data-testid="wallet-icon" />,
  AlertCircle: ({ className }: { className: string }) => <span data-testid="alert-icon" />,
  X: ({ className }: { className: string }) => <span data-testid="x-icon" />,
  Send: ({ size }: { size: number }) => <span data-testid="send-icon" />,
}));

describe('ErrorBanner', () => {
  it('renders the error message', () => {
    render(<ErrorBanner message="Something went wrong" />);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByTestId('alert-icon')).toBeInTheDocument();
  });

  it('shows dismiss button when onDismiss is provided', () => {
    const onDismiss = jest.fn();
    render(<ErrorBanner message="Error occurred" onDismiss={onDismiss} />);

    expect(screen.getByRole('button', { name: 'Dismiss error' })).toBeInTheDocument();
    expect(screen.getByTestId('x-icon')).toBeInTheDocument();
  });

  it('does not show dismiss button when onDismiss is not provided', () => {
    render(<ErrorBanner message="Error occurred" />);

    expect(screen.queryByRole('button', { name: 'Dismiss error' })).not.toBeInTheDocument();
    expect(screen.queryByTestId('x-icon')).not.toBeInTheDocument();
  });

  it('calls onDismiss when dismiss button is clicked', () => {
    const onDismiss = jest.fn();
    render(<ErrorBanner message="Error occurred" onDismiss={onDismiss} />);

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss error' }));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
