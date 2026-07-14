import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ConnectWalletButton from '@/components/ui/wallet/ConnectWalletButton';

jest.mock('lucide-react', () => ({
  ShieldCheck: () => <span data-testid="shield-icon" />,
  Wallet: () => <span data-testid="wallet-icon" />,
  AlertCircle: () => <span data-testid="alert-icon" />,
  X: () => <span data-testid="x-icon" />,
  Send: () => <span data-testid="send-icon" />,
}));

describe('ConnectWalletButton', () => {
  const defaultProps = {
    onConnect: jest.fn(),
    isConnecting: false,
    isConnected: false,
    publicKey: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders Connect Wallet button when not connected', () => {
    render(<ConnectWalletButton {...defaultProps} />);

    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
    expect(screen.getByTestId('wallet-icon')).toBeInTheDocument();
  });

  it("shows 'Connecting Wallet...' when isConnecting is true", () => {
    render(<ConnectWalletButton {...defaultProps} isConnecting={true} />);

    expect(screen.getByText('Connecting Wallet...')).toBeInTheDocument();
    expect(screen.queryByText('Connect Wallet')).not.toBeInTheDocument();
  });

  it("shows 'Connected' when isConnected and publicKey provided", () => {
    render(
      <ConnectWalletButton
        {...defaultProps}
        isConnected={true}
        publicKey="GABCDEF1234567890"
      />
    );

    expect(screen.getByText('Connected')).toBeInTheDocument();
    expect(screen.getByTestId('shield-icon')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('calls onConnect when button is clicked', () => {
    const onConnect = jest.fn();
    render(<ConnectWalletButton {...defaultProps} onConnect={onConnect} />);

    fireEvent.click(screen.getByRole('button'));

    expect(onConnect).toHaveBeenCalledTimes(1);
  });

  it('button is disabled when connecting', () => {
    render(<ConnectWalletButton {...defaultProps} isConnecting={true} />);

    expect(screen.getByRole('button')).toBeDisabled();
  });
});
